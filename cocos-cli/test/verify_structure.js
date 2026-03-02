/**
 * 验证 .fire 文件结构是否符合 Cocos Creator 2.4.x 规范
 * 
 * 规则：
 * 1. 索引 0: cc.SceneAsset
 * 2. 索引 1: cc.Scene
 * 3. 索引 2+: 深度优先遍历的节点
 * 4. 每个节点的组件紧跟在该节点之后（如果有子节点，先遍历子节点）
 * 5. 所有 __id__ 引用必须有效
 */

const fs = require('fs');
const path = require('path');

class FireValidator {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  assert(condition, message) {
    if (!condition) {
      this.errors.push(message);
    }
    return condition;
  }

  validate() {
    this.errors = [];
    
    // 1. 基本结构检查
    this.validateBasicStructure();
    
    // 2. 验证所有 __id__ 引用
    this.validateReferences();
    
    // 3. 验证深度优先顺序
    this.validateDepthFirstOrder();
    
    return {
      valid: this.errors.length === 0,
      errors: this.errors
    };
  }

  validateBasicStructure() {
    // 检查至少有2项
    this.assert(this.data.length >= 2, `文件至少需要2项，实际有${this.data.length}项`);
    
    if (this.data.length < 2) return;
    
    // 检查第0项是 SceneAsset
    this.assert(
      this.data[0].__type__ === 'cc.SceneAsset',
      `索引0必须是 cc.SceneAsset，实际是 ${this.data[0].__type__}`
    );
    
    // 检查第1项是 Scene
    this.assert(
      this.data[1].__type__ === 'cc.Scene',
      `索引1必须是 cc.Scene，实际是 ${this.data[1].__type__}`
    );
  }

  validateReferences() {
    const maxId = this.data.length - 1;
    
    this.data.forEach((item, index) => {
      // 检查 _parent 引用
      if (item._parent && item._parent.__id__ !== undefined) {
        this.assert(
          item._parent.__id__ >= 0 && item._parent.__id__ <= maxId,
          `索引${index}的 _parent.__id__=${item._parent.__id__} 超出范围 [0, ${maxId}]`
        );
      }
      
      // 检查 _children 引用
      if (item._children) {
        item._children.forEach((child, i) => {
          this.assert(
            child.__id__ >= 0 && child.__id__ <= maxId,
            `索引${index}的 _children[${i}].__id__=${child.__id__} 超出范围 [0, ${maxId}]`
          );
        });
      }
      
      // 检查 _components 引用
      if (item._components) {
        item._components.forEach((comp, i) => {
          this.assert(
            comp.__id__ >= 0 && comp.__id__ <= maxId,
            `索引${index}的 _components[${i}].__id__=${comp.__id__} 超出范围 [0, ${maxId}]`
          );
        });
      }
    });
  }

