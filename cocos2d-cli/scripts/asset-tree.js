#!/usr/bin/env node

/**
 * asset-tree 命令 - 查找场景/预制体的所有资源引用，以项目根目录为 root 打印文件树
 * @module commands/asset-tree
 *
 * 用法:
 *   node scripts/asset-tree.js <场景.fire | 预制体.prefab> [--no-tree]
 *
 * --no-tree  不以树形展示，改为平铺列表（按路径排序）
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadScene, loadScriptMap, isPrefab } from './lib/fire-utils.js';
import { findProjectRoot, decompressUUID, compressUUID } from './lib/utils.js';

const isDirectRun = process.argv[1]?.endsWith('asset-tree.js');
if (isDirectRun) {
  run(process.argv.slice(2));
}

/**
 * 递归提取对象中所有 __uuid__ 引用
 * @param {any} obj - 要扫描的对象
 * @param {string} propPath - 当前属性路径（用于定位来源）
 * @returns {Array<{uuid: string, propPath: string}>}
 */
function extractUuidRefs(obj, propPath = '') {
  const results = [];

  if (!obj || typeof obj !== 'object') return results;

  // 数组
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      results.push(...extractUuidRefs(obj[i], `${propPath}[${i}]`));
    }
    return results;
  }

  // 检查是否是 __uuid__ 引用对象
  if (obj.__uuid__ !== undefined) {
    const uuid = obj.__uuid__;
    // Cocos 2.x 的 __uuid__ 可以是完整 UUID 或压缩 UUID
    results.push({ uuid, propPath });
    // __uuid__ 对象内部通常不再有其他 uuid 引用，但以防万一继续扫描
  }

  // 递归扫描其他属性
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__uuid__') continue; // 已处理
    const childPath = propPath ? `${propPath}.${key}` : key;
    results.push(...extractUuidRefs(value, childPath));
  }

  return results;
}

/**
 * 从 .fire/.prefab 数据中提取所有资源引用，并关联到所属节点和组件
 * @param {Array} data - 解析后的 JSON 数组
 * @param {Object} scriptMap - 脚本映射
 * @param {string} projectRoot - 项目根目录
 * @returns {Map<string, Array<{node: string, component: string, props: string[]}>>}
 *   key: uuid, value: 引用该 uuid 的位置列表
 */
function collectAssetRefs(data, scriptMap, projectRoot) {
  /** @type {Map<string, Array<{node: string, component: string, props: string[]}>} */
  const uuidMap = new Map();

  // 构建 index → 节点名映射
  const indexToNodeName = new Map();
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item && item.__type__ === 'cc.Node') {
      indexToNodeName.set(i, item._name || '(unnamed)');
    }
  }

  // 构建组件 index → 所属节点映射
  const compToNode = new Map();
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (!item || item.__type__ === 'cc.Node' || item.__type__ === 'cc.Scene' || item.__type__ === 'cc.SceneAsset' || item.__type__ === 'cc.Prefab') continue;
    if (item.node && item.node.__id__ !== undefined) {
      compToNode.set(i, item.node.__id__);
    } else if (item.__type__ === 'cc.PrefabInfo' && item.root && item.root.__id__ !== undefined) {
      // PrefabInfo 没有 node 属性，用 root 属性定位所属节点
      compToNode.set(i, item.root.__id__);
    }
  }

  // 遍历每个元素提取 uuid
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (!item) continue;

    // 跳过 SceneAsset/Scene/Prefab 容器
    if (item.__type__ === 'cc.SceneAsset' || item.__type__ === 'cc.Scene' || item.__type__ === 'cc.Prefab') continue;

    const refs = extractUuidRefs(item);

    // 确定节点名和组件名
    let nodeName = '';
    let compName = '';

    if (item.__type__ === 'cc.Node') {
      nodeName = item._name || '(unnamed)';
      compName = '';
    } else {
      // 组件
      const nodeIdx = compToNode.get(i);
      nodeName = nodeIdx !== undefined ? (indexToNodeName.get(nodeIdx) || `Node#${nodeIdx}`) : '';
      compName = getComponentDisplayName(item.__type__, scriptMap, projectRoot);

      // 自定义脚本组件: __type__ 本身就是压缩 UUID，也是一种资源引用
      if (item.__type__ && !item.__type__.startsWith('cc.') && item.__type__ !== 'MissingScript') {
        const scriptUuid = item.__type__;
        // 用特殊 prop 标识这是组件类型引用
        refs.unshift({ uuid: scriptUuid, propPath: '__type__', isScriptRef: true });
      }
    }

    if (refs.length === 0) continue;

    for (const ref of refs) {
      // 提取有意义的属性名
      let propName;
      if (ref.isScriptRef) {
        propName = '(script)';
      } else {
        const propMatch = ref.propPath.match(/\.?(_?\w+)$/);
        propName = propMatch ? propMatch[1] : ref.propPath;
      }

      if (!uuidMap.has(ref.uuid)) {
        uuidMap.set(ref.uuid, []);
      }
      uuidMap.get(ref.uuid).push({
        node: nodeName,
        component: compName,
        prop: propName,
      });
    }
  }

  return uuidMap;
}

