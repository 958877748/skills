/**
 * Cocos Creator 尺寸类
 */
class CCSize {
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

module.exports = CCSize;
