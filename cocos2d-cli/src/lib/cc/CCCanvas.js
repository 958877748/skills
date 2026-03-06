const CCComponent = require('./CCComponent');
const CCSize = require('./CCSize');

/**
 * Cocos Creator Canvas 组件
 */
class CCCanvas extends CCComponent {
    constructor() {
        super();
        this.__type__ = 'cc.Canvas';
        
        this._designResolution = new CCSize(960, 640);
        this._fitWidth = false;
        this._fitHeight = true;
    }

    /**
     * 设置设计分辨率
     */
    setDesignResolution(width, height) {
        this._designResolution.set(width, height);
        return this;
    }

    /**
     * 设置适配模式
     */
    setFit(fitWidth, fitHeight) {
        this._fitWidth = fitWidth;
        this._fitHeight = fitHeight;
        return this;
    }

    /**
     * 转换为属性面板显示格式
     */
    toPanelJSON() {
        return {
            ...super.toPanelJSON(),
            designResolution: {
                width: this._designResolution?.width ?? 960,
                height: this._designResolution?.height ?? 640
            },
            fitWidth: this._fitWidth,
            fitHeight: this._fitHeight
        };
    }

    toJSON() {
        return {
            __type__: this.__type__,
            _name: this._name,
            _objFlags: this._objFlags,
            node: this.node,
            _enabled: this._enabled,
            _designResolution: this._designResolution.toJSON(),
            _fitWidth: this._fitWidth,
            _fitHeight: this._fitHeight,
            _id: this._id
        };
    }
}

module.exports = CCCanvas;
