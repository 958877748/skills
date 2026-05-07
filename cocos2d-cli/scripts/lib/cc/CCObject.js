/**
 * Cocos Creator CCObject 基类模拟
 * @module lib/cc/CCObject
 */

export default class CCObject {
    __type__;
    _name;
    _objFlags;
    constructor(name = '') {
        this.__type__ = '';
        this._name = name;
        this._objFlags = 0;
    }
    toJSON() {
        const obj = { ...this };
        for (const key in obj) {
            if (obj[key] === undefined) {
                delete obj[key];
            }
        }
        return obj;
    }
}
