/**
 * Cocos Creator 场景(.fire)节点添加工具
 * 
 * 用法：
 * node add_node.js <场景文件路径> <父节点索引|父节点路径> <节点名称> [选项]
 * 
 * 示例：
 * node add_node.js ../cocos/assets/main.fire 2 NewNode
 * node add_node.js ../cocos/assets/main.fire Canvas NewNode
 * node add_node.js ../cocos/assets/main.fire Canvas/NewNode ChildNode
 * 
 * 选项：
 * --type=sprite    添加 Sprite 组件
 * --type=label     添加 Label 组件
 * --type=button    添加 Button 组件
 * --type=layout    添加 Layout 组件
 * --type=widget    添加 Widget 组件
 * --type=particle  添加 ParticleSystem 组件
 * --type=empty     空节点（默认）
 * --x=100          设置 x 坐标
 * --y=200          设置 y 坐标
 * --width=100      设置宽度
 * --height=50     设置高度
 * --at=1           插入到第 N 个子节点位置
 * --active=false   设置激活状态
 */

const fs = require('fs');
const path = require('path');
const { Components, generateId } = require('./components');

// 创建默认节点数据
function createNodeData(name, parentId, options = {}) {
    return {
        "__type__": "cc.Node",
        "_name": name,
        "_objFlags": 0,
        "_parent": { "__id__": parentId },
        "_children": [],
        "_active": options.active !== false,
        "_components": [],
        "_prefab": null,
        "_opacity": 255,
        "_color": {
            "__type__": "cc.Color",
            "r": 255,
            "g": 255,
            "b": 255,
            "a": 255
        },
        "_contentSize": {
            "__type__": "cc.Size",
            "width": options.width || 0,
            "height": options.height || 0
        },
        "_anchorPoint": {
            "__type__": "cc.Vec2",
            "x": 0.5,
            "y": 0.5
        },
        "_trs": {
            "__type__": "TypedArray",
            "ctor": "Float64Array",
            "array": [
                options.x || 0,
                options.y || 0,
                0,                          // z
                0, 0, 0, 1,                 // rotation quaternion (x, y, z, w)
                1, 1, 1                     // scale (x, y, z)
            ]
        },
        "_eulerAngles": {
            "__type__": "cc.Vec3",
            "x": 0,
            "y": 0,
            "z": 0
        },
        "_skewX": 0,
        "_skewY": 0,
        "_is3DNode": false,
        "_groupIndex": 0,
        "groupIndex": 0,
        "_id": generateId()
    };
}

// 解析命令行选项
function parseOptions(args) {
    const options = {
        type: 'empty',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        active: true,
        at: -1  // -1 表示添加到末尾
    };
    
    args.forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            switch (key) {
                case 'type':
                    options.type = value;
                    break;
                case 'x':
                    options.x = parseFloat(value) || 0;
                    break;
                case 'y':
                    options.y = parseFloat(value) || 0;
                    break;
                case 'width':
                    options.width = parseFloat(value) || 0;
                    break;
                case 'height':
                    options.height = parseFloat(value) || 0;
                    break;
                case 'active':
                    options.active = value !== 'false';
                    break;
                case 'at':
                    options.at = parseInt(value);
                    break;
            }
        }
    });
    
    return options;
}

// 查找父节点索引
function findParentIndex(data, parentRef) {
    // 如果是数字，直接返回
    if (/^\d+$/.test(parentRef)) {
        return parseInt(parentRef);
    }
    
    // 否则按路径查找
    const parts = parentRef.split(/[\/.]/);
    let currentIndex = 1; // 从 Scene 开始
    
    // 找到 Scene 的子节点（通常是 Canvas）
    const scene = data[currentIndex];
    if (!scene || !scene._children || scene._children.length === 0) {
        return -1;
    }
    
    // 从第一个子节点开始搜索
    currentIndex = scene._children[0].__id__;
    
    for (const part of parts) {
        const node = data[currentIndex];
        if (!node) return -1;
        
        if (node._name === part) {
            // 找到了，继续下一个路径部分
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
        } else {
            return -1;
        }
    }
    
    return currentIndex;
}

