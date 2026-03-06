/**
 * Cocos Creator 变换数据类 (TRS = Translation, Rotation, Scale)
 * array: [posX, posY, posZ, rotX, rotY, rotZ, rotW, scaleX, scaleY, scaleZ]
 */
class CCTrs {
    constructor() {
        this.__type__ = 'TypedArray';
        this.ctor = 'Float64Array';
        this.array = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1];
    }

    // Position
    get x() { return this.array[0]; }
    set x(v) { this.array[0] = v; }

    get y() { return this.array[1]; }
    set y(v) { this.array[1] = v; }

    get z() { return this.array[2]; }
    set z(v) { this.array[2] = v; }

    // Scale
    get scaleX() { return this.array[7]; }
    set scaleX(v) { this.array[7] = v; }

    get scaleY() { return this.array[8]; }
    set scaleY(v) { this.array[8] = v; }

    get scaleZ() { return this.array[9]; }
    set scaleZ(v) { this.array[9] = v; }

    // Rotation (四元数)
    get rotX() { return this.array[3]; }
    set rotX(v) { this.array[3] = v; }

    get rotY() { return this.array[4]; }
    set rotY(v) { this.array[4] = v; }

    get rotZ() { return this.array[5]; }
    set rotZ(v) { this.array[5] = v; }

    get rotW() { return this.array[6]; }
    set rotW(v) { this.array[6] = v; }

    /**
     * 设置位置
     */
    setPosition(x, y, z = 0) {
        this.array[0] = x;
        this.array[1] = y;
        this.array[2] = z;
        return this;
    }

    /**
     * 设置缩放
     */
    setScale(x, y = x, z = 1) {
        this.array[7] = x;
        this.array[8] = y;
        this.array[9] = z;
        return this;
    }

    toJSON() {
        return {
            __type__: this.__type__,
            ctor: this.ctor,
            array: [...this.array]
        };
    }
}

module.exports = CCTrs;
