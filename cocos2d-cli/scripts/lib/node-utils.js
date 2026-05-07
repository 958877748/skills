/**
 * 节点树构建/遍历工具
 * @module lib/node-utils
 */

import { generateId, parseColorToCcColor, decompressUUID } from './utils.js';
import * as fs from 'fs';
import * as path from 'path';
export function createNodeData(name) {
    return {
        __type__: 'cc.Node',
        _name: name,
        _objFlags: 0,
        _parent: null,
        _children: [],
        _active: true,
        _components: [],
        _prefab: null,
        _opacity: 255,
        _color: { __type__: 'cc.Color', r: 255, g: 255, b: 255, a: 255 },
        _contentSize: { __type__: 'cc.Size', width: 100, height: 100 },
        _anchorPoint: { __type__: 'cc.Vec2', x: 0.5, y: 0.5 },
        _trs: {
            __type__: 'TypedArray',
            ctor: 'Float64Array',
            array: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
        },
        _eulerAngles: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
        _skewX: 0,
        _skewY: 0,
        _is3DNode: false,
        _groupIndex: 0,
        groupIndex: 0,
        _id: generateId()
    };
}
export function setNodeProperty(node, key, value) {
    if (key === 'x') {
        node._trs.array[0] = parseFloat(value);
    }
    else if (key === 'y') {
        node._trs.array[1] = parseFloat(value);
    }
    else if (key === 'width') {
        node._contentSize.width = parseFloat(value);
    }
    else if (key === 'height') {
        node._contentSize.height = parseFloat(value);
    }
    else if (key === 'scaleX') {
        node._trs.array[7] = parseFloat(value);
    }
    else if (key === 'scaleY') {
        node._trs.array[8] = parseFloat(value);
    }
    else if (key === 'rotation') {
        node._trs.array[5] = parseFloat(value) * Math.PI / 180;
        node._eulerAngles.z = parseFloat(value);
    }
    else if (key === 'opacity') {
        node._opacity = parseInt(value);
    }
    else if (key === 'color') {
        const c = parseColorToCcColor(value);
        if (c)
            node._color = c;
    }
    else if (key === 'anchorX') {
        node._anchorPoint.x = parseFloat(value);
    }
    else if (key === 'anchorY') {
        node._anchorPoint.y = parseFloat(value);
    }
    else if (key === 'name') {
        node._name = value;
    }
    else if (key === 'active') {
        node._active = value === 'true' || value === true;
    }
}
export function setNodeProperties(node, props) {
    for (const [key, value] of Object.entries(props)) {
        setNodeProperty(node, key, value);
    }
}
export function getNodeState(node) {
    return {
        name: node._name,
        active: node._active,
        x: node._trs?.array?.[0] ?? 0,
        y: node._trs?.array?.[1] ?? 0,
        width: node._contentSize?.width ?? 100,
        height: node._contentSize?.height ?? 100,
        scaleX: node._trs?.array?.[7] ?? 1,
        scaleY: node._trs?.array?.[8] ?? 1,
        rotation: node._eulerAngles?.z ?? 0,
        opacity: node._opacity ?? 255,
        anchorX: node._anchorPoint?.x ?? 0.5,
        anchorY: node._anchorPoint?.y ?? 0.5
    };
}
export function collectNodeAndChildren(node) {
    const result = [node];
    if (node._children) {
        node._children.forEach((child) => {
            result.push(...collectNodeAndChildren(child));
        });
    }
    return result;
}
export function removeFromParent(node) {
    if (!node._parent)
        return false;
    const idx = node._parent._children.indexOf(node);
    if (idx > -1) {
        node._parent._children.splice(idx, 1);
        node._parent = null;
        return true;
    }
    return false;
}
export function deleteNode(node) {
    return removeFromParent(node);
}
export function buildTree(data, scriptMap, startIndex, projectRoot, format, depth = Infinity, expandPath = '') {
  const root = data[startIndex];
  if (!root)
    return '';
  if (root.__type__ === 'cc.Prefab') {
    const prefabNode = data[1];
    if (!prefabNode)
      return '';
    let result = prefabNode._name || 'Root';
    result += buildComponentInfo(data, prefabNode, scriptMap, projectRoot, format);
    result += '\n';
    if (prefabNode._children && prefabNode._children.length > 0 && depth > 0) {
      prefabNode._children.forEach((childRef, idx) => {
        const childIsLast = idx === prefabNode._children.length - 1;
        result += buildTreeNode(data, scriptMap, childRef.__id__, '', childIsLast, false, projectRoot, format, depth, 1, expandPath);
      });
    }
    return result;
  }
  const sceneRoot = root;
  if (sceneRoot.__type__ === 'cc.Scene') {
    let result = '[Scene]\n';
    if (sceneRoot._children && sceneRoot._children.length > 0 && depth > 0) {
      sceneRoot._children.forEach((childRef, idx) => {
        const childIsLast = idx === sceneRoot._children.length - 1;
        result += buildTreeNode(data, scriptMap, childRef.__id__, '', childIsLast, false, projectRoot, format, depth, 1, expandPath);
      });
    }
    return result;
  }
  return buildTreeNode(data, scriptMap, startIndex, '', true, true, projectRoot, format, depth, 0, expandPath);
}
/**
 * 当 scriptMap 中查不到 UUID 时，精准定位 library/imports 中的一个文件
 * 同时提取类名和脚本路径，都缓存到 scriptMap 中
 * @param {string} compressedUuid
 * @param {string} projRoot
 * @param {Object} scriptMap - 会在此对象中写入缓存
 * @returns {string} 类名，或空字符串
 */
