#!/usr/bin/env node

import { loadScene, saveScene, findNodeIndex } from './lib/fire-utils.js';
import { outputJson, outputError } from './lib/utils.js';

const isDirectRun = process.argv[1]?.endsWith('remove.js');
if (isDirectRun) {
  run(process.argv.slice(2));
}

function collectAllIndices(data, idx, outSet) {
    if (idx < 0 || idx >= data.length || !data[idx]) return;
    outSet.add(idx);
    const node = data[idx];
    
    if (node._components) {
        for (const ref of node._components) {
            outSet.add(ref.__id__);
        }
    }
    if (node._prefab && node._prefab.__id__) {
        outSet.add(node._prefab.__id__);
    }
    if (node._children) {
        for (const ref of node._children) {
            collectAllIndices(data, ref.__id__, outSet);
        }
    }
}

/**
 * remove 命令 - 删除指定节点
 * @module commands/remove
 * @param {string[]} args - [文件路径] [节点路径]
 */
export function run(args) {
    const filePath = args[0];
    const nodePath = args[1];

    if (!filePath || !nodePath) {
        outputError('用法: cocos2d-cli remove <文件> <节点路径>');
        return;
    }

    try {
        const data = loadScene(filePath);
        if (!data || data.length === 0) {
            outputError('文件为空或格式错误');
            return;
        }

        const idx = findNodeIndex(data, nodePath);
        if (idx === -1) {
            outputError(`节点未找到: ${nodePath}`);
            return;
        }

        const node = data[idx];

        if (!node._parent) {
            outputError('无法删除根节点');
            return;
        }

        const parentIdx = node._parent.__id__;
        const parent = data[parentIdx];
        if (parent && parent._children) {
            parent._children = parent._children.filter(ref => ref.__id__ !== idx);
        }

        const indicesToRemove = new Set();
        collectAllIndices(data, idx, indicesToRemove);

        for (const i of indicesToRemove) {
            data[i] = null;
        }

        saveScene(filePath, data);
        outputJson({ success: true, message: `成功删除节点: ${nodePath}` });
    } catch (err) {
        outputError(err.message);
    }
}
