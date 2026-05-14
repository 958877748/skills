#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { loadScene, loadScriptMap } from './lib/fire-utils.js';
import { findProjectRoot, decompressUUID, compressUUID } from './lib/utils.js';

const isDirectRun = process.argv[1]?.endsWith('anim-asset-tree.js');
if (isDirectRun) {
  run(process.argv.slice(2));
}

function loadAnimFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(content);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  return [parsed];
}

function extractUuidRefs(obj, propPath) {
  if (propPath === undefined) propPath = '';
  const results = [];
  if (!obj || typeof obj !== 'object') return results;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      results.push(...extractUuidRefs(obj[i], propPath + '[' + i + ']'));
    }
    return results;
  }

  if (obj.__uuid__ !== undefined) {
    results.push({ uuid: obj.__uuid__, propPath: propPath });
  }

  for (const key of Object.keys(obj)) {
    if (key === '__uuid__') continue;
    const childPath = propPath ? propPath + '.' + key : key;
    results.push(...extractUuidRefs(obj[key], childPath));
  }

  return results;
}

function collectAnimAssetRefs(data) {
  const clip = Array.isArray(data) ? data[0] : data;
  if (!clip || clip.__type__ !== 'cc.AnimationClip') return null;

  const refs = extractUuidRefs(clip);
  return refs;
}

function buildUuidToPathMap(projectRoot) {
  const map = new Map();
  if (!projectRoot) return map;
  const assetsDir = path.join(projectRoot, 'assets');
  if (!fs.existsSync(assetsDir)) return map;
  walkMetaFiles(assetsDir, projectRoot, map);
  return map;
}

function walkMetaFiles(dir, projectRoot, map) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkMetaFiles(fullPath, projectRoot, map);
      } else if (entry.name.endsWith('.meta')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const meta = JSON.parse(content);
          if (meta.uuid) {
            const assetPath = fullPath.replace(/\.meta$/, '');
            const relPath = path.relative(projectRoot, assetPath).replace(/\\/g, '/');
            map.set(meta.uuid, relPath);
            if (meta.subMetas) {
              for (const subKey of Object.keys(meta.subMetas)) {
                const subMeta = meta.subMetas[subKey];
                if (subMeta.uuid) {
                  map.set(subMeta.uuid, relPath + '/' + subKey);
                }
              }
            }
          }
        } catch { /* skip */ }
      }
    }
  } catch { /* skip */ }
}

function resolveUuidToPath(uuid, uuidToPath) {
  if (uuidToPath.has(uuid)) return uuidToPath.get(uuid);
  if (uuid.length === 22 || uuid.length === 23) {
    const hex = decompressUUID(uuid);
    if (hex && uuidToPath.has(hex)) return uuidToPath.get(hex);
  }
  const hexRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (hexRegex.test(uuid)) {
    const short = compressUUID(uuid, true);
    if (uuidToPath.has(short)) return uuidToPath.get(short);
    const long = compressUUID(uuid, false);
    if (uuidToPath.has(long)) return uuidToPath.get(long);
  }
  return null;
}

function getFileTypeLabel(relPath) {
  if (relPath.startsWith('__builtin__/')) return '⚙️';
  if (relPath.startsWith('__unresolved__/')) return '❓';
  const ext = path.extname(relPath).toLowerCase();
  const labels = {
    '.png': '🖼️', '.jpg': '🖼️', '.jpeg': '🖼️', '.webp': '🖼️',
    '.fire': '🎬', '.prefab': '🧩',
    '.js': '📜', '.ts': '📜',
    '.mp3': '🔊', '.wav': '🔊', '.ogg': '🔊',
    '.font': '🔤', '.ttf': '🔤',
    '.plist': '📦', '.atlas': '📦',
    '.anim': '🎯',
  };
  return labels[ext] || '📄';
}

function getBuiltinResourceName(uuid) {
  const builtins = {
    'eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432': 'builtin-2d-sprite.mtl',
    'ecpdLyjvZBwrvm+cedCcQy': 'builtin-2d-sprite.mtl',
    'a23235d1-15db-4b95-8439-a2e005bfff91': 'default_sprite_splash',
  };
  return builtins[uuid] || null;
}

