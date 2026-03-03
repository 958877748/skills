/**
 * add 命令 - 添加节点  
 * 按照 Cocos Creator 的深度优先遍历顺序插入节点
 */

const { loadScene, saveScene, buildMaps, findNodeIndex, refreshEditor } = require('../lib/fire-utils');
const { Components, createNodeData } = require('../lib/components');

/**
 * 获取节点及其所有子树的最后一个索引（用于确定插入位置）
 * 按照深度优先遍历，返回该节点子树的结束位置
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
    
    // 处理组件（组件在子节点之后）
    if (node._components) {
        for (const compRef of node._components) {
            lastIndex = Math.max(lastIndex, compRef.__id__);
        }
    }
    
    return lastIndex;
}

/**
 * 重建所有 __id__ 引用（插入元素后索引变化）
 * 返回新旧索引的映射表
 */
function rebuildReferencesForInsert(data, insertIndex) {
    const indexMap = {};
    
    // 构建映射：旧索引 -> 新索引
    for (let oldIndex = 0; oldIndex < data.length; oldIndex++) {
        if (oldIndex < insertIndex) {
            indexMap[oldIndex] = oldIndex;
        } else {
            indexMap[oldIndex] = oldIndex + 1;
        }
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

function run(args) {
    if (args.length < 3) {
        console.log(JSON.stringify({ error: '用法: cocos2.4 add <场景文件路径> <父节点> <节点名称> [选项]' }));
        return;
    }
    
    const scenePath = args[0];
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
        }
    });
    
    try {
        const data = loadScene(scenePath);
        const { indexMap } = buildMaps(data);
        
        // 父节点必须使用数字索引
        if (!/^\d+$/.test(parentRef)) {
            console.log(JSON.stringify({ error: '父节点必须使用数字索引，请先用 tree 命令查看节点索引' }));
            return;
        }
        
        // 查找父节点
        const parentIndex = parseInt(parentRef);
        
        if (parentIndex < 0 || parentIndex >= data.length || !data[parentIndex]) {
            console.log(JSON.stringify({ error: `无效的节点索引: ${parentRef}` }));
            return;
        }
        
        const parentNode = data[parentIndex];
        
        // 确定插入位置
        // 按照 _children 顺序，找到应该插入的位置
        let insertIndex;
        if (!parentNode._children || parentNode._children.length === 0) {
            // 父节点没有子节点，新节点紧跟父节点之后
            insertIndex = parentIndex + 1;
        } else {
            // 根据 --at 参数确定插入位置
            const targetPosition = options.at >= 0 ? options.at : parentNode._children.length;
            
            if (targetPosition === 0) {
                // 插入到第一个子节点位置，紧跟父节点之后
                insertIndex = parentIndex + 1;
            } else if (targetPosition >= parentNode._children.length) {
                // 插入到最后，在所有现有子节点之后
                const lastChildRef = parentNode._children[parentNode._children.length - 1];
                insertIndex = getSubtreeEndIndex(data, lastChildRef.__id__) + 1;
            } else {
                // 插入到中间某个位置
                const beforeChildRef = parentNode._children[targetPosition - 1];
                insertIndex = getSubtreeEndIndex(data, beforeChildRef.__id__) + 1;
            }
        }
        
        // 创建新节点
        const newNode = createNodeData(nodeName, parentIndex, options);
        
        // 在正确位置插入新节点
        data.splice(insertIndex, 0, newNode);
        
        // 重建索引引用（因为插入了新元素，后续索引都+1）
        const insertIndexMap = rebuildReferencesForInsert(data, insertIndex);
        
        // 新节点的实际索引
        const newNodeIndex = insertIndex;
        
        // 更新新节点的 _parent 引用（使用映射后的父节点索引）
        const newParentIndex = insertIndexMap[parentIndex] !== undefined ? insertIndexMap[parentIndex] : parentIndex;
        newNode._parent = { "__id__": newParentIndex };
        
        // 添加组件（如果有）
        let componentIndex = -1;
        if (options.type) {
            const compData = Components[options.type]?.(newNodeIndex);
            if (compData) {
                // 组件应该放在新节点子树之后（这里新节点没有子节点，所以紧跟节点后）
                const compInsertIndex = newNodeIndex + 1;
                data.splice(compInsertIndex, 0, compData);
                
                // 再次重建引用
                rebuildReferencesForInsert(data, compInsertIndex);
                
                componentIndex = compInsertIndex;
                newNode._components.push({ "__id__": componentIndex });
            }
        }
        
        // 更新父节点的 _children
        if (!parentNode._children) parentNode._children = [];
        
        const insertPosition = options.at >= 0 ? options.at : parentNode._children.length;
        parentNode._children.splice(insertPosition, 0, { "__id__": newNodeIndex });
        
        // 保存场景
        saveScene(scenePath, data);
        
        // 触发编辑器刷新（传入场景路径以重新打开场景）
        refreshEditor(scenePath);
        
        // 构建节点树（类似 tree 命令）
        function buildTree(nodeIndex, prefix = '', isLast = true, isRoot = true) {
            const node = data[nodeIndex];
            if (!node) return '';
            
            const nodeName = isRoot ? 'Root' : (node._name || '(unnamed)');
            const active = node._active !== false ? '●' : '○';
            let result = prefix + (isRoot ? '' : active + ' ') + nodeName + ' #' + nodeIndex;
            
            // 添加组件信息
            if (node._components && node._components.length > 0) {
                const comps = node._components.map(c => {
                    const comp = data[c.__id__];
                    if (!comp) return `? #${c.__id__}`;
                    return `${comp.__type__.replace('cc.', '')} #${c.__id__}`;
                }).join(', ');
                result += ` (${comps})`;
            }
            
            result += '\n';
            
            // 处理子节点
            if (node._children && node._children.length > 0) {
                node._children.forEach((childRef, idx) => {
                    const childIsLast = idx === node._children.length - 1;
                    const childPrefix = prefix + (isRoot ? '' : (isLast ? '    ' : '│   '));
                    result += buildTree(childRef.__id__, childPrefix, childIsLast, false);
                });
            }
            
            return result;
        }
        
        const treeStr = buildTree(1);
        
        console.log(treeStr);
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };