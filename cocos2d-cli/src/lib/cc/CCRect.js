/**
 * Cocos Creator 矩形类
 */
class CCRect {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.__type__ = 'cc.Rect';
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    set(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        return this;
    }

    toJSON() {
        return {
            __type__: this.__type__,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

module.exports = CCRect;
