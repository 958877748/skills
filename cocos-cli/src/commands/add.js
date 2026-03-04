/**
 * add 命令 - 添加节点（支持场景和预制体）
 */

const { loadScene, saveScene, buildMaps, refreshEditor, isPrefab, generateFileId, getPrefabRootIndex } = require('../lib/fire-utils');
const { parseOptions, outputError, outputSuccess } = require('../lib/utils');
const { createNodeData } = require('../lib/node-utils');
const { createComponent } = require('../lib/components');

/**
 * 获取根节点 PrefabInfo 的索引
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
 * 获取节点子树的结束索引
 */
function getSubtreeEndIndex(data, nodeIndex) {
    const node = data[nodeIndex];
    if (!node) return nodeIndex;
    
    let lastIndex = nodeIndex;
    
    if (node._children) {
        for (const childRef of node._children) {
            const childEnd = getSubtreeEndIndex(data, childRef.__id__);
            lastIndex = Math.max(lastIndex, childEnd);
        }
    }
    
    if (node._components) {
        for (const compRef of node._components) {
            lastIndex = Math.max(lastIndex, compRef.__id__);
        }
    }
    
    if (node._prefab && nodeIndex !== 1) {
        lastIndex = Math.max(lastIndex, node._prefab.__id__);
    }
    
    return lastIndex;
}

/**
 * 重建所有 __id__ 引用
 */
function rebuildReferencesForInsert(data, insertIndex, count) {
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
        outputError('用法: cocos2d-cli add <场景.fire | 预制体.prefab> <父节点索引> <节点名称> [选项]');
        return;
    }
    
    const filePath = args[0];
    const parentRef = args[1];
    const nodeName = args[2];
    
    const options = parseOptions(args, 3);
    
    // 转换数值类型
    if (options.x) options.x = parseFloat(options.x) || 0;
    if (options.y) options.y = parseFloat(options.y) || 0;
    if (options.width) options.width = parseFloat(options.width) || 0;
    if (options.height) options.height = parseFloat(options.height) || 0;
    if (options.at !== undefined) options.at = parseInt(options.at);
    if (options.active !== undefined) options.active = options.active !== 'false';
    if (options.fontSize) options.fontSize = parseInt(options.fontSize) || 40;
    
    try {
        const data = loadScene(filePath);
        const { prefab } = buildMaps(data);
        
        if (!/^\d+$/.test(parentRef)) {
            outputError('父节点必须使用数字索引，请先用 tree 命令查看节点索引');
            return;
        }
        
        const parentIndex = parseInt(parentRef);
        
        if (parentIndex < 0 || parentIndex >= data.length || !data[parentIndex]) {
            outputError(`无效的节点索引: ${parentRef}`);
            return;
        }
        
        const parentNode = data[parentIndex];
        const isRootChild = prefab && parentIndex === 1;
        
        // 确定插入位置
        let insertIndex;
        
        if (!parentNode._children || parentNode._children.length === 0) {
            insertIndex = parentIndex + 1;
        } else {
            const targetPosition = options.at >= 0 ? options.at : parentNode._children.length;
            
            if (targetPosition === 0) {
                insertIndex = parentNode._children[0].__id__;
            } else if (targetPosition >= parentNode._children.length) {
                const lastChildRef = parentNode._children[parentNode._children.length - 1];
                insertIndex = getSubtreeEndIndex(data, lastChildRef.__id__) + 1;
            } else {
                insertIndex = parentNode._children[targetPosition].__id__;
            }
        }
        
        let newNodeIndex;
        
        if (prefab) {
            // 预制体模式
            const rootPrefabInfoOldIdx = getRootPrefabInfoIndex(data);
            const rootPrefabInfo = data[rootPrefabInfoOldIdx];
            
            // 创建节点
            const nodeData = createNodeData(nodeName, parentIndex, options);
            
            // 创建组件
            let compData = null;
            if (options.type) {
                compData = createComponent(options.type, insertIndex);
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
            
            const itemsToInsert = [nodeData];
            if (compData) itemsToInsert.push(compData);
            itemsToInsert.push(prefabInfo);
            
            if (isRootChild) {
                if (insertIndex > rootPrefabInfoOldIdx) {
                    insertIndex--;
                }
                data.splice(rootPrefabInfoOldIdx, 1);
            }
            
            for (let i = 0; i < itemsToInsert.length; i++) {
                data.splice(insertIndex + i, 0, itemsToInsert[i]);
            }
            
            rebuildReferencesForInsert(data, insertIndex, itemsToInsert.length);
            
            newNodeIndex = insertIndex;
            
            if (compData) {
                compData.node = { "__id__": newNodeIndex };
                nodeData._components.push({ "__id__": newNodeIndex + 1 });
                nodeData._prefab = { "__id__": newNodeIndex + 2 };
            } else {
                nodeData._prefab = { "__id__": newNodeIndex + 1 };
            }
            
            if (isRootChild) {
                data.push(rootPrefabInfo);
                data[1]._prefab = { "__id__": data.length - 1 };
            }
            
        } else {
            // 场景模式
            const newNode = createNodeData(nodeName, parentIndex, options);
            
            const itemsToInsert = [newNode];
            
            let compData = null;
            if (options.type) {
                compData = createComponent(options.type, insertIndex);
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
            
            rebuildReferencesForInsert(data, insertIndex, itemsToInsert.length);
            
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
        
        saveScene(filePath, data);
        refreshEditor(filePath);
        
        outputSuccess({ 
            nodeIndex: newNodeIndex,
            name: nodeName,
            parent: parentRef,
            type: prefab ? 'prefab' : 'scene'
        });
        
    } catch (err) {
        outputError(err.message);
    }
}

module.exports = { run };