// 重新排列数组，使其与 _children 顺序一致（节点后跟组件）
function reorderArrayToMatchChildren(data) {
    const originalLength = data.length;
    const newArray = [];
    const indexMap = {};
    
    // 保留 SceneAsset (index 0) 和 Scene (index 1)
    newArray[0] = data[0];
    newArray[1] = data[1];
    indexMap[0] = 0;
    indexMap[1] = 1;
    
    // 建立旧索引到原始数据的映射
    const dataByIndex = {};
    for (let i = 0; i < data.length; i++) {
        if (data[i]) dataByIndex[i] = data[i];
    }
    
    // 收集所有组件及其对应的节点索引
    const componentsByNode = {};
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item && item.node && item.node.__id__ !== undefined) {
            const nodeId = item.node.__id__;
            if (!componentsByNode[nodeId]) componentsByNode[nodeId] = [];
            componentsByNode[nodeId].push(i);
        }
    }
    
    // 从 Scene (index 1) 开始递归遍历
    function addNodeAndChildren(nodeIndex) {
        if (nodeIndex === null || nodeIndex === undefined) return;
        
        const node = data[nodeIndex];
        if (!node) return;
        
        // 添加节点
        const newIndex = newArray.length;
        indexMap[nodeIndex] = newIndex;
        newArray.push(node);
        
        // 添加节点的组件（紧跟在节点后面）
        if (node._components) {
            for (const compRef of node._components) {
                const compIndex = compRef.__id__;
                if (compIndex !== undefined && dataByIndex[compIndex]) {
                    const compNewIndex = newArray.length;
                    indexMap[compIndex] = compNewIndex;
                    newArray.push(dataByIndex[compIndex]);
                }
            }
        }
        
        // 递归添加子节点
        if (node._children) {
            for (const childRef of node._children) {
                addNodeAndChildren(childRef.__id__);
            }
        }
    }
    
    // 从 Scene 的子节点开始
    const scene = data[1];
    if (scene && scene._children) {
        for (const childRef of scene._children) {
            addNodeAndChildren(childRef.__id__);
        }
    }
    
    // 添加根节点的组件（Scene 和 Canvas 的组件）
    function addRootComponents(nodeIndex) {
        const node = data[nodeIndex];
        if (!node || !node._components) return;
        
        for (const compRef of node._components) {
            const compIndex = compRef.__id__;
            if (compIndex !== undefined && dataByIndex[compIndex] && indexMap[compIndex] === undefined) {
                const compNewIndex = newArray.length;
                indexMap[compIndex] = compNewIndex;
                newArray.push(dataByIndex[compIndex]);
            }
        }
    }
    
    // 添加 Scene 的组件
    addRootComponents(1);
    // 添加 Canvas 的组件
    addRootComponents(2);
    
    // 重建所有 __id__ 引用
    function updateRefs(obj) {
        if (!obj || typeof obj !== 'object') return;
        
        if (obj.__id__ !== undefined) {
            const oldId = obj.__id__;
            if (indexMap[oldId] !== undefined) {
                obj.__id__ = indexMap[oldId];
            }
        } else {
            for (const key of Object.keys(obj)) {
                updateRefs(obj[key]);
            }
        }
    }
    
    for (const item of newArray) {
        updateRefs(item);
    }
    
    return newArray;
}

