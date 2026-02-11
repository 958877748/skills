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
 * --type=empty     空节点（默认）
 * --x=100          设置 x 坐标
 * --y=200          设置 y 坐标
 * --active=false   设置激活状态
 */

const fs = require('fs');
const path = require('path');

// 生成类似 Cocos Creator 的 _id
function generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

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

// 创建 Sprite 组件数据
function createSpriteComponentData(nodeId) {
    return {
        "__type__": "cc.Sprite",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_materials": [
            { "__uuid__": "eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432" }
        ],
        "_srcBlendFactor": 770,
        "_dstBlendFactor": 771,
        "_spriteFrame": {
            "__uuid__": "8cdb44ac-a3f6-449f-b354-7cd48cf84061"
        },
        "_type": 0,
        "_sizeMode": 1,
        "_fillType": 0,
        "_fillCenter": {
            "__type__": "cc.Vec2",
            "x": 0,
            "y": 0
        },
        "_fillStart": 0,
        "_fillRange": 0,
        "_isTrimmedMode": true,
        "_atlas": null,
        "_id": generateId()
    };
}

// 创建 Label 组件数据
function createLabelComponentData(nodeId) {
    return {
        "__type__": "cc.Label",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_materials": [
            { "__uuid__": "eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432" }
        ],
        "_useOriginalSize": true,
        "_string": "",
        "_horizontalAlign": 1,
        "_verticalAlign": 1,
        "_actualFontSize": 40,
        "_fontSize": 40,
        "_fontFamily": "Arial",
        "_lineHeight": 40,
        "_overflow": 0,
        "_enableWrapText": true,
        "_font": null,
        "_isSystemFontUsed": true,
        "_spacingX": 0,
        "_isItalic": false,
        "_isBold": false,
        "_isUnderline": false,
        "_underlineHeight": 2,
        "_cacheMode": 0,
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

// 计算插入位置在数组中的索引
function calculateInsertIndex(data, parentNode, insertPosition) {
    // 如果插入到末尾，返回数组长度
    if (insertPosition < 0 || insertPosition >= parentNode._children.length) {
        return data.length;
    }
    
    // 找到插入位置对应的子节点索引
    const childRef = parentNode._children[insertPosition];
    if (childRef) {
        return childRef.__id__;
    }
    
    return data.length;
}

// 在数组指定位置插入元素，并重建所有引用
function insertElementsAndRebuild(data, insertIndex, newItems) {
    const insertCount = newItems.length;
    const originalLength = data.length;
    
    // 插入新元素
    data.splice(insertIndex, 0, ...newItems);
    
    // 构建旧索引到新索引的映射
    const indexMap = {};
    for (let oldIndex = 0; oldIndex < originalLength; oldIndex++) {
        if (oldIndex < insertIndex) {
            indexMap[oldIndex] = oldIndex;
        } else {
            indexMap[oldIndex] = oldIndex + insertCount;
        }
    }
    // 新元素的索引
    for (let i = 0; i < insertCount; i++) {
        indexMap[originalLength + i] = insertIndex + i;
    }
    
    // 更新所有 __id__ 引用
    function updateRef(obj) {
        if (!obj || typeof obj !== 'object') return;
        
        if (obj.__id__ !== undefined) {
            const oldId = obj.__id__;
            if (indexMap[oldId] !== undefined) {
                obj.__id__ = indexMap[oldId];
            }
        } else {
            for (const key of Object.keys(obj)) {
                updateRef(obj[key]);
            }
        }
    }
    
    for (const item of data) {
        updateRef(item);
    }
    
    return indexMap;
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
    const insertIndex = calculateInsertIndex(data, parentNode, insertPosition);
    
    console.log(`插入位置: 第 ${insertPosition} 个子节点，数组索引 ${insertIndex}`);
    
    // 创建新节点和组件（使用临时索引）
    const newNode = createNodeData(nodeName, parentIndex, options);
    const newItems = [newNode];
    
    // 如果需要添加组件
    if (options.type === 'sprite') {
        const spriteComp = createSpriteComponentData(-1); // 临时用 -1
        newItems.push(spriteComp);
        newNode._components.push({ "__id__": -2 }); // 临时用相对索引
        console.log(`添加 Sprite 组件`);
    } else if (options.type === 'label') {
        const labelComp = createLabelComponentData(-1);
        newItems.push(labelComp);
        newNode._components.push({ "__id__": -2 });
        console.log(`添加 Label 组件`);
    }
    
    console.log(`将插入 ${newItems.length} 个元素`);
    
    // 更新父节点的 _children 数组（在插入前，使用旧索引）
    if (!parentNode._children) {
        parentNode._children = [];
    }
    
    // 插入到 _children（使用旧索引）
    if (insertPosition < parentNode._children.length) {
        parentNode._children.splice(insertPosition, 0, { "__id__": -3 }); // 临时
    } else {
        parentNode._children.push({ "__id__": -3 }); // 临时
    }
    
    // 插入元素并重建所有引用
    const indexMap = insertElementsAndRebuild(data, insertIndex, newItems);
    
    // 更新新节点的父节点引用（现在父节点索引可能已经变化）
    const newParentIndex = indexMap[parentIndex];
    newNode._parent.__id__ = newParentIndex;
    
    // 更新新节点的组件引用
    if (newNode._components.length > 0) {
        newNode._components[0].__id__ = insertIndex + 1;
    }
    if (newItems.length > 1) {
        newItems[1].node.__id__ = insertIndex;
    }
    
    // 更新 _children 中的新节点引用
    const actualParent = data[newParentIndex];
    const childIndex = actualParent._children.findIndex(c => c.__id__ === -3);
    if (childIndex >= 0) {
        actualParent._children[childIndex].__id__ = insertIndex;
    }
    
    // 保存文件
    fs.writeFileSync(firePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`\n✓ 节点 "${nodeName}" 已添加到 ${actualParent._name}`);
    console.log(`  新节点索引: #${insertIndex}`);
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
