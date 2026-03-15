/**
 * Cocos Creator 变换数据类 (TRS = Translation, Rotation, Scale)
 * array: [posX, posY, posZ, rotX, rotY, rotZ, rotW, scaleX, scaleY, scaleZ]
 */
export default class CCTrs {
    __type__: string;
    ctor: string;
    array: number[];

    constructor() {
        this.__type__ = 'TypedArray';
        this.ctor = 'Float64Array';
        this.array = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1];
    }

    // Position
    get x(): number { return this.array[0]; }
    set x(v: number) { this.array[0] = v; }

    get y(): number { return this.array[1]; }
    set y(v: number) { this.array[1] = v; }

    get z(): number { return this.array[2]; }
    set z(v: number) { this.array[2] = v; }

    // Scale
    get scaleX(): number { return this.array[7]; }
    set scaleX(v: number) { this.array[7] = v; }

    get scaleY(): number { return this.array[8]; }
    set scaleY(v: number) { this.array[8] = v; }

    get scaleZ(): number { return this.array[9]; }
    set scaleZ(v: number) { this.array[9] = v; }

    // Rotation (四元数)
    get rotX(): number { return this.array[3]; }
    set rotX(v: number) { this.array[3] = v; }

    get rotY(): number { return this.array[4]; }
    set rotY(v: number) { this.array[4] = v; }

    get rotZ(): number { return this.array[5]; }
    set rotZ(v: number) { this.array[5] = v; }

    get rotW(): number { return this.array[6]; }
    set rotW(v: number) { this.array[6] = v; }

    /**
     * 设置位置
     */
    setPosition(x: number, y: number, z: number = 0): this {
        this.array[0] = x;
        this.array[1] = y;
        this.array[2] = z;
        return this;
    }

    /**
     * 设置缩放
     */
    setScale(x: number, y: number = x, z: number = 1): this {
        this.array[7] = x;
        this.array[8] = y;
        this.array[9] = z;
        return this;
    }

    toJSON(): { __type__: string; ctor: string; array: number[] } {
        return {
            __type__: this.__type__,
            ctor: this.ctor,
            array: [...this.array]
        };
    }
}
