/**
 * 通用工具函数
 * @module lib/utils
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/** Cocos Creator UUID 编码用 base64 字符串 */
const BASE64_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

/** ASCII → base64 值查找表 */
const ASCII_TO_64 = new Array(128).fill(64);
for (let i = 0; i < 64; i++) {
  ASCII_TO_64[BASE64_KEYS.charCodeAt(i)] = i;
}
export function parseColor(color) {
    if (!color)
        return null;
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 6 || hex.length === 8) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255
            };
        }
    }
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1]),
            g: parseInt(rgbMatch[2]),
            b: parseInt(rgbMatch[3]),
            a: rgbMatch[4] ? Math.round(parseFloat(rgbMatch[4]) * 255) : 255
        };
    }
    return null;
}
export function parseColorToCcColor(color) {
    const parsed = parseColor(color);
    if (!parsed)
        return null;
    return { __type__: 'cc.Color', ...parsed };
}
export function colorToHex(r, g, b, a = 255) {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${a !== 255 ? a.toString(16).padStart(2, '0') : ''}`;
}
export function generateUUID() {
    return crypto.randomUUID().replace(/-/g, '');
}
export function compressUUID(uuid, asShort = true) {
  /**
   * Cocos Creator UUID 压缩算法
   * asShort=true  → 22 位（短格式，工具内部用）
   * asShort=false → 23 位（长格式，prefab __type__ 用）
   *
   * 算法: 去连字符后，前 N 个 hex 字符直接保留，
   *       之后每 3 个 hex → 2 个 base64
   *       N=2 时 22 位，N=5 时 23 位
   */
  const hex = uuid.replace(/-/g, '');
  if (hex.length !== 32) return uuid;

  const prefixLen = asShort ? 2 : 5;
  const prefix = hex.slice(0, prefixLen);
  const result = [];

  for (let s = prefixLen; s < 32; s += 3) {
    const u = parseInt(hex[s], 16);
    const d = parseInt(hex[s + 1], 16);
    const n = parseInt(hex[s + 2], 16);
    result.push(BASE64_KEYS[(u << 2) | (d >> 2)]);
    result.push(BASE64_KEYS[((3 & d) << 4) | n]);
  }

  return prefix + result.join('');
}

/**
 * Cocos Creator UUID 解压缩
 * 支持 22 位短格式和 23 位长格式
 * @param {string} compressed - 22 或 23 位 Cocos UUID
 * @returns {string|null} 完整 hex UUID，格式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export function decompressUUID(compressed) {
  if (!compressed || (compressed.length !== 22 && compressed.length !== 23)) {
    return null;
  }

  const prefixLen = compressed.length === 23 ? 5 : 2;
  let result = compressed.slice(0, prefixLen);

  for (let s = prefixLen; s < compressed.length; s += 2) {
    const r = ASCII_TO_64[compressed.charCodeAt(s)] ?? 64;
    const t = ASCII_TO_64[compressed.charCodeAt(s + 1)] ?? 64;
    if (r > 63 || t > 63) return null;
    result += (r >> 2).toString(16);
    result += (((3 & r) << 2) | (t >> 4)).toString(16);
    result += (15 & t).toString(16);
  }

  return result.slice(0, 8) + '-' + result.slice(8, 12) + '-' +
         result.slice(12, 16) + '-' + result.slice(16, 20) + '-' +
         result.slice(20);
}

/**
 * 生成 Cocos Creator 兼容的 22 位随机 UUID
 * 等价于 Editor.UuidUtils.uuid()
 */
export function generateCompressedUUID() {
  const uuid = crypto.randomUUID();
  return compressUUID(uuid, true);
}
export function generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
/**
 * 从文件路径向上查找 Cocos Creator 项目根目录
 * 检测规则：目录包含 assets 且（包含 settings/project.json 或文件本身在 assets/ 内）
 * @param {string} filePath - .fire 或 .prefab 文件路径
 * @returns {string|null} 项目根目录绝对路径，未找到返回 null
 */
export function findProjectRoot(filePath) {
  let dir = path.dirname(path.resolve(filePath));

  while (true) {
    const hasAssets = fs.existsSync(path.join(dir, 'assets'));
    const hasSettings = fs.existsSync(path.join(dir, 'settings', 'project.json'));
    if (hasAssets && hasSettings) {
      return dir;
    }
    // 文件在 assets/ 里，那 assets 的父目录就是项目根
    if (hasAssets && path.resolve(filePath).startsWith(path.resolve(dir) + path.sep)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function parseOptions(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const nextArg = args[i + 1];
            if (nextArg && !nextArg.startsWith('--')) {
                options[key] = nextArg;
                i++;
            }
            else {
                options[key] = true;
            }
        }
    }
    return options;
}
export function outputJson(data) {
    console.log(JSON.stringify(data, null, 2));
}
export function outputError(message) {
    console.log(JSON.stringify({ error: message }));
}
export function outputSuccess(message) {
    console.log(JSON.stringify({ success: message }));
}
