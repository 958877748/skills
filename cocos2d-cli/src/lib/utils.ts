import * as crypto from 'crypto';

/**
 * 解析颜色字符串
 */
export function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
    if (!color) return null;
    
    // #RRGGBB 或 #RRGGBBAA
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
    
    // rgb(r,g,b) 或 rgba(r,g,b,a)
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

/**
 * 解析颜色并转为 CCColor 格式
 */
export function parseColorToCcColor(color: string): { __type__: string; r: number; g: number; b: number; a: number } | null {
    const parsed = parseColor(color);
    if (!parsed) return null;
    return { __type__: 'cc.Color', ...parsed };
}

/**
 * 颜色转十六进制
 */
export function colorToHex(r: number, g: number, b: number, a: number = 255): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${a !== 255 ? a.toString(16).padStart(2, '0') : ''}`;
}

/**
 * 生成 UUID (32位小写)
 */
export function generateUUID(): string {
    return crypto.randomUUID().replace(/-/g, '');
}

/**
 * 压缩 UUID 为 22 位 Base64 格式
 */
export function compressUUID(uuid: string): string {
    const hex = uuid.replace(/-/g, '');
    const bytes = Buffer.from(hex, 'hex');
    return bytes.toString('base64url').slice(0, 22);
}

/**
 * 生成压缩格式的 UUID
 */
export function generateCompressedUUID(): string {
    return compressUUID(generateUUID());
}

/**
 * 生成 Cocos Creator 组件 ID（22位 base64 格式）
 */
export function generateId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 解析命令行选项
 */
export function parseOptions(args: string[]): Record<string, string | boolean> {
    const options: Record<string, string | boolean> = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const nextArg = args[i + 1];
            if (nextArg && !nextArg.startsWith('--')) {
                options[key] = nextArg;
                i++;
            } else {
                options[key] = true;
            }
        }
    }
    return options;
}

/**
 * 输出 JSON 格式结果
 */
export function outputJson(data: any): void {
    console.log(JSON.stringify(data, null, 2));
}

/**
 * 输出错误信息
 */
export function outputError(message: string): void {
    console.log(JSON.stringify({ error: message }));
}

/**
 * 输出成功信息
 */
export function outputSuccess(message: string): void {
    console.log(JSON.stringify({ success: message }));
}
