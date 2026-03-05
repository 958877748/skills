"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const fire_utils_1 = require("../lib/fire-utils");
const utils_1 = require("../lib/utils");
const node_utils_1 = require("../lib/node-utils");
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
    if (node._components) {
        node._components = node._components.filter(c => c.__id__ !== compIndex);
    }
    const indicesToDelete = new Set([compIndex]);
    (0, fire_utils_1.rebuildReferences)(data, indicesToDelete);
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
function removeNode(data, nodeIndex) {
    const node = data[nodeIndex];
    if (!node) {
        return { error: `节点索引 ${nodeIndex} 不存在` };
    }
    if (nodeIndex <= 1) {
        return { error: '不能删除根节点' };
    }
    const nodeName = node._name || '(unnamed)';
    const indicesToDelete = (0, node_utils_1.collectNodeAndChildren)(data, nodeIndex);
    if (node._parent) {
        const parentIndex = node._parent.__id__;
        const parent = data[parentIndex];
        if (parent && parent._children) {
            parent._children = parent._children.filter(c => c.__id__ !== nodeIndex);
        }
    }
    (0, fire_utils_1.rebuildReferences)(data, indicesToDelete);
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
        (0, utils_1.outputError)('用法: cocos2d-cli remove <场景文件路径> <索引> [--component|--node]');
        return;
    }
    const scenePath = args[0];
    if (!/^\d+$/.test(args[1])) {
        (0, utils_1.outputError)('索引必须是数字，请先用 tree 命令查看节点索引');
        return;
    }
    const index = parseInt(args[1]);
    const forceComponent = args.includes('--component');
    const forceNode = args.includes('--node');
    if (forceComponent && forceNode) {
        (0, utils_1.outputError)('不能同时指定 --component 和 --node');
        return;
    }
    try {
        const data = (0, fire_utils_1.loadScene)(scenePath);
        if (!data[index]) {
            (0, utils_1.outputError)(`索引 ${index} 不存在`);
            return;
        }
        let deleteType;
        if (forceComponent) {
            deleteType = 'component';
        }
        else if (forceNode) {
            deleteType = 'node';
        }
        else {
            deleteType = (0, node_utils_1.detectItemType)(data, index) || 'node';
        }
        let result;
        if (deleteType === 'component') {
            result = removeComponent(data, index);
        }
        else {
            result = removeNode(data, index);
        }
        if (result.error) {
            (0, utils_1.outputError)(result.error);
            return;
        }
        (0, fire_utils_1.saveScene)(scenePath, data);
        (0, fire_utils_1.refreshEditor)(scenePath);
        (0, utils_1.outputSuccess)(result);
    }
    catch (err) {
        (0, utils_1.outputError)(err.message);
    }
}
exports.default = { run };
//# sourceMappingURL=remove.js.map