/**
 * 获取组件显示名
 */
function getComponentDisplayName(typeName, scriptMap, projectRoot) {
  if (!typeName) return '?';

  // 内置 cc 组件
  if (typeName.startsWith('cc.')) {
    return typeName.slice(3); // cc.Sprite → Sprite
  }

  // 从 scriptMap 查找自定义脚本
  if (scriptMap && scriptMap[typeName]) {
    return scriptMap[typeName];
  }

  // 尝试从 library/imports 精准查找
  if (projectRoot) {
    const hex = decompressUUID(typeName);
    if (hex) {
      const first2 = hex.substring(0, 2);
      const libPath = path.join(projectRoot, 'library', 'imports', first2, hex + '.js');
      if (fs.existsSync(libPath)) {
        try {
          const content = fs.readFileSync(libPath, 'utf8');
          const match = content.match(/cc\._RF\.push\([^,]+,\s*'[^']+',\s*'([^']+)'\)/);
          if (match) return match[1];
        } catch { /* skip */ }
      }
    }
  }

  return typeName;
}

/**
 * 构建 UUID → 资源文件路径 映射
 * 通过扫描 assets/ 目录下所有 .meta 文件
 * @param {string} projectRoot - 项目根目录
 * @returns {Map<string, string>} uuid → 相对于项目根的路径
 */
function buildUuidToPathMap(projectRoot) {
  const map = new Map();
  if (!projectRoot) return map;

  const assetsDir = path.join(projectRoot, 'assets');
  if (!fs.existsSync(assetsDir)) return map;

  walkMetaFiles(assetsDir, projectRoot, map);

  return map;
}

/**
 * 递归扫描 .meta 文件，构建 uuid → 路径映射
 */
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
            // 去掉 .meta 后缀得到原始文件路径
            const assetPath = fullPath.replace(/\.meta$/, '');
            const relPath = path.relative(projectRoot, assetPath).replace(/\\/g, '/');
            map.set(meta.uuid, relPath);

            // 如果是 .meta 中的 subAssets，也收录（如 texture 的 spriteFrame）
            if (meta.subMetas) {
              for (const [subKey, subMeta] of Object.entries(meta.subMetas)) {
                if (subMeta.uuid) {
                  // spriteFrame 子资源格式: assets/btn_1.png/spriteFrame
                  // 在树中会显示为 btn_1.png/ → spriteFrame
                  const subRelPath = relPath + '/' + subKey;
                  map.set(subMeta.uuid, subRelPath);
                }
              }
            }
          }
        } catch { /* skip invalid meta */ }
      }
    }
  } catch { /* skip unreadable dir */ }
}

/**
 * 将完整 UUID 尝试匹配到 uuidToPath 映射中
 * 支持完整 hex UUID 和压缩 UUID
 * @param {string} uuid
 * @param {Map<string, string>} uuidToPath
 * @returns {string|null}
 */
function resolveUuidToPath(uuid, uuidToPath) {
  // 直接匹配
  if (uuidToPath.has(uuid)) return uuidToPath.get(uuid);

  // 如果是压缩 UUID (22-23 位)，尝试解压后匹配
  if (uuid.length === 22 || uuid.length === 23) {
    const hex = decompressUUID(uuid);
    if (hex && uuidToPath.has(hex)) return uuidToPath.get(hex);
  }

  // 如果是完整 hex UUID，尝试压缩后匹配
  const hexRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (hexRegex.test(uuid)) {
    const short = compressUUID(uuid, true);
    if (uuidToPath.has(short)) return uuidToPath.get(short);
    const long = compressUUID(uuid, false);
    if (uuidToPath.has(long)) return uuidToPath.get(long);
    // 也试试不带连字符的 hex
    const noDash = uuid.replace(/-/g, '');
    if (uuidToPath.has(noDash)) return uuidToPath.get(noDash);
  }

  return null;
}

/**
 * 通过 library/imports 中的编译文件反查脚本源文件路径
 * @param {string} hexUuid - 完整 hex UUID
 * @param {string} projectRoot
 * @returns {string|null} 相对项目根的路径
 */