// 主函数
function addNode(firePath, parentRef, nodeName, options) {
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
    
    // 查找父节点
    const parentIndex = findParentIndex(data, parentRef);
    if (parentIndex < 0 || parentIndex >= data.length) {
        console.log(`错误: 找不到父节点 "${parentRef}"`);
        return false;
    }
    
    const parentNode = data[parentIndex];
    if (!parentNode || parentNode.__type__ !== 'cc.Node') {
        console.log(`错误: 索引 ${parentIndex} 不是有效的节点`);
        return false;
    }
    
    console.log(`父节点: ${parentNode._name} (#${parentIndex})`);
    
    // 计算插入位置
    const insertPosition = options.at >= 0 ? options.at : (parentNode._children ? parentNode._children.length : 0);
    console.log(`插入到 _children 位置: ${insertPosition}`);
    
    // 创建新节点和组件（追加末尾）
    const newNodeIndex = data.length;
    const newNode = createNodeData(nodeName, parentIndex, options);
    data.push(newNode);
    
    // 如果需要添加组件
    if (options.type === 'sprite') {
        const spriteComp = Components.sprite(newNodeIndex);
        data.push(spriteComp);
        newNode._components.push({ "__id__": data.length - 1 });
        console.log(`添加 Sprite 组件`);
    } else if (options.type === 'label') {
        const labelComp = Components.label(newNodeIndex);
        data.push(labelComp);
        newNode._components.push({ "__id__": data.length - 1 });
        console.log(`添加 Label 组件`);
    } else if (options.type === 'button') {
        const buttonComp = Components.button(newNodeIndex);
        data.push(buttonComp);
        newNode._components.push({ "__id__": data.length - 1 });
        console.log(`添加 Button 组件`);
    } else if (options.type === 'layout') {
        const layoutComp = Components.layout(newNodeIndex);
        data.push(layoutComp);
        newNode._components.push({ "__id__": data.length - 1 });
        console.log(`添加 Layout 组件`);
    } else if (options.type === 'widget') {
        const widgetComp = Components.widget(newNodeIndex);
        data.push(widgetComp);
        newNode._components.push({ "__id__":1 });
        console.log(`添加 Widget 组件`);
    } else if (options.type === 'particle') {
        const particleComp = Components.particleSystem(newNodeIndex);
        data.push(particleComp);
        newNode._components.push({ "__id__": data.length - 1 });
        console.log(`添加 ParticleSystem 组件`);
    }
    
    // 更新父节点的 _children 数组
    if (!parentNode._children) {
        parentNode._children = [];
    }
    
    // 插入到 _children 指定位置
    if (insertPosition < parentNode._children.length) {
        parentNode._children.splice(insertPosition, 0, { "__id__": newNodeIndex });
    } else {
        parentNode._children.push({ "__id__": newNodeIndex });
    }
    
    // 重新排列数组以匹配 _children 顺序
    console.log(`重新排列数组...`);
    const reorderedData = reorderArrayToMatchChildren(data);
    
    // 找到新节点的位置
    let newIndex = -1;
    for (let i = 0; i < reorderedData.length; i++) {
        if (reorderedData[i]._name === nodeName) {
            newIndex = i;
            break;
        }
    }
    
    // 保存文件
    fs.writeFileSync(firePath, JSON.stringify(reorderedData, null, 2), 'utf8');
    console.log(`\n✓ 节点 "${nodeName}" 已添加到 ${parentNode._name}`);
    console.log(`  新节点索引: #${newIndex}`);
    console.log(`  场景文件已更新: ${firePath}`);
    
    return true;
}

// 主程序
const args = process.argv.slice(2);

if (args.length < 3) {
    console.log('用法: node add_node.js <场景文件路径> <父节点索引|父节点路径> <节点名称> [选项]');
    console.log('');
    console.log('示例:');
    console.log('  node add_node.js ../cocos/assets/main.fire 2 NewNode');
    console.log('  node add_node.js ../cocos/assets/main.fire Canvas NewNode');
    console.log('  node add_node.js ../cocos/assets/main.fire Canvas/Tilemap ChildNode');
    console.log('  node add_node.js ../cocos/assets/main.fire Canvas MiddleNode --at=1');
    console.log('');
    console.log('选项:');
    console.log('  --type=sprite    添加 Sprite 组件');
    console.log('  --type=label     添加 Label 组件');
    console.log('  --type=empty     空节点（默认）');
    console.log('  --x=100          设置 x 坐标');
    console.log('  --y=200          设置 y 坐标');
    console.log('  --width=100      设置宽度');
    console.log('  --height=100     设置高度');
    console.log('  --at=N           插入到第 N 个子节点位置（0=第一个，默认末尾）');
    console.log('  --active=false   设置为不激活');
    console.log('  --active=false   设置为不激活');
    process.exit(1);
}

const firePath = args[0];
const parentRef = args[1];
const nodeName = args[2];
const options = parseOptions(args.slice(3));

// 如果是相对路径，转换为绝对路径
const absolutePath = path.isAbsolute(firePath) ? firePath : path.join(__dirname, firePath);

addNode(absolutePath, parentRef, nodeName, options);
