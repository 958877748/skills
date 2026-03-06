const CCObject = require('./CCObject');
const { generateId } = require('../utils');

/**
 * Cocos Creator 组件基类
 */
class CCComponent extends CCObject {
    constructor() {
        super('');
        this.__type__ = 'cc.Component';
        
        // 关联的节点
        this.node = null;
        
        // 启用状态
        this._enabled = true;
        
        // 唯一标识（22位压缩格式）
        this._id = generateId();
    }

    /**
     * 设置节点引用
     */
    setNode(nodeIndex) {
        this.node = { __id__: nodeIndex };
        return this;
    }

    /**
     * 设置启用状态
     */
    setEnabled(enabled) {
        this._enabled = enabled;
        return this;
    }

    /**
     * 转换为属性面板显示格式（子类重写）
     */
    toPanelJSON() {
        return {
            type: this.__type__,
            enabled: this._enabled
        };
    }

    toJSON() {
        return {
            __type__: this.__type__,
            _name: this._name,
            _objFlags: this._objFlags,
            node: this.node,
            _enabled: this._enabled,
            _id: this._id
        };
    }
}

module.exports = CCComponent;
