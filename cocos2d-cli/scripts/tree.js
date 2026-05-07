#!/usr/bin/env node

/** @module commands/tree */

import { loadScene, loadScriptMap, isPrefab } from './lib/fire-utils.js';
import { buildTree } from './lib/node-utils.js';
import { findProjectRoot } from './lib/utils.js';

/** 直接执行: node commands/tree.js <文件> [--format=...] */
const isDirectRun = process.argv[1]?.endsWith('tree.js');
if (isDirectRun) {
  run(process.argv.slice(2));
}

export function run(args) {
    const filePath = args[0];
    if (!filePath || filePath.startsWith('--')) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli tree <场景.fire | 预制体.prefab> [--format=name|path|full] [--depth=N] [--expand=NodePath] [--no-color]' }));
        return;
    }

    // 解析参数
    let format = 'name';
    let depth = Infinity;
    let expandPath = '';
    for (const arg of args.slice(1)) {
      if (arg.startsWith('--format=')) format = arg.split('=')[1];
      if (arg.startsWith('--depth=')) depth = parseInt(arg.split('=')[1], 10);
      if (arg.startsWith('--expand=')) expandPath = arg.split('=')[1];
    }

    try {
        const data = loadScene(filePath);
        if (!data || data.length === 0) {
            console.log(JSON.stringify({ error: '文件为空或格式错误' }));
            return;
        }
        const scriptMap = loadScriptMap(filePath);
        const projectRoot = findProjectRoot(filePath);
        const prefab = isPrefab(data);
        const startIndex = prefab ? 0 : 1;
        const tree = buildTree(data, scriptMap, startIndex, projectRoot, format, depth, expandPath);
        console.log(tree ? tree.trim() : '{}');
    }
    catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}