function lazyResolveUuid(compressedUuid, projRoot, scriptMap) {
  try {
    const hex = decompressUUID(compressedUuid);
    if (!hex) return '';
    const first2 = hex.substring(0, 2);
    const libPath = path.join(projRoot, 'library', 'imports', first2, hex + '.js');
    if (!fs.existsSync(libPath)) return '';
    const content = fs.readFileSync(libPath, 'utf8');

    // 提取类名
    const nameMatch = content.match(/cc\._RF\.push\([^,]+,\s*'[^']+',\s*'([^']+)'\)/);
    if (!nameMatch) return '';
    const name = nameMatch[1];

    // 提取脚本路径: // script/Xxx.ts
    const pathMatch = content.match(/\/\/\s*(.+\.\w+)$/m);
    const scriptPath = pathMatch ? pathMatch[1].trim() : '';

    // 写入缓存（类名 + 路径前缀）
    scriptMap[compressedUuid] = name;
    if (scriptPath) {
      scriptMap['@p/' + compressedUuid] = scriptPath;
    }
    return name;
  } catch {
    return '';
  }
}

/**
 * 格式化组件显示名
 * @param {string} name - 类名
 * @param {string} uuid - Cocos UUID
 * @param {Object} scriptMap
 * @param {string} format - 'name' | 'path' | 'full'
 * @returns {string}
 */
function formatComponentName(name, uuid, scriptMap, format) {
  // 优先取脚本文件名
  let scriptPath = scriptMap['@p/' + uuid];

  if (format === 'name') {
    // 默认：显示文件名 PetManager.ts，没有文件名就显示类名
    if (scriptPath) {
      return scriptPath.split('/').pop();
    }
    return name;
  }

  if (!scriptPath) return name;

  if (format === 'path') {
    return name + ' @ ' + scriptPath;
  }
  if (format === 'full') {
    return name + ' @ db://assets/' + scriptPath;
  }
  return name;
}

function buildComponentInfo(data, node, scriptMap, projectRoot, format) {
    if (!node._components || node._components.length === 0)
        return '';
    const hexUuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    // Cocos 压缩 UUID：22-23 位 base64 字符
    const cocosUuidRegex = /^[A-Za-z0-9+\/=]{22,23}$/;
    const comps = node._components.map((c) => {
        const comp = data[c.__id__];
        if (!comp)
            return '?';
        const typeName = comp.__type__;
        let displayName;
        if (hexUuidRegex.test(typeName)) {
            const scriptInfo = scriptMap[typeName];
            displayName = scriptInfo || '[MissingScript]';
        }
        else if (cocosUuidRegex.test(typeName)) {
            let scriptInfo = scriptMap[typeName];
            // 缓存没命中 → 精准定位 library/imports 中的一个文件
            if (!scriptInfo && projectRoot) {
              scriptInfo = lazyResolveUuid(typeName, projectRoot, scriptMap);
            }
            displayName = formatComponentName(scriptInfo || typeName, typeName, scriptMap, format);
        }
        else if (typeName === 'MissingScript') {
            displayName = '[MissingScript]';
        }
        else {
            displayName = typeName;
        }
        return displayName;
    }).join(', ');
    return ` (${comps})`;
}
function buildTreeNode(data, scriptMap, nodeIndex, prefix = '', isLast = true, isRoot = true, projectRoot, format, depth = Infinity, currentDepth = 0, expandPath = '') {
    const node = data[nodeIndex];
    if (!node)
        return '';
    const nodeName = node._name || '(unnamed)';
    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    let result = '';
    const connector = isLast ? '└── ' : '├── ';
    result = prefix + connector + nodeName;
    result += buildComponentInfo(data, node, scriptMap, projectRoot, format);
    result += '\n';

    // 检查是否需要展开子节点
    const hasChildren = node._children && node._children.length > 0;
    if (!hasChildren) return result;

    // 判断展开条件
    let shouldExpand = true;

    // 深度限制
    if (currentDepth >= depth) {
      shouldExpand = false;
    }

    // 展开特定节点路径模式
    if (expandPath && shouldExpand) {
      // expandPath 是目标节点名，只有路径上的节点才展开
      // 根节点始终展开
      if (!isRoot) {
        const pathParts = expandPath.split('/');
        const matchIdx = currentDepth - 1; // 当前节点在路径中的位置
        if (matchIdx < pathParts.length) {
          // 当前节点名必须匹配路径中对应位置
          const expected = pathParts[matchIdx];
          if (nodeName !== expected) {
            shouldExpand = false;
          }
        } else {
          // 已经超过了展开路径的深度 → 展开（目标节点的子节点）
          // 但用 depth 限制
          if (currentDepth >= depth) {
            shouldExpand = false;
          }
        }
      }
    }

    if (shouldExpand) {
      const childPrefix = prefix + (isRoot ? '' : (isLast ? '    ' : '│   '));
      node._children.forEach((childRef, idx) => {
        const childIsLast = idx === node._children.length - 1;
        result += buildTreeNode(data, scriptMap, childRef.__id__, childPrefix, childIsLast, false, projectRoot, format, depth, currentDepth + 1, expandPath);
      });
    } else {
      // 折叠：显示子节点数量
      const count = node._children.length;
      const childPrefix = prefix + (isRoot ? '' : (isLast ? '    ' : '│   '));
      result += childPrefix + (isLast ? '└── ' : '├── ') + `⤵ ${count} more...\n`;
    }

    return result;
}
export function detectItemType(item) {
    if (!item)
        return 'unknown';
    if (item.__type__ === 'cc.Node')
        return 'node';
    if (item.__type__ === 'cc.Scene')
        return 'scene';
    if (item.__type__?.includes('cc.'))
        return 'component';
    return 'unknown';
}
