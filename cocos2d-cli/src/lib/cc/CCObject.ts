/**
 * Cocos Creator 对象基类
 */
export default class CCObject {
    __type__: string;
    _name: string;
    _objFlags: number;

    constructor(name: string = '') {
        this.__type__ = '';
        this._name = name;
        this._objFlags = 0;
    }

    toJSON(): Record<string, any> {
        const obj: Record<string, any> = { ...this };
        // 移除 undefined 的属性
        for (const key in obj) {
            if (obj[key] === undefined) {
                delete obj[key];
            }
        }
        return obj;
    }
}
