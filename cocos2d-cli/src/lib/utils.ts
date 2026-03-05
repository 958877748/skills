import { ColorObject, OptionsObject, OutputData } from './types';

export function parseColor(colorStr: string): ColorObject | null {
    if (!colorStr || typeof colorStr !== 'string') return null;
    
    let hex = colorStr.replace('#', '');
    if (hex.length === 6) {
        return {
            __type__: 'cc.Color',
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16),
            a: 255
        };
    } else if (hex.length === 8) {
        return {
            __type__: 'cc.Color',
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16),
            a: parseInt(hex.substring(6, 8), 16)
        };
    }
    return null;
}

export function parseColorToCcColor(colorStr: string): ColorObject | null {
    const color = parseColor(colorStr);
    if (!color) return null;
    return { __type__: 'cc.Color', ...color };
}

export function colorToHex(color: { r?: number; g?: number; b?: number } | null): string {
    if (!color) return '#ffffff';
    const r = (color.r || 0).toString(16).padStart(2, '0');
    const g = (color.g || 0).toString(16).padStart(2, '0');
    const b = (color.b || 0).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function generateId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function parseOptions(args: string[], startIndex: number = 0): OptionsObject {
    const options: OptionsObject = {};
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

export function outputJson(data: unknown): void {
    console.log(JSON.stringify(data));
}

export function outputError(message: string, extra: Record<string, unknown> = {}): void {
    console.log(JSON.stringify({ error: message, ...extra }));
}

export function outputSuccess(data: Record<string, unknown>): void {
    console.log(JSON.stringify({ success: true, ...data }));
}
