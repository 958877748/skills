/**
 * add 命令 - 添加节点（支持场景和预制体）
 * 
 * 预制体正确结构（深度优先遍历）：
 *   节点 → 子节点(递归) → 组件 → PrefabInfo
 * 
 * 示例：
 * [1] Node (根) _prefab -> [最后]
 * [2] Node (子1) _prefab -> [6]
 * [3] Node (孙) _prefab -> [5]
 * [4] Component (孙的组件)
 * [5] PrefabInfo (孙的)
 * [6] Component (子1的组件)
 * [7] PrefabInfo (子1的)
 * [8] PrefabInfo (根的，在最后)
 */

const { loadScene, saveScene, buildMaps, refreshEditor, isPrefab, generateFileId } = require('../lib/fire-utils');
const { Components, createNodeData } = require('../lib/components');

/**
 * 获取根节点 PrefabInfo 的索引（预制体最后一个元素）
 */
function getRootPrefabInfoIndex(data) {
    for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].__type__ === 'cc.PrefabInfo') {
            const rootRef = data[i].root?.__id__;
            if (rootRef === 1) return i;
        }
    }
    return data.length - 1;
}

/**
 * 获取节点子树的结束索引（子节点 → 组件 → PrefabInfo）
 */
function getSubtreeEndIndex(data, nodeIndex) {
    const node = data[nodeIndex];
    if (!node) return nodeIndex;
    
    let lastIndex = nodeIndex;
    
    // 递归处理所有子节点
    if (node._children) {
        for (const childRef of node._children) {
            const childEnd = getSubtreeEndIndex(data, childRef.__id__);
            lastIndex = Math.max(lastIndex, childEnd);
        }
    }
    
    // 处理组件
    if (node._components) {
        for (const compRef of node._components) {
            lastIndex = Math.max(lastIndex, compRef.__id__);
        }
    }
    
    // PrefabInfo 在最后（根节点的除外，它在整个数组最后）
    if (node._prefab && nodeIndex !== 1) {
        lastIndex = Math.max(lastIndex, node._prefab.__id__);
    }
    
    return lastIndex;
}

/**
 * 重建所有 __id__ 引用
 */