function findScriptSourcePath(hexUuid, projectRoot) {
  if (!projectRoot || !hexUuid) return null;
  const first2 = hexUuid.substring(0, 2);
  const libPath = path.join(projectRoot, 'library', 'imports', first2, hexUuid + '.js');
  if (!fs.existsSync(libPath)) return null;

  try {
    const content = fs.readFileSync(libPath, 'utf8');
    const pathMatch = content.match(/\/\/\s*(.+\.\w+)$/m);
    if (pathMatch) {
      return 'assets/' + pathMatch[1].trim();
    }
  } catch { /* skip */ }

  return null;
}

/**
 * 获取文件类型标签
 * @param {string} relPath - 相对路径
 * @returns {string}
 */
function getFileTypeLabel(relPath) {
  // 特殊虚拟目录
  if (relPath.startsWith('__builtin__/')) return '⚙️';
  if (relPath.startsWith('__unresolved__/')) return '❓';

  const ext = path.extname(relPath).toLowerCase();
  const labels = {
    '.png': '🖼️',
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.webp': '🖼️',
    '.bmp': '🖼️',
    '.fire': '🎬',
    '.prefab': '🧩',
    '.js': '📜',
    '.ts': '📜',
    '.json': '📋',
    '.mp3': '🔊',
    '.wav': '🔊',
    '.ogg': '🔊',
    '.font': '🔤',
    '.ttf': '🔤',
    '.woff': '🔤',
    '.plist': '📦',
    '.atlas': '📦',
    '.anim': '🎯',
    '.scene': '🎬',
  };
  return labels[ext] || '📄';
}

/**
 * 识别 Cocos Creator 引擎内置资源 UUID
 * @param {string} uuid
 * @returns {string|null}
 */
function getBuiltinResourceName(uuid) {
  // 同时支持完整 hex UUID 和压缩 UUID
  const builtins = {
    // db://internal/resources/materials/builtin-2d-sprite.mtl
    'eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432': 'builtin-2d-sprite.mtl',
    'ecpdLyjvZBwrvm+cedCcQy': 'builtin-2d-sprite.mtl',
    // 默认精灵
    'a23235d1-15db-4b95-8439-a2e005bfff91': 'default_sprite_splash',
    // 内置 UI 资源
    '7d8c6e42-a4db-4bfd-9c8e-d3727394f344': 'default_scrollbar',
    '02c4a0a0-5e80-4ae0-9446-0c8d6d71b0f0': 'default_checkbox',
    '20f48502-3c7e-4171-88af-5ac3c7b8e976': 'default_progressbar',
    'b19db950-0e84-4a72-842e-6a4f536e0a6f': 'default_slider',
    'a5cd6c05-6eef-4a5b-971e-2e51a26ee896': 'default_toggle',
    'af95a9f0-4d1c-4b8e-9a22-58c7d00c60ac': 'default_btn_normal',
    'e4e94710-5701-4c3e-8b1e-5ce6f1c22833': 'default_btn_pressed',
    'c2562f20-3c5b-4fb9-8cce-d4b6b7b5e9f8': 'default_btn_disabled',
    // 其他内置
    '4b331643-9a43-41bd-8e7c-6c6c6b8e8e8e': 'default_graphics',
    '0c6e5311d-1d0b-42a0-9bc1-5e3e9a123810': 'default_label',
  };
  return builtins[uuid] || null;
}

/**
 * 将路径列表构建为树形结构并打印
 * @param {Map<string, {relPath: string, uuid: string, refs: Array}>} assetInfoMap
 * @param {string} rootLabel - 根节点标签
 */
function printAssetTree(assetInfoMap, rootLabel, showRefs) {
  // 构建路径树
  // 使用 Symbol 避免元数据 key 与路径名冲突
  const META = {
    isFile: Symbol('isFile'),
    uuid: Symbol('uuid'),
    refs: Symbol('refs'),
  };

  const tree = {};

  for (const [relPath, info] of assetInfoMap) {
    const parts = info.relPath.split('/');
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      if (i === parts.length - 1) {
        // 叶子节点 - 标记为文件
        current[part][META.isFile] = true;
        current[part][META.uuid] = info.uuid;
        current[part][META.refs] = info.refs;
      }
      current = current[part];
    }
  }

  // 递归打印树
  console.log(rootLabel + '/');

  const keys = Object.keys(tree).sort((a, b) => {
    const aIsFile = tree[a][META.isFile];
    const bIsFile = tree[b][META.isFile];
    if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
    // __builtin__ 排最后，__unresolved__ 排更后
    const specialOrder = { '__builtin__': 1, '__unresolved__': 2 };
    const aOrder = specialOrder[a] ?? 0;
    const bOrder = specialOrder[b] ?? 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.localeCompare(b);
  });

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const isLast = i === keys.length - 1;
    printTreeNode(tree[key], key, '', isLast, true, META, showRefs);
  }
}

