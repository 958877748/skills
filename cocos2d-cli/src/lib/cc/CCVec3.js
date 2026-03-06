/**
 * Cocos Creator 三维向量类
 */
class CCVec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.__type__ = 'cc.Vec3';
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set(x, y, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    toJSON() {
        return {
            __type__: this.__type__,
            x: this.x,
            y: this.y,
            z: this.z
        };
    }
}

module.exports = CCVec3;
