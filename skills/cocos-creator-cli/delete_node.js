/**
 * Cocos Creator 场景(.fire)节点删除工具
 * 
 * 注意：删除节点不会从数组中移除元素（避免破坏索引），
 * 而是标记为已销毁并从父节点的 _children 中移除引用。
 * 
 * 用法：
 * node delete_node.js <场景文件路径> <节点索引|节点路径>
 * 
 * 示例：
 * node delete_node.js ../cocos/assets/main.fire 5
 * node delete_node.js ../cocos/assets/main.fire Canvas/Sprite
 * node delete_node.js ../cocos/assets/main.fire Sprite
 */

const fs = require('fs');
const path = require('path');

// cc.Object 的标志位
const ObjFlags = {
    Destroyed: 1,           // 已销毁
    RealDestroyed: 2,       // 真正销毁
    Destroying: 4,          // 正在销毁
    Deactivating: 8,        // 正在停用
    LockedInEditor: 256,    // 编辑器中锁定
    HideInHierarchy: 512,   // 在层级中隐藏
    IsAsset: 4096,          // 是资源
    DontDestroy: 4096,      // 切换场景时不销毁
    DontSave: 4096 << 1,    // 不保存
    EditorOnly: 4096 << 2,  // 仅编辑器
    Dirty: 4096 << 3,       // 已修改
};

// 查找节点索引
function findNodeIndex(data, nodeRef) {
    // 如果是数字，直接返回
    if (/^\d+$/.test(nodeRef)) {
        return parseInt(nodeRef);
    }
    
    // 否则按路径或名称查找
    const parts = nodeRef.split(/[\/.]/);
    let currentIndex = 1; // 从 Scene 开始
    
    // 找到 Scene 的子节点（通常是 Canvas）
    const scene = data[currentIndex];
    if (!scene || !scene._children || scene._children.length === 0) {
        return -1;
    }
    
    // 从第一个子节点开始搜索
    currentIndex = scene._children[0].__id__;
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const node = data[currentIndex];
        if (!node) return -1;
        
        if (node._name === part) {
            // 找到了，继续下一个路径部分
            if (i === parts.length - 1) {
                return currentIndex;
            }
            continue;
        }
        
        // 在子节点中查找
        if (node._children) {
            let found = false;
            for (const childRef of node._children) {
                const childIndex = childRef.__id__;
                const child = data[childIndex];
                if (child && child._name === part) {
                    currentIndex = childIndex;
                    found = true;
                    break;
                }
            }
            if (!found) return -1;
            
            // 如果是路径的最后一部分
            if (i === parts.length - 1) {
                return currentIndex;
            }
        } else {
            return -1;
        }
    }
    
    return currentIndex;
}

// 递归收集节点及其所有子节点和组件的索引
function collectNodeAndChildren(data, nodeIndex, collected = new Set()) {
    if (collected.has(nodeIndex)) return collected;
    
    const node = data[nodeIndex];
    if (!node) return collected;
    
    collected.add(nodeIndex);
    
    // 收集所有组件
    if (node._components) {
        for (const compRef of node._components) {
            const compIndex = compRef.__id__;
            collected.add(compIndex);
        }
    }
    
    // 递归收集子节点
    if (node._children) {
        for (const childRef of node._children) {
            collectNodeAndChildren(data, childRef.__id__, collected);
        }
    }
    
    return collected;
}

// 标记节点及其子节点为已销毁
function markAsDestroyed(data, indices) {
    for (const index of indices) {
        const obj = data[index];
        if (obj) {
            // 设置 Destroyed 标志
            obj._objFlags = (obj._objFlags || 0) | ObjFlags.Destroyed;
            // 清空父引用
            if (obj._parent) {
                obj._parent = null;
            }
            // 清空节点引用
            if (obj.node) {
                obj.node = null;
            }
        }
    }
}

// 从父节点的 _children 中移除引用
function removeFromParent(data, nodeIndex) {
    const node = data[nodeIndex];
    if (!node || !node._parent) return;
    
    const parentIndex = node._parent.__id__;
    const parent = data[parentIndex];
    
    if (parent && parent._children) {
        parent._children = parent._children.filter(childRef => {
            return childRef.__id__ !== nodeIndex;
        });
    }
}

// 主函数
function deleteNode(firePath, nodeRef) {
    // 读取场景文件
    if (!fs.existsSync(firePath)) {
        console.log(`错误: 场景文件 ${firePath} 不存在`);
        return false;
    }
    
    const content = fs.readFileSync(firePath, 'utf8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
        console.log('错误: 无效的场景文件格式');
        return false;
    }
    
    // 查找节点
    const nodeIndex = findNodeIndex(data, nodeRef);
    if (nodeIndex < 0 || nodeIndex >= data.length) {
        console.log(`错误: 找不到节点 "${nodeRef}"`);
        return false;
    }
    
    const node = data[nodeIndex];
    if (!node || node.__type__ !== 'cc.Node') {
        console.log(`错误: 索引 ${nodeIndex} 不是有效的节点`);
        return false;
    }
    
    // 检查是否是根节点或场景
    if (nodeIndex <= 1) {
        console.log(`错误: 不能删除根节点或场景`);
        return false;
    }
    
    console.log(`找到节点: ${node._name} (#${nodeIndex})`);
    
    // 收集所有需要删除的索引
    const indicesToDelete = collectNodeAndChildren(data, nodeIndex);
    console.log(`将删除 ${indicesToDelete.size} 个对象（节点 + 子节点 + 组件）`);
    
    // 显示子节点信息
    if (node._children && node._children.length > 0) {
        console.log(`子节点:`);
        node._children.forEach(childRef => {
            const child = data[childRef.__id__];
            if (child) {
                console.log(`  - ${child._name} (#${childRef.__id__})`);
            }
        });
    }
    
    // 从父节点移除引用
    removeFromParent(data, nodeIndex);
    
    // 标记为已销毁
    markAsDestroyed(data, indicesToDelete);
    
    // 保存文件
    fs.writeFileSync(firePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`\n✓ 节点 "${node._name}" 已删除`);
    console.log(`  场景文件已更新: ${firePath}`);
    
    return true;
}

// 主程序
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('用法: node delete_node.js <场景文件路径> <节点索引|节点路径>');
    console.log('');
    console.log('示例:');
    console.log('  node delete_node.js ../cocos/assets/main.fire 5');
    console.log('  node delete_node.js ../cocos/assets/main.fire Canvas/Sprite');
    console.log('  node delete_node.js ../cocos/assets/main.fire Sprite');
    console.log('');
    console.log('注意: 删除节点会同时删除其所有子节点和组件');
    process.exit(1);
}

const firePath = args[0];
const nodeRef = args[1];

// 如果是相对路径，转换为绝对路径
const absolutePath = path.isAbsolute(firePath) ? firePath : path.join(__dirname, firePath);

deleteNode(absolutePath, nodeRef);
