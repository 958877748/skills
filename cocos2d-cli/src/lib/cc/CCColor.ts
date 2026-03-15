/**
 * Cocos Creator 颜色类
 */
export default class CCColor {
    __type__: string;
    r: number;
    g: number;
    b: number;
    a: number;

    constructor(r: number = 255, g: number = 255, b: number = 255, a: number = 255) {
        this.__type__ = 'cc.Color';
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    set(r: number, g: number, b: number, a: number = 255): this {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return this;
    }

    toJSON(): { __type__: string; r: number; g: number; b: number; a: number } {
        return {
            __type__: this.__type__,
            r: this.r,
            g: this.g,
            b: this.b,
            a: this.a
        };
    }
}