  validateDepthFirstOrder() {
    if (this.data.length < 3) return;
    
    // 获取根节点（索引2）
    const rootNode = this.data[2];
    if (!rootNode || rootNode.__type__ !== 'cc.Node') {
      this.assert(false, `索引2必须是根节点（cc.Node）`);
      return;
    }
    
    // 按深度优先遍历，记录期望的访问顺序
    const visited = new Set();
    const order = [];
    const isolated = []; // 记录孤立项
    
    const visit = (item, index, expectedParentId) => {
      if (visited.has(index)) {
        this.assert(false, `索引${index}被重复访问`);
        return;
      }
      visited.add(index);
      order.push(index);
      
      // 验证父节点
      if (expectedParentId !== undefined && item._parent) {
        this.assert(
          item._parent.__id__ === expectedParentId,
          `索引${index}的父节点应该是${expectedParentId}，实际是${item._parent.__id__}`
        );
      }
      
      // 如果是节点，先遍历子节点，再遍历组件
      if (item.__type__ === 'cc.Node') {
        // 先遍历子节点（深度优先）
        if (item._children) {
          item._children.forEach(childRef => {
            const childIndex = childRef.__id__;
            const child = this.data[childIndex];
            if (child) {
              visit(child, childIndex, index);
            }
          });
        }
        
        // 再遍历组件
        if (item._components) {
          item._components.forEach(compRef => {
            const compIndex = compRef.__id__;
            const comp = this.data[compIndex];
            if (comp) {
              // 验证是组件不是节点
              this.assert(
                comp.__type__ !== 'cc.Node',
                `索引${compIndex}应该是组件，但类型是 ${comp.__type__}`
              );
              visit(comp, compIndex, undefined); // 组件不需要验证父节点
            }
          });
        }
      }
    };
    
    // 从根节点开始遍历
    visit(rootNode, 2, 1); // 根节点的父节点是 Scene（索引1）
    
    // 检查孤立项（允许的）
    for (let i = 2; i < this.data.length; i++) {
      if (!visited.has(i)) {
        const item = this.data[i];
        // 孤立项：没有父节点的节点，或没有 node 引用的组件
        if (item.__type__ === 'cc.Node') {
          if (!item._parent || item._parent.__id__ === undefined) {
            isolated.push({ index: i, type: item.__type__, name: item._name });
          } else {
            this.assert(false, `索引${i} (${item._name}) 有父节点但未被遍历到`);
          }
        } else {
          // 组件类
          if (!item.node || item.node.__id__ === undefined) {
            isolated.push({ index: i, type: item.__type__, name: '(component)' });
          } else {
            this.assert(false, `索引${i} (${item.__type__}) 有node引用但未被遍历到`);
          }
        }
      }
    }
    
    // 记录孤立项信息（不是错误，只是提示）
    if (isolated.length > 0) {
      console.log(`   ℹ️ 发现 ${isolated.length} 个孤立项（允许）:`);
      isolated.forEach(item => {
        console.log(`      #${item.index}: ${item.type} - ${item.name}`);
      });
    }
  }

  // 打印节点树结构（用于调试）
  printTree() {
    console.log('\n节点树结构：\n');
    
    const printNode = (item, index, depth = 0) => {
      const indent = '  '.repeat(depth);
      const prefix = depth === 0 ? '' : '└── ';
      const type = item.__type__ === 'cc.Node' ? 'Node' : item.__type__;
      const name = item._name || '(unnamed)';
      
      console.log(`${indent}${prefix}#${index} ${type}: ${name}`);
      
      if (item.__type__ === 'cc.Node') {
        // 先打印子节点
        if (item._children) {
          item._children.forEach(childRef => {
            const child = this.data[childRef.__id__];
            if (child) {
              printNode(child, childRef.__id__, depth + 1);
            }
          });
        }
        
        // 再打印组件
        if (item._components) {
          item._components.forEach(compRef => {
            const comp = this.data[compRef.__id__];
            if (comp) {
              const compIndent = '  '.repeat(depth + 1);
              console.log(`${compIndent}└── #${compRef.__id__} Component: ${comp.__type__}`);
            }
          });
        }
      }
    };
    
    if (this.data.length >= 3) {
      printNode(this.data[2], 2);
    }
    
    console.log('');
  }
}

// 命令行入口
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('用法: node verify_structure.js <fire文件路径> [--verbose]');
    process.exit(1);
  }
  
  const filePath = args[0];
  const verbose = args.includes('--verbose');
  
  if (!fs.existsSync(filePath)) {
    console.error(`错误: 文件不存在 ${filePath}`);
    process.exit(1);
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const validator = new FireValidator(data);
    
    if (verbose) {
      validator.printTree();
    }
    
    const result = validator.validate();
    
    if (result.valid) {
      console.log(`✅ ${path.basename(filePath)} 验证通过`);
      console.log(`   共 ${data.length} 项`);
      process.exit(0);
    } else {
      console.log(`❌ ${path.basename(filePath)} 验证失败`);
      result.errors.forEach(err => console.log(`   - ${err}`));
      process.exit(1);
    }
  } catch (err) {
    console.error(`错误: 无法解析文件 ${filePath}`);
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = { FireValidator };

if (require.main === module) {
  main();
}
