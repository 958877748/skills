/**
 * Cocos Creator 矩形类
 */
export default class CCRect {
    __type__: string;
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        this.__type__ = 'cc.Rect';
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    set(x: number, y: number, width: number, height: number): this {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        return this;
    }

    toJSON(): { __type__: string; x: number; y: number; width: number; height: number } {
        return {
            __type__: this.__type__,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}
