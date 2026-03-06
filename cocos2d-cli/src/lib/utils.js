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
 * 将标准 UUID 压缩为 Cocos Creator 格式（22位 base64）
 * @param {string} uuid - 标准 UUID（如 "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"）
 * @returns {string} - 压缩后的 UUID（如 "a5esZu+45LA5mBpvttspPD"）
 */
function compressUUID(uuid) {
    if (!uuid) return '';
    // 去掉横线
    const hex = uuid.replace(/-/g, '');
    if (hex.length !== 32) return uuid; // 不是标准格式，直接返回
    
    // 转 base64
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < hex.length; i += 3) {
        const byte1 = parseInt(hex.substr(i, 2), 16);
        let byte2 = 0, byte3 = 0;
        let group = 1;
        
        if (i + 2 < hex.length) {
            byte2 = parseInt(hex.substr(i + 2, 2), 16);
            group = 2;
        }
        if (i + 4 < hex.length) {
            byte3 = parseInt(hex.substr(i + 4, 2), 16);
            group = 3;
        }
        
        // 由于我们是每3个字符(1.5字节)处理，需要重新计算
    }
    
    // 更简单的方式：将32个十六进制字符转为16字节，再base64编码
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    
    // Base64 编码
    for (let i = 0; i < bytes.length; i += 3) {
        const b1 = bytes[i];
        const b2 = bytes[i + 1] || 0;
        const b3 = bytes[i + 2] || 0;
        
        result += chars[(b1 >> 2) & 0x3f];
        result += chars[((b1 & 0x03) << 4) | ((b2 >> 4) & 0x0f)];
        result += chars[((b2 & 0x0f) << 2) | ((b3 >> 6) & 0x03)];
        result += chars[b3 & 0x3f];
    }
    
    // 返回前22个字符（去掉末尾填充）
    return result.substring(0, 22);
}

/**
 * 生成压缩格式的 UUID（Cocos Creator 节点使用）
 * @returns {string} - 压缩后的 UUID（22位）
 */
function generateCompressedUUID() {
    return compressUUID(generateUUID());
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
    compressUUID,
    generateCompressedUUID,
    generateId,
    parseOptions,
    outputJson,
    outputError,
    outputSuccess
};
