/**
 * Cocos Creator CCColor 模拟
 * @module lib/cc/CCColor
 */

export default class CCColor {
    __type__;
    r;
    g;
    b;
    a;
    constructor(r = 255, g = 255, b = 255, a = 255) {
        this.__type__ = 'cc.Color';
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    set(r, g, b, a = 255) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return this;
    }
    toJSON() {
        return {
            __type__: this.__type__,
            r: this.r,
            g: this.g,
            b: this.b,
            a: this.a
        };
    }
}