function printRefTree(assetInfoMap, rootLabel) {
  const META = { isFile: Symbol('isFile'), uuid: Symbol('uuid') };
  const tree = {};

  for (const [relPath, info] of assetInfoMap) {
    const parts = info.relPath.split('/');
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current[part]) current[part] = {};
      if (i === parts.length - 1) {
        current[part][META.isFile] = true;
        current[part][META.uuid] = info.uuid;
      }
      current = current[part];
    }
  }

  console.log(rootLabel + '/');
  const keys = Object.keys(tree).sort(function(a, b) {
    const aIsFile = tree[a][META.isFile];
    const bIsFile = tree[b][META.isFile];
    if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
    const specialOrder = { '__builtin__': 1, '__unresolved__': 2 };
    const aOrder = specialOrder[a] || 0;
    const bOrder = specialOrder[b] || 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  for (let i = 0; i < keys.length; i++) {
    printNode(tree[keys[i]], keys[i], '', i === keys.length - 1, true, META);
  }
}

function printNode(node, name, prefix, isLast, isRoot, META) {
  const connector = isLast ? '└── ' : '├── ';
  if (node[META.isFile]) {
    const label = getFileTypeLabel(name);
    console.log(prefix + connector + label + ' ' + name);
  } else {
    const childKeys = Object.keys(node);
    const hasFileChildren = childKeys.some(function(k) { return node[k][META.isFile]; });
    const isAssetContainer = !node[META.isFile] && hasFileChildren && isSubAssetContainer(name);

    if (isAssetContainer) {
      const label = getFileTypeLabel(name);
      console.log(prefix + connector + label + ' ' + name + '/');
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      const sorted = childKeys.sort(function(a, b) {
        const aIsFile = node[a][META.isFile];
        const bIsFile = node[b][META.isFile];
        if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      });
      for (let i = 0; i < sorted.length; i++) {
        printNode(node[sorted[i]], sorted[i], childPrefix, i === sorted.length - 1, false, META);
      }
    } else {
      console.log(prefix + connector + '📁 ' + name + '/');
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      const sorted = Object.keys(node).sort(function(a, b) {
        const aIsFile = node[a][META.isFile];
        const bIsFile = node[b][META.isFile];
        if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      });
      for (let i = 0; i < sorted.length; i++) {
        printNode(node[sorted[i]], sorted[i], childPrefix, i === sorted.length - 1, false, META);
      }
    }
  }
}

function isSubAssetContainer(name) {
  const ext = path.extname(name).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.bmp'].includes(ext);
}

export function run(args) {
  const filePath = args[0];
  if (!filePath || filePath.startsWith('--')) {
    console.log('用法: node scripts/anim-asset-tree.js <动画文件.anim> [选项]');
    console.log('');
    console.log('选项:');
    console.log('  --json      以 JSON 格式输出（机器可读）');
    console.log('  --flat      以平铺列表输出');
    return;
  }

  let asJson = false;
  let asFlat = false;
  for (const arg of args.slice(1)) {
    if (arg === '--json') asJson = true;
    if (arg === '--flat') asFlat = true;
  }

  try {
    const data = loadAnimFile(filePath);
    const clip = Array.isArray(data) ? data[0] : data;
    if (!clip || clip.__type__ !== 'cc.AnimationClip') {
      console.log(JSON.stringify({ error: '文件不是有效的 AnimationClip (.anim) 文件' }));
      return;
    }

    const refs = collectAnimAssetRefs(data);
    if (!refs || refs.length === 0) {
      console.log('该动画文件无任何资源引用。');
      return;
    }

    const projectRoot = findProjectRoot(filePath);
    const uuidToPath = buildUuidToPathMap(projectRoot);

    const assetInfoMap = new Map();
    for (const ref of refs) {
      const relPath = resolveUuidToPath(ref.uuid, uuidToPath);
      if (relPath) {
        if (!assetInfoMap.has(relPath)) {
          assetInfoMap.set(relPath, { relPath: relPath, uuid: ref.uuid });
        }
      } else {
        const builtinName = getBuiltinResourceName(ref.uuid);
        const unknownPath = builtinName
          ? '__builtin__/' + builtinName
          : '__unresolved__/' + ref.uuid;
        if (!assetInfoMap.has(unknownPath)) {
          assetInfoMap.set(unknownPath, { relPath: unknownPath, uuid: ref.uuid });
        }
      }
    }

    const fileName = path.basename(filePath);
    console.log('🎯 Animation: ' + fileName);

    if (asJson) {
      const out = [];
      for (const [relPath, info] of assetInfoMap) {
        out.push({ uuid: info.uuid, path: relPath });
      }
      console.log(JSON.stringify({ file: fileName, refs: out }, null, 2));
      return;
    }

    const resolvedList = [];
    const unresolvedList = [];
    for (const [relPath, info] of assetInfoMap) {
      if (relPath.startsWith('__builtin__/') || relPath.startsWith('__unresolved__/')) {
        unresolvedList.push(info);
      } else {
        resolvedList.push(info);
      }
    }

    if (asFlat) {
      console.log('');
      console.log('  引用的资源:');
      if (resolvedList.length > 0) {
        const sorted = resolvedList.sort(function(a, b) {
          if (a.relPath < b.relPath) return -1;
          if (a.relPath > b.relPath) return 1;
          return 0;
        });
        for (const info of sorted) {
          const label = getFileTypeLabel(info.relPath);
          console.log('    ' + label + ' ' + info.relPath);
        }
      }
      if (unresolvedList.length > 0) {
        console.log('');
        console.log('  未解析的资源:');
        for (const info of unresolvedList) {
          const label = getFileTypeLabel(info.relPath);
          console.log('    ' + label + ' ' + info.relPath);
        }
      }
      console.log('');
      console.log('  共 ' + resolvedList.length + ' 个已解析资源，' + unresolvedList.length + ' 个未解析');
      return;
    }

    const rootLabel = projectRoot ? path.basename(projectRoot) : path.dirname(filePath);
    console.log('');
    printRefTree(assetInfoMap, rootLabel);

    const allKeys = [...assetInfoMap.keys()];
    const resolvedCount = allKeys.filter(function(k) { return !k.startsWith('__'); }).length;
    const builtinCount = allKeys.filter(function(k) { return k.startsWith('__builtin__/'); }).length;
    const unresolvableCount = allKeys.filter(function(k) { return k.startsWith('__unresolved__/'); }).length;

    console.log('');
    console.log('─── 统计 ───');
    console.log('  资源文件: ' + resolvedCount);
    if (builtinCount > 0) console.log('  内置资源: ' + builtinCount);
    if (unresolvableCount > 0) console.log('  未解析UUID: ' + unresolvableCount + ' (可能是引擎内置资源或项目 library 未构建)');

  } catch (err) {
    console.log(JSON.stringify({ error: err.message }));
  }
}
