/**
 * Cocos Creator 二维向量类
 */
export default class CCVec2 {
    __type__: string;
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.__type__ = 'cc.Vec2';
        this.x = x;
        this.y = y;
    }

    set(x: number, y: number): this {
        this.x = x;
        this.y = y;
        return this;
    }

    toJSON(): { __type__: string; x: number; y: number } {
        return {
            __type__: this.__type__,
            x: this.x,
            y: this.y
        };
    }
}
