/**
 * remove 命令 - 统一的删除命令
 * 支持删除节点和组件
 */

const { loadScene, saveScene, rebuildReferences, refreshEditor, loadScriptMap } = require('../lib/fire-utils');
const { outputError, outputSuccess } = require('../lib/utils');
const { buildTree, collectNodeAndChildren, detectItemType } = require('../lib/node-utils');

/**
 * 删除组件
 */
function removeComponent(data, compIndex) {
    const compData = data[compIndex];
    if (!compData) {
        return { error: `组件索引 ${compIndex} 不存在` };
    }
    
    const compType = compData.__type__;
    const nodeId = compData.node?.__id__;
    
    if (nodeId === undefined) {
        return { error: `索引 ${compIndex} 不是组件` };
    }
    
    const node = data[nodeId];
    if (!node) {
        return { error: `组件关联的节点 ${nodeId} 不存在` };
    }
    
    const nodeName = node._name || '(unnamed)';
    
    // 从节点的 _components 中移除引用
    if (node._components) {
        node._components = node._components.filter(c => c.__id__ !== compIndex);
    }
    
    // 重建引用并删除组件
    const indicesToDelete = new Set([compIndex]);
    rebuildReferences(data, indicesToDelete);
    data.splice(compIndex, 1);
    
    return {
        success: true,
        type: 'component',
        componentType: compType,
        componentIndex: compIndex,
        nodeName,
        nodeIndex: nodeId
    };
}

/**
 * 删除节点
 */
function removeNode(data, nodeIndex) {
    const node = data[nodeIndex];
    if (!node) {
        return { error: `节点索引 ${nodeIndex} 不存在` };
    }
    
    if (nodeIndex <= 1) {
        return { error: '不能删除根节点' };
    }
    
    const nodeName = node._name || '(unnamed)';
    
    // 收集所有需要删除的索引
    const indicesToDelete = collectNodeAndChildren(data, nodeIndex);
    
    // 从父节点的 _children 中移除引用
    if (node._parent) {
        const parentIndex = node._parent.__id__;
        const parent = data[parentIndex];
        if (parent && parent._children) {
            parent._children = parent._children.filter(c => c.__id__ !== nodeIndex);
        }
    }
    
    // 重建引用
    rebuildReferences(data, indicesToDelete);
    
    // 删除元素
    const sortedIndices = Array.from(indicesToDelete).sort((a, b) => b - a);
    for (const idx of sortedIndices) {
        data.splice(idx, 1);
    }
    
    return {
        success: true,
        type: 'node',
        nodeName,
        nodeIndex,
        deletedCount: sortedIndices.length
    };
}

function run(args) {
    if (args.length < 2) {
        outputError('用法: cocos2d-cli remove <场景文件路径> <索引> [--component|--node]');
        return;
    }
    
    const scenePath = args[0];
    
    if (!/^\d+$/.test(args[1])) {
        outputError('索引必须是数字，请先用 tree 命令查看节点索引');
        return;
    }
    
    const index = parseInt(args[1]);
    const forceComponent = args.includes('--component');
    const forceNode = args.includes('--node');
    
    if (forceComponent && forceNode) {
        outputError('不能同时指定 --component 和 --node');
        return;
    }
    
    try {
        let data = loadScene(scenePath);
        
        if (!data[index]) {
            outputError(`索引 ${index} 不存在`);
            return;
        }
        
        // 确定删除类型
        let deleteType;
        if (forceComponent) {
            deleteType = 'component';
        } else if (forceNode) {
            deleteType = 'node';
        } else {
            deleteType = detectItemType(data, index);
        }
        
        // 执行删除
        let result;
        if (deleteType === 'component') {
            result = removeComponent(data, index);
        } else {
            result = removeNode(data, index);
        }
        
        if (result.error) {
            outputError(result.error);
            return;
        }
        
        // 保存场景
        saveScene(scenePath, data);
        refreshEditor(scenePath);
        
        outputSuccess(result);
        
    } catch (err) {
        outputError(err.message);
    }
}

module.exports = { run };
