/**
 * Cocos Creator 二维向量类
 */
class CCVec2 {
    constructor(x = 0, y = 0) {
        this.__type__ = 'cc.Vec2';
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    toJSON() {
        return {
            __type__: this.__type__,
            x: this.x,
            y: this.y
        };
    }
}

module.exports = CCVec2;
