/**
 * 公共工具模块
 * 提供颜色解析、UUID 生成等通用功能
 */

/**
 * 解析颜色字符串 #RRGGBB 或 #RRGGBBAA
 * @param {string} colorStr - 颜色字符串
 * @returns {object|null} - 颜色对象 {r, g, b, a} 或 null
 */
function parseColor(colorStr) {
    if (!colorStr || typeof colorStr !== 'string') return null;
    
    let hex = colorStr.replace('#', '');
    if (hex.length === 6) {
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16),
            a: 255
        };
    } else if (hex.length === 8) {
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16),
            a: parseInt(hex.substring(6, 8), 16)
        };
    }
    return null;
}

/**
 * 解析颜色字符串并返回 cc.Color 格式
 * @param {string} colorStr - 颜色字符串
 * @returns {object|null} - cc.Color 对象或 null
 */
function parseColorToCcColor(colorStr) {
    const color = parseColor(colorStr);
    if (!color) return null;
    return { "__type__": "cc.Color", ...color };
}

/**
 * 将 cc.Color 对象转为 #RRGGBB 字符串
 * @param {object} color - cc.Color 对象
 * @returns {string} - #RRGGBB 格式字符串
 */
function colorToHex(color) {
    if (!color) return '#ffffff';
    const r = (color.r || 0).toString(16).padStart(2, '0');
    const g = (color.g || 0).toString(16).padStart(2, '0');
    const b = (color.b || 0).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

/**
 * 生成 UUID
 * @returns {string} - UUID 字符串
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 生成 Cocos Creator 组件 ID（22位 base64 格式）
 * @returns {string} - 组件 ID 字符串
 */
function generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 解析命令行选项
 * @param {string[]} args - 命令行参数数组
 * @param {number} startIndex - 开始解析的索引
 * @returns {object} - 选项对象
 */
function parseOptions(args, startIndex = 0) {
    const options = {};
    for (let i = startIndex; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const eqIndex = arg.indexOf('=');
            if (eqIndex > 2) {
                const key = arg.substring(2, eqIndex);
                const value = arg.substring(eqIndex + 1);
                options[key] = value;
            }
        }
    }
    return options;
}

/**
 * 输出 JSON 格式结果
 * @param {object} data - 要输出的数据
 */
function outputJson(data) {
    console.log(JSON.stringify(data));
}

/**
 * 输出错误信息
 * @param {string} message - 错误信息
 * @param {object} extra - 额外信息
 */
function outputError(message, extra = {}) {
    console.log(JSON.stringify({ error: message, ...extra }));
}

/**
 * 输出成功信息
 * @param {object} data - 成功数据
 */
function outputSuccess(data) {
    console.log(JSON.stringify({ success: true, ...data }));
}

module.exports = {
    parseColor,
    parseColorToCcColor,
    colorToHex,
    generateUUID,
    generateId,
    parseOptions,
    outputJson,
    outputError,
    outputSuccess
};
