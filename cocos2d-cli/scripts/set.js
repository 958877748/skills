#!/usr/bin/env node

import { loadScene, saveScene, findNodeIndex } from './lib/fire-utils.js';
import { setNodeProperty } from './lib/node-utils.js';
import { outputJson, outputError } from './lib/utils.js';

const isDirectRun = process.argv[1]?.endsWith('set.js');
if (isDirectRun) {
  run(process.argv.slice(2));
}

/**
 * set 命令 - 修改节点属性
 * @module commands/set
 * @param {string[]} args - [文件路径] [节点路径] [属性名] [值]
 */
export function run(args) {
    const filePath = args[0];
    const nodePath = args[1];
    const key = args[2];
    const value = args[3];

    if (!filePath || !nodePath || !key || value === undefined) {
        outputError('用法: cocos2d-cli set <文件> <节点路径> <属性名> <值>');
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
        setNodeProperty(node, key, value);

        saveScene(filePath, data);
        outputJson({ success: true, message: `成功修改 ${nodePath} 的 ${key} 属性` });
    } catch (err) {
        outputError(err.message);
    }
}
