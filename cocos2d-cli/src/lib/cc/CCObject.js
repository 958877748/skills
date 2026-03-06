/**
 * Cocos Creator 对象基类
 */
class CCObject {
    constructor(name = '') {
        this.__type__ = '';
        this._name = name;
        this._objFlags = 0;
    }

    toJSON() {
        const obj = { ...this };
        // 移除 undefined 的属性
        for (const key in obj) {
            if (obj[key] === undefined) {
                delete obj[key];
            }
        }
        return obj;
    }
}

module.exports = CCObject;