/**
 * 递归打印树节点
 */
function printTreeNode(node, name, prefix, isLast, isRoot, META, showRefs) {
  const connector = isLast ? '└── ' : '├── ';
  const isFile = node[META.isFile];

  if (isFile) {
    const label = getFileTypeLabel(name);
    const refs = node[META.refs] || [];
    const refCount = refs.length;
    const uuid = node[META.uuid];
    const uuidHint = uuid && !name.includes(uuid) && !uuid.startsWith('__') ? ` [${uuid}]` : '';
    console.log(`${prefix}${connector}${label} ${name}${uuidHint} (x${refCount})`);
    if (showRefs && refCount > 0) {
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      for (let i = 0; i < refs.length; i++) {
        const ref = refs[i];
        const refConnector = i === refs.length - 1 ? '└── ' : '├── ';
        const comp = ref.component && ref.component !== ref.node ? `.${ref.component}` : '';
        console.log(`${childPrefix}${refConnector}${ref.node}${comp}.${ref.prop}`);
      }
    }
  } else {
    // 判断是否为 "容器文件"（如 btn_1.png 包含 spriteFrame 子资产）
    const childKeys = Object.keys(node);
    const hasFileChildren = childKeys.some(k => node[k][META.isFile]);
    const isAssetContainer = !node[META.isFile] && hasFileChildren && isSubAssetContainer(name);

    if (isAssetContainer) {
      // 容器文件：显示为文件但展开子资产
      const label = getFileTypeLabel(name);
      console.log(`${prefix}${connector}${label} ${name}/`);
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      const keys = childKeys.sort((a, b) => {
        const aIsFile = node[a][META.isFile];
        const bIsFile = node[b][META.isFile];
        if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
        return a.localeCompare(b);
      });

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const childIsLast = i === keys.length - 1;
        printTreeNode(node[key], key, childPrefix, childIsLast, false, META, showRefs);
      }
    } else {
      console.log(`${prefix}${connector}📁 ${name}/`);
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      const keys = Object.keys(node).sort((a, b) => {
        const aIsFile = node[a][META.isFile];
        const bIsFile = node[b][META.isFile];
        if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
        const specialOrder = { '__builtin__': 1, '__unresolved__': 2 };
        const aOrder = specialOrder[a] ?? 0;
        const bOrder = specialOrder[b] ?? 0;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.localeCompare(b);
      });

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const childIsLast = i === keys.length - 1;
        printTreeNode(node[key], key, childPrefix, childIsLast, false, META, showRefs);
      }
    }
  }
}

/**
 * 判断节点名是否是 "子资产容器"（如 .png 纹理包含 spriteFrame 子资产）
 * @param {string} name
 * @returns {boolean}
 */
function isSubAssetContainer(name) {
  // .png / .jpg 纹理文件通常包含 spriteFrame 子资产
  const ext = path.extname(name).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.bmp'].includes(ext);
}

/**
 * 打印平铺列表
 */
function printFlatList(assetInfoMap, rootLabel) {
  // 按路径排序
  const sorted = [...assetInfoMap.entries()].sort((a, b) => a[1].relPath.localeCompare(b[1].relPath));

  console.log(`=== ${rootLabel} 引用列表 ===\n`);
  for (const [uuid, info] of sorted) {
    const label = getFileTypeLabel(info.relPath);
    const refCount = info.refs.length;
    console.log(`  ${label} ${info.relPath} (x${refCount})`);
    // 打印详细引用
    for (const ref of info.refs) {
      const comp = ref.component && ref.component !== ref.node ? `.${ref.component}` : '';
      console.log(`      ← ${ref.node}${comp}.${ref.prop}`);
    }
  }

  console.log(`\n共 ${sorted.length} 个资源文件，${[...assetInfoMap.values()].reduce((s, i) => s + i.refs.length, 0)} 处引用`);
}

