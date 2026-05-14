#!/usr/bin/env node

/**
 * build 命令 - 构建脚本组件映射
 * 扫描 Cocos 项目的 library/imports，提取 UUID → 类名映射
 * @module commands/build
 */

import * as path from 'path';
import * as fs from 'fs';
import { autoBuildScriptMap } from './lib/fire-utils.js';

const isDirectRun = process.argv[1]?.endsWith('build.js');
if (isDirectRun) {
  run(process.argv.slice(2));
}

export function run(args) {
  const projectDir = args[0];
  if (!projectDir) {
    console.log('用法: node scripts/build.js <Cocos项目目录>');
    console.log('');
    console.log('扫描 Cocos Creator 项目的 library/imports，构建脚本哈希到类名的映射文件。');
    return;
  }

  try {
    const resolvedDir = path.resolve(projectDir);
    if (!fs.existsSync(resolvedDir)) {
      console.log(JSON.stringify({ error: '目录不存在: ' + resolvedDir }));
      return;
    }

    const libDir = path.join(resolvedDir, 'library', 'imports');
    if (!fs.existsSync(libDir)) {
      console.log(JSON.stringify({ error: '未找到 library/imports 目录，请确认是 Cocos Creator 项目且已构建过' }));
      return;
    }

    const map = autoBuildScriptMap(resolvedDir);
    const count = Object.keys(map).length;

    if (count > 0) {
      // 也写入 data/script_map.json
      const dataDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'data');
      if (fs.existsSync(dataDir)) {
        const outPath = path.join(dataDir, 'script_map.json');
        fs.writeFileSync(outPath, JSON.stringify(map, null, 2), 'utf-8');
        console.log('已写入: ' + outPath);
      }
    }

    console.log(JSON.stringify({ success: true, count: count, map: map }, null, 2));
  } catch (err) {
    console.log(JSON.stringify({ error: err.message }));
  }
}
