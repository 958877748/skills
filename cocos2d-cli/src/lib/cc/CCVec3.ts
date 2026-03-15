/**
 * Cocos Creator 三维向量类
 */
export default class CCVec3 {
    __type__: string;
    x: number;
    y: number;
    z: number;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.__type__ = 'cc.Vec3';
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set(x: number, y: number, z: number = 0): this {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    toJSON(): { __type__: string; x: number; y: number; z: number } {
        return {
            __type__: this.__type__,
            x: this.x,
            y: this.y,
            z: this.z
        };
    }
}
