#!/usr/bin/env node

/**
 * start-scene — 获取/设置 Cocos Creator 项目的开始场景
 *
 * 用法:
 *   node scripts/start-scene.js                       # 获取当前开始场景
 *   node scripts/start-scene.js <项目路径>             # 指定项目目录获取
 *   node scripts/start-scene.js --set <场景.fire>      # 设置开始场景
 *   node scripts/start-scene.js --set <场景.fire> -p <项目路径>
 *
 * 获取输出:
 *   db://assets/scene/main.fire
 *
 * 设置输出:
 *   {"success":"开始场景已设置为 db://assets/scene/GameWorld.fire"}
 */

import * as fs from 'fs';
import * as path from 'path';
import { findProjectRoot } from './lib/utils.js';

function getProjectRoot(args) {
  // 支持 -p <路径> 指定项目目录
  const pIndex = args.indexOf('-p');
  const projectDir = pIndex !== -1 ? args[pIndex + 1] : (args[0] && !args[0].startsWith('--') ? args[0] : process.cwd());

  const projectRoot = findProjectRoot(path.join(projectDir, 'settings/project.json'))
    || findProjectRoot(path.join(projectDir, 'assets'));

  if (!projectRoot) {
    console.log(JSON.stringify({ error: '无法找到 Cocos Creator 项目根目录' }));
    process.exit(1);
  }
  return projectRoot;
}

function getStartScene(projectRoot) {
  const builderPath = path.join(projectRoot, 'settings', 'builder.json');
  if (!fs.existsSync(builderPath)) {
    console.log(JSON.stringify({ error: 'settings/builder.json 不存在' }));
    process.exit(1);
  }

  const builder = JSON.parse(fs.readFileSync(builderPath, 'utf-8'));
  const startSceneUUID = builder.startScene;
  if (!startSceneUUID) {
    console.log(JSON.stringify({ error: 'builder.json 中未设置 startScene' }));
    process.exit(1);
  }

  // 递归扫描 assets/ 下所有 .fire.meta 文件，匹配 UUID
  const assetsDir = path.join(projectRoot, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.log(JSON.stringify({ error: 'assets/ 目录不存在' }));
    process.exit(1);
  }

  let matchedFile = null;

  function walkDir(dir, relativeDir) {
    if (matchedFile) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (matchedFile) return;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.')) {
          walkDir(fullPath, path.join(relativeDir, entry.name));
        }
      } else if (entry.name.endsWith('.fire.meta')) {
        try {
          const meta = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
          if (meta.uuid === startSceneUUID) {
            const fireFile = path.join('assets', relativeDir, entry.name.replace(/\.meta$/, ''));
            matchedFile = `db://${fireFile.replace(/\\/g, '/')}`;
            return;
          }
        } catch {
          // 跳过无法解析的 .meta
        }
      }
    }
  }

  walkDir(assetsDir, '');

  if (!matchedFile) {
    const excluded = builder.excludeScenes || [];
    if (excluded.includes(startSceneUUID)) {
      console.log(JSON.stringify({ error: `开始场景 UUID (${startSceneUUID}) 在 excludeScenes 中，可能被排除了` }));
    } else {
      console.log(JSON.stringify({ error: `未找到 UUID 为 ${startSceneUUID} 的场景文件` }));
    }
    process.exit(1);
  }

  console.log(matchedFile);
}

function setStartScene(projectRoot, scenePath) {
  // 解析场景文件的绝对路径
  const firePath = path.resolve(projectRoot, scenePath);
  const metaPath = firePath + '.meta';

  if (!fs.existsSync(metaPath)) {
    console.log(JSON.stringify({ error: `找不到场景文件的 .meta: ${metaPath}` }));
    process.exit(1);
  }

  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  } catch {
    console.log(JSON.stringify({ error: `无法解析 .meta 文件: ${metaPath}` }));
    process.exit(1);
  }

  if (!meta.uuid) {
    console.log(JSON.stringify({ error: `.meta 文件中没有 UUID` }));
    process.exit(1);
  }

  const builderPath = path.join(projectRoot, 'settings', 'builder.json');
  if (!fs.existsSync(builderPath)) {
    console.log(JSON.stringify({ error: 'settings/builder.json 不存在' }));
    process.exit(1);
  }

  const builder = JSON.parse(fs.readFileSync(builderPath, 'utf-8'));
  builder.startScene = meta.uuid;

  fs.writeFileSync(builderPath, JSON.stringify(builder, null, 2), 'utf-8');

  // 转成 db: 格式输出
  const relPath = path.relative(projectRoot, firePath).replace(/\\/g, '/');
  const dbPath = `db://${relPath}`;
  console.log(JSON.stringify({ success: `开始场景已设置为 ${dbPath}` }));
}

function main(args) {
  const setIndex = args.indexOf('--set');
  if (setIndex !== -1) {
    const scenePath = args[setIndex + 1];
    if (!scenePath) {
      console.log(JSON.stringify({ error: '--set 需要指定场景文件路径' }));
      process.exit(1);
    }
    // 去掉 -p 及其值，避免干扰 getProjectRoot
    const filteredArgs = args.filter((_, i) => {
      if (args[i] === '-p') return false;
      if (i > 0 && args[i - 1] === '-p') return false;
      return true;
    });
    const projectRoot = getProjectRoot(filteredArgs);
    setStartScene(projectRoot, scenePath);
  } else {
    const projectRoot = getProjectRoot(args);
    getStartScene(projectRoot);
  }
}

// 直接运行时
const isDirectRun = process.argv[1]?.endsWith('start-scene.js');
if (isDirectRun) {
  main(process.argv.slice(2));
}

export { main, getProjectRoot, getStartScene, setStartScene };
