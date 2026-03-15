/**
 * Cocos Creator 尺寸类
 */
export default class CCSize {
    __type__: string;
    width: number;
    height: number;

    constructor(width: number = 0, height: number = 0) {
        this.__type__ = 'cc.Size';
        this.width = width;
        this.height = height;
    }

    set(width: number, height: number): this {
        this.width = width;
        this.height = height;
        return this;
    }

    toJSON(): { __type__: string; width: number; height: number } {
        return {
            __type__: this.__type__,
            width: this.width,
            height: this.height
        };
    }
}