function rebuildReferences(data, insertIndex, count) {
    const indexMap = {};
    
    for (let oldIndex = 0; oldIndex < data.length; oldIndex++) {
        if (oldIndex < insertIndex) {
            indexMap[oldIndex] = oldIndex;
        } else {
            indexMap[oldIndex] = oldIndex + count;
        }
    }
    
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

function run(args) {
    if (args.length < 3) {
        console.log(JSON.stringify({ error: '用法: cocos2.4 add <场景.fire | 预制体.prefab> <父节点索引> <节点名称> [选项]' }));
        return;
    }
    
    const filePath = args[0];
    const parentRef = args[1];
    const nodeName = args[2];
    
    // 解析选项
    const options = {};
    args.slice(3).forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            if (key === 'type') options.type = value;
            else if (key === 'x') options.x = parseFloat(value) || 0;
            else if (key === 'y') options.y = parseFloat(value) || 0;
            else if (key === 'width') options.width = parseFloat(value) || 0;
            else if (key === 'height') options.height = parseFloat(value) || 0;
            else if (key === 'at') options.at = parseInt(value);
            else if (key === 'active') options.active = value !== 'false';
            else if (key === 'color') options.color = value;
            else if (key === 'fontSize') options.fontSize = parseInt(value) || 40;
            else if (key === 'string') options.string = value || '';
        }
    });
    
    try {
        const data = loadScene(filePath);
        const { prefab } = buildMaps(data);
        
        if (!/^\d+$/.test(parentRef)) {
            console.log(JSON.stringify({ error: '父节点必须使用数字索引，请先用 tree 命令查看节点索引' }));
            return;
        }
        
        const parentIndex = parseInt(parentRef);
        
        if (parentIndex < 0 || parentIndex >= data.length || !data[parentIndex]) {
            console.log(JSON.stringify({ error: `无效的节点索引: ${parentRef}` }));
            return;
        }
        
        const parentNode = data[parentIndex];
        const isRootChild = prefab && parentIndex === 1;
        
        // 确定插入位置：紧跟父节点之后（在父节点的子节点/组件/PrefabInfo之前）
        let insertIndex;
        
        if (!parentNode._children || parentNode._children.length === 0) {
            // 父节点还没有子节点，插入到父节点之后
            insertIndex = parentIndex + 1;
        } else {
            // 父节点已有子节点，根据 --at 参数确定位置
            const targetPosition = options.at >= 0 ? options.at : parentNode._children.length;
            
            if (targetPosition === 0) {
                // 插入到第一个子节点之前
                insertIndex = parentNode._children[0].__id__;
            } else if (targetPosition >= parentNode._children.length) {
                // 插入到最后一个子节点之后
                const lastChildRef = parentNode._children[parentNode._children.length - 1];
                insertIndex = getSubtreeEndIndex(data, lastChildRef.__id__) + 1;
            } else {
                // 插入到中间
                insertIndex = parentNode._children[targetPosition].__id__;
            }
        }
        
        let newNodeIndex;
        
        if (prefab) {
            // 预制体模式
            // 找到根节点的 PrefabInfo
            const rootPrefabInfoOldIdx = getRootPrefabInfoIndex(data);
            const rootPrefabInfo = data[rootPrefabInfoOldIdx];
            
            // 创建节点
            const nodeData = {
                "__type__": "cc.Node",
                "_name": nodeName,
                "_objFlags": 0,
                "_parent": { "__id__": parentIndex },
                "_children": [],
                "_active": options.active !== false,
                "_components": [],
                "_prefab": null,
                "_opacity": 255,
                "_color": parseColor(options.color) || { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 },
                "_contentSize": { "__type__": "cc.Size", "width": options.width || 0, "height": options.height || 0 },
                "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
                "_trs": { "__type__": "TypedArray", "ctor": "Float64Array", "array": [options.x || 0, options.y || 0, 0, 0, 0, 0, 1, 1, 1, 1] },
                "_eulerAngles": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
                "_skewX": 0,
                "_skewY": 0,
                "_is3DNode": false,
                "_groupIndex": 0,
                "groupIndex": 0,
                "_id": ""
            };
            
            // 创建组件（如果有）
            let compData = null;
            if (options.type) {
                compData = Components[options.type]?.(insertIndex);
                // 修改组件属性
                if (compData) {
                    if (options.type === 'label') {
                        if (options.fontSize) {
                            compData._fontSize = options.fontSize;
                            compData._lineHeight = options.fontSize;
                        }
                        if (options.string) {
                            compData._string = options.string;
                            compData._N$string = options.string;
                        }
                    }
                }
            }
            
            // 创建 PrefabInfo
            const prefabInfo = {
                "__type__": "cc.PrefabInfo",
                "root": { "__id__": 1 },
                "asset": { "__id__": 0 },
                "fileId": generateFileId(),
                "sync": false
            };
            
            // 构建要插入的元素：节点 → 组件 → PrefabInfo
            const itemsToInsert = [nodeData];
            if (compData) itemsToInsert.push(compData);
            itemsToInsert.push(prefabInfo);
            
            // 如果是根节点的子节点，先移除根 PrefabInfo
            if (isRootChild) {
                // 如果插入位置在根 PrefabInfo 之后，需要调整
                if (insertIndex > rootPrefabInfoOldIdx) {
                    insertIndex--;
                }
                data.splice(rootPrefabInfoOldIdx, 1);
            }
            
            // 插入元素
            for (let i = 0; i < itemsToInsert.length; i++) {
                data.splice(insertIndex + i, 0, itemsToInsert[i]);
            }
            
            // 重建引用
            rebuildReferences(data, insertIndex, itemsToInsert.length);
            
            newNodeIndex = insertIndex;
            
            // 设置引用
            if (compData) {
                compData.node = { "__id__": newNodeIndex };
                nodeData._components.push({ "__id__": newNodeIndex + 1 });
                nodeData._prefab = { "__id__": newNodeIndex + 2 };
            } else {
                nodeData._prefab = { "__id__": newNodeIndex + 1 };
            }
            
            // 如果是根节点的子节点，把根 PrefabInfo 添加到最后
            if (isRootChild) {
                data.push(rootPrefabInfo);
                data[1]._prefab = { "__id__": data.length - 1 };
            }
            
        } else {
            // 场景模式：节点 + 组件
            const newNode = createNodeData(nodeName, parentIndex, options);
            
            if (options.color) {
                const color = parseColor(options.color);
                if (color) newNode._color = color;
            }
            
            const itemsToInsert = [newNode];
            
            let compData = null;
            if (options.type) {
                compData = Components[options.type]?.(insertIndex);
                // 修改组件属性
                if (compData) {
                    if (options.type === 'label') {
                        if (options.fontSize) {
                            compData._fontSize = options.fontSize;
                            compData._lineHeight = options.fontSize;
                        }
                        if (options.string) {
                            compData._string = options.string;
                            compData._N$string = options.string;
                        }
                    }
                }
                if (compData) itemsToInsert.push(compData);
            }
            
            for (let i = 0; i < itemsToInsert.length; i++) {
                data.splice(insertIndex + i, 0, itemsToInsert[i]);
            }
            
            rebuildReferences(data, insertIndex, itemsToInsert.length);
            
            newNodeIndex = insertIndex;
            
            if (compData) {
                compData.node = { "__id__": newNodeIndex };
                newNode._components.push({ "__id__": newNodeIndex + 1 });
            }
        }
        
        // 更新父节点的 _children
        if (!parentNode._children) parentNode._children = [];
        const insertPosition = options.at >= 0 ? options.at : parentNode._children.length;
        parentNode._children.splice(insertPosition, 0, { "__id__": newNodeIndex });
        
        // 保存文件
        saveScene(filePath, data);
        
        // 触发编辑器刷新
        refreshEditor(filePath);
        
        console.log(JSON.stringify({ 
            success: true, 
            nodeIndex: newNodeIndex,
            name: nodeName,
            parent: parentRef,
            type: prefab ? 'prefab' : 'scene'
        }));
        
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

function parseColor(colorStr) {
    if (!colorStr) return null;
    let color = colorStr;
    if (typeof color === 'string') {
        if (color.startsWith('#')) color = color.slice(1);
        if (color.length === 6) {
            const r = parseInt(color.slice(0, 2), 16);
            const g = parseInt(color.slice(2, 4), 16);
            const b = parseInt(color.slice(4, 6), 16);
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                return { "__type__": "cc.Color", r, g, b, a: 255 };
            }
        }
    }
    return null;
}

module.exports = { run };
