/**
 * .fire / .prefab 文件读写工具
 * @module lib/fire-utils
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { findProjectRoot } from './utils.js';
export function loadScene(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
}
export function saveScene(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
export function isPrefab(data) {
    return data[0]?.__type__ === 'cc.Prefab';
}
export function generateUUID() {
    return crypto.randomUUID();
}
export function generateFileId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
export function createPrefabMeta(uuid) {
    return {
        ver: '1.0.0',
        uuid: uuid,
        optimizationPolicy: 0,
        asyncLoadAssets: false,
        readonly: false
    };
}
export function createSceneMeta(uuid) {
    return {
        ver: '1.0.0',
        uuid: uuid
    };
}
export function saveMetaFile(filePath, meta) {
    fs.writeFileSync(filePath + '.meta', JSON.stringify(meta, null, 2), 'utf-8');
}
export function loadMetaFile(filePath) {
    const metaPath = filePath + '.meta';
    if (!fs.existsSync(metaPath))
        return null;
    const content = fs.readFileSync(metaPath, 'utf-8');
    return JSON.parse(content);
}
export function loadScriptMap(filePath) {
  const projRoot = findProjectRoot(filePath);
  if (!projRoot) return {};

  // 优先从 library/script_map.json 读取缓存
  const mapPath = path.join(projRoot, 'library', 'script_map.json');
  if (fs.existsSync(mapPath)) {
    const content = fs.readFileSync(mapPath, 'utf-8');
    return JSON.parse(content);
  }

  // 没有缓存 → 自动扫描 assets/ 里的 .meta 文件构建映射
  return autoBuildScriptMap(projRoot);
}

/**
 * 自动扫描项目 library/imports/ 目录，
 * 从编译后的脚本中提取 UUID → 类名映射
 * 结果会写入 library/script_map.json 缓存
 * @param {string} projRoot
 * @returns {Object<string,string>}
 */
function autoBuildScriptMap(projRoot) {
  const libDir = path.join(projRoot, 'library', 'imports');
  if (!fs.existsSync(libDir)) {
    return autoBuildFromMeta(projRoot);
  }

  const map = {};
  const scriptFiles = [];

  // 递归收集所有 .js 文件
  walkJsFiles(libDir, scriptFiles);

  for (const jsPath of scriptFiles) {
    try {
      const content = fs.readFileSync(jsPath, 'utf8');
      /**
       * 从 cc._RF.push(module, 'UUID', 'ClassName') 提取映射
       * Cocos Creator 2.x 编译后的每个脚本第一行就是这个格式
       * 第三个参数就是组件类名
       */
      const match = content.match(/cc\._RF\.push\([^,]+,\s*'([^']+)',\s*'([^']+)'\)/);
      if (match) {
        const uuid = match[1];
        const className = match[2];
        if (uuid && className) {
          map[uuid] = className;
          // 提取脚本路径: // script/Xxx.ts
          const pathMatch = content.match(/\/\/\s*(.+\.\w+)$/m);
          if (pathMatch) {
            map['@p/' + uuid] = pathMatch[1].trim();
          }
        }
      }
    } catch {
      // 跳过无法读取的文件
    }
  }

  if (Object.keys(map).length > 0) {
    cacheScriptMap(projRoot, map);
  }

  return map;
}

/**
 * 备用方案：扫描 assets/ 里的 .meta 文件构建映射
 * @param {string} projRoot
 * @returns {Object<string,string>}
 */
function autoBuildFromMeta(projRoot) {
  const assetsDir = path.join(projRoot, 'assets');
  if (!fs.existsSync(assetsDir)) return {};

  const map = {};
  const metaFiles = [];

  walkMetaFiles(assetsDir, metaFiles);

  for (const metaPath of metaFiles) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      const hexUuid = meta.uuid;
      if (!hexUuid) continue;

      const srcPath = metaPath.replace(/\.meta$/, '');
      let className = '';
      if (fs.existsSync(srcPath)) {
        className = extractClassName(srcPath, metaPath);
      }
      if (className) {
        map[hexUuid] = className;
      }
    } catch { /* skip */ }
  }

  if (Object.keys(map).length > 0) {
    cacheScriptMap(projRoot, map);
  }

  return map;
}

/**
 * 将 mapping 缓存到 library/script_map.json
 * @param {string} projRoot
 * @param {Object} map
 */
function cacheScriptMap(projRoot, map) {
  try {
    const libDir = path.join(projRoot, 'library');
    if (!fs.existsSync(libDir)) {
      fs.mkdirSync(libDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(libDir, 'script_map.json'),
      JSON.stringify(map, null, 2),
      'utf-8'
    );
  } catch { /* 写入失败不阻塞 */ }
}

/** 递归收集 .js 文件 */
function walkJsFiles(dir, result) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkJsFiles(fullPath, result);
      } else if (entry.name.endsWith('.js')) {
        result.push(fullPath);
      }
    }
  } catch { /* 跳过 */ }
}

/**
 * 递归遍历目录收集 .js.meta / .ts.meta 文件
 * @param {string} dir
 * @param {string[]} result
 */
function walkMetaFiles(dir, result) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.')) {
          walkMetaFiles(fullPath, result);
        }
      } else if (
        entry.name.endsWith('.js.meta') ||
        entry.name.endsWith('.ts.meta')
      ) {
        result.push(fullPath);
      }
    }
  } catch {
    // 跳过无法读取的目录
  }
}

/**
 * 从 Cocos Creator 脚本文件中提取类名
 * 依次尝试：cc.Class name → @ccclass → class Xxx extends
 * @param {string} srcPath
 * @param {string} metaPath
 * @returns {string}
 */
function extractClassName(srcPath, metaPath) {
  try {
    const content = fs.readFileSync(srcPath, 'utf-8');

    // 1. cc.Class({ name: 'Xxx', ... })
    const ccClassMatch = content.match(/name:\s*['"]([^'"]+)['"]/);
    if (ccClassMatch) return ccClassMatch[1];

    // 2. @ccclass('Xxx') 或 @ccclass("Xxx")
    const decoratorMatch = content.match(/@ccclass\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (decoratorMatch) return decoratorMatch[1];

    // 3. class Xxx extends cc.Component
    const classMatch = content.match(/class\s+(\w+)\s+extends\s+/);
    if (classMatch) return classMatch[1];

    // 4. module.exports = cc.Class({ ... })
    //    (cc.Class without explicit name)
  } catch {
    // 读不了源码就跳过
  }

  // 最后兜底：用文件名作为类名
  const basename = path.basename(srcPath);
  return basename.replace(/\.(js|ts)$/, '');
}
export function buildMaps(data) {
    const nodeMap = new Map();
    const compMap = new Map();
    data.forEach((item, index) => {
        if (!item)
            return;
        if (item.__type__ === 'cc.Node') {
            nodeMap.set(index, item);
        }
        else if (item.__type__?.includes('cc.')) {
            compMap.set(index, item);
        }
    });
    return { nodeMap, compMap };
}
export function findNodeIndex(data, path) {
    return -1;
}
export function rebuildReferences(data) {
}
export function refreshEditor(scenePath) {
}
export function installPlugin() {
}
export function checkPluginStatus() {
    return Promise.resolve(false);
}
export function getPrefabRootIndex(data) {
    return 1;
}
