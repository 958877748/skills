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

    setProp(props) {
        super.setProp(props);
        if (props.designResolution) {
            this._designResolution = new CCSize(props.designResolution.width, props.designResolution.height);
        }
        if (props.fitWidth !== undefined) this._fitWidth = props.fitWidth;
        if (props.fitHeight !== undefined) this._fitHeight = props.fitHeight;
        return this;
    }

    getProp() {
        return {
            ...super.getProp(),
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
