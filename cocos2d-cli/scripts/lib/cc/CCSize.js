/**
 * Cocos Creator CCSize 模拟
 * @module lib/cc/CCSize
 */

export default class CCSize {
    __type__;
    width;
    height;
    constructor(width = 0, height = 0) {
        this.__type__ = 'cc.Size';
        this.width = width;
        this.height = height;
    }
    set(width, height) {
        this.width = width;
        this.height = height;
        return this;
    }
    toJSON() {
        return {
            __type__: this.__type__,
            width: this.width,
            height: this.height
        };
    }
}