export function run(args) {
  const filePath = args[0];
  if (!filePath || filePath.startsWith('--')) {
    console.log('用法: node scripts/asset-tree.js <场景.fire | 预制体.prefab> [选项]');
    console.log('');
    console.log('选项:');
    console.log('  --no-tree   不以树形展示，改为平铺列表（按路径排序）');
    console.log('  --refs      在树形中显示每个资源的引用详情');
    return;
  }

  // 解析参数
  let useTree = true;
  let showRefs = false;
  for (const arg of args.slice(1)) {
    if (arg === '--no-tree') useTree = false;
    if (arg === '--refs') showRefs = true;
  }

  try {
    const data = loadScene(filePath);
    if (!data || data.length === 0) {
      console.log(JSON.stringify({ error: '文件为空或格式错误' }));
      return;
    }

    const projectRoot = findProjectRoot(filePath);
    const scriptMap = loadScriptMap(filePath);

    // 1. 提取所有 uuid 引用
    const uuidMap = collectAssetRefs(data, scriptMap, projectRoot);

    if (uuidMap.size === 0) {
      console.log('该文件无任何资源引用。');
      return;
    }

    // 2. 构建 uuid → 文件路径映射
    const uuidToPath = buildUuidToPathMap(projectRoot);

    // 2.5 补充 scriptMap 中的路径映射
    if (scriptMap) {
      for (const [key, value] of Object.entries(scriptMap)) {
        if (key.startsWith('@p/')) {
          // @p/uuid → 脚本路径，将对应的 uuid 也加入映射
          const uuid = key.slice(3);
          // scriptMap 路径可能是 script/Xxx.ts 或 assets/script/Xxx.ts
          let scriptRelPath = value;
          if (!scriptRelPath.startsWith('assets/')) {
            scriptRelPath = 'assets/' + scriptRelPath;
          }
          if (!uuidToPath.has(uuid)) {
            uuidToPath.set(uuid, scriptRelPath);
          }
        } else {
          // uuid → className，但没有路径信息，从 library/imports 找
          if (!uuidToPath.has(key)) {
            const hex = decompressUUID(key);
            if (hex) {
              const srcPath = findScriptSourcePath(hex, projectRoot);
              if (srcPath) {
                uuidToPath.set(key, srcPath);
              }
            }
          }
        }
      }
    }

    // 3. 解析 uuid 到路径
    const assetInfoMap = new Map(); // relPath → { relPath, uuid, refs }
    for (const [uuid, refs] of uuidMap) {
      const relPath = resolveUuidToPath(uuid, uuidToPath);
      if (relPath) {
        if (assetInfoMap.has(relPath)) {
          // 合并引用
          assetInfoMap.get(relPath).refs.push(...refs);
        } else {
          assetInfoMap.set(relPath, { relPath, uuid, refs: [...refs] });
        }
      } else {
        // 未找到对应文件 - 标记为内置/未解析
        // 尝试识别引擎内置资源
        const builtins = getBuiltinResourceName(uuid);
        const unknownPath = builtins
          ? `__builtin__/${builtins}`
          : `__unresolved__/${uuid}`;
        if (assetInfoMap.has(unknownPath)) {
          assetInfoMap.get(unknownPath).refs.push(...refs);
        } else {
          assetInfoMap.set(unknownPath, { relPath: unknownPath, uuid, refs: [...refs] });
        }
      }
    }

    // 4. 输出
    const fileName = path.basename(filePath);
    const rootLabel = projectRoot ? path.basename(projectRoot) : path.dirname(filePath);

    // 打印文件信息头
    const prefab = isPrefab(data);
    const typeLabel = prefab ? '🧩 预制体' : '🎬 场景';
    console.log(`${typeLabel}: ${fileName}`);
    console.log('');

    if (useTree) {
      printAssetTree(assetInfoMap, rootLabel, showRefs);
    } else {
      printFlatList(assetInfoMap, rootLabel);
    }

    // 统计
    const totalRefs = [...assetInfoMap.values()].reduce((s, i) => s + i.refs.length, 0);
    const allKeys = [...assetInfoMap.keys()];
    const resolvedCount = allKeys.filter(k => !k.startsWith('__')).length;
    const builtinCount = allKeys.filter(k => k.startsWith('__builtin__/')).length;
    const unresolvableCount = allKeys.filter(k => k.startsWith('__unresolved__/')).length;
    console.log('');
    console.log(`─── 统计 ───`);
    console.log(`  引用总数: ${totalRefs}`);
    console.log(`  资源文件: ${resolvedCount}`);
    if (builtinCount > 0) {
      console.log(`  内置资源: ${builtinCount}`);
    }
    if (unresolvableCount > 0) {
      console.log(`  未解析UUID: ${unresolvableCount} (可能是引擎内置资源或项目 library 未构建)`);
    }

  } catch (err) {
    console.log(JSON.stringify({ error: err.message }));
  }
}
