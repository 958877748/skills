import { ColorObject, OptionsObject } from './types';
export declare function parseColor(colorStr: string): ColorObject | null;
export declare function parseColorToCcColor(colorStr: string): ColorObject | null;
export declare function colorToHex(color: {
    r?: number;
    g?: number;
    b?: number;
} | null): string;
export declare function generateUUID(): string;
export declare function generateId(): string;
export declare function parseOptions(args: string[], startIndex?: number): OptionsObject;
export declare function outputJson(data: unknown): void;
export declare function outputError(message: string, extra?: Record<string, unknown>): void;
export declare function outputSuccess(data: Record<string, unknown>): void;
//# sourceMappingURL=utils.d.ts.map