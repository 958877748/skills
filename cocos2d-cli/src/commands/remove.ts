import { loadScene, saveScene, rebuildReferences, refreshEditor } from '../lib/fire-utils';
import { outputError, outputSuccess } from '../lib/utils';
import { collectNodeAndChildren, detectItemType } from '../lib/node-utils';
import { SceneData } from '../lib/types';

function removeComponent(data: SceneData, compIndex: number): Record<string, unknown> {
    const compData = data[compIndex];
    if (!compData) {
        return { error: `组件索引 ${compIndex} 不存在` };
    }
    
    const compType = compData.__type__;
    const nodeId = (compData as { node?: { __id__: number } }).node?.__id__;
    
    if (nodeId === undefined) {
        return { error: `索引 ${compIndex} 不是组件` };
    }
    
    const node = data[nodeId];
    if (!node) {
        return { error: `组件关联的节点 ${nodeId} 不存在` };
    }
    
    const nodeName = node._name || '(unnamed)';
    
    if (node._components) {
        node._components = node._components.filter(c => c.__id__ !== compIndex);
    }
    
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

function removeNode(data: SceneData, nodeIndex: number): Record<string, unknown> {
    const node = data[nodeIndex];
    if (!node) {
        return { error: `节点索引 ${nodeIndex} 不存在` };
    }
    
    if (nodeIndex <= 1) {
        return { error: '不能删除根节点' };
    }
    
    const nodeName = node._name || '(unnamed)';
    
    const indicesToDelete = collectNodeAndChildren(data, nodeIndex);
    
    if (node._parent) {
        const parentIndex = node._parent.__id__;
        const parent = data[parentIndex];
        if (parent && parent._children) {
            parent._children = parent._children.filter(c => c.__id__ !== nodeIndex);
        }
    }
    
    rebuildReferences(data, indicesToDelete);
    
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

export function run(args: string[]): void {
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
        const data = loadScene(scenePath);
        
        if (!data[index]) {
            outputError(`索引 ${index} 不存在`);
            return;
        }
        
        let deleteType: string;
        if (forceComponent) {
            deleteType = 'component';
        } else if (forceNode) {
            deleteType = 'node';
        } else {
            deleteType = detectItemType(data, index) || 'node';
        }
        
        let result: Record<string, unknown>;
        if (deleteType === 'component') {
            result = removeComponent(data, index);
        } else {
            result = removeNode(data, index);
        }
        
        if (result.error) {
            outputError(result.error as string);
            return;
        }
        
        saveScene(scenePath, data);
        refreshEditor(scenePath);
        
        outputSuccess(result);
        
    } catch (err) {
        outputError((err as Error).message);
    }
}

export default { run };
