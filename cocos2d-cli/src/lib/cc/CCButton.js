const CCComponent = require('./CCComponent');
const CCColor = require('./CCColor');

/**
 * Cocos Creator Button 组件
 */
class CCButton extends CCComponent {
    constructor() {
        super();
        this.__type__ = 'cc.Button';
        
        this._normalMaterial = null;
        this._grayMaterial = null;
        this.duration = 0.1;
        this.zoomScale = 1.2;
        this.clickEvents = [];
        this._N$interactable = true;
        this._N$enableAutoGrayEffect = false;
        this._N$transition = 3;
        this.transition = 3;
        this._N$normalColor = new CCColor();
        this._N$pressedColor = new CCColor(200, 200, 200, 255);
        this.pressedColor = new CCColor(200, 200, 200, 255);
        this._N$hoverColor = new CCColor();
        this.hoverColor = new CCColor();
        this._N$disabledColor = new CCColor(120, 120, 120, 200);
        this._N$normalSprite = null;
        this._N$pressedSprite = null;
        this.pressedSprite = null;
        this._N$hoverSprite = null;
        this.hoverSprite = null;
        this._N$disabledSprite = null;
        this._N$target = null;
    }

    /**
     * 设置缩放
     */
    setZoomScale(scale) {
        this.zoomScale = scale;
        return this;
    }

    /**
     * 设置过渡类型
     * 0: NONE, 1: COLOR, 2: SPRITE, 3: SCALE
     */
    setTransition(type) {
        this._N$transition = type;
        this.transition = type;
        return this;
    }

    /**
     * 设置正常精灵
     */
    setNormalSprite(uuid) {
        this._N$normalSprite = { __uuid__: uuid };
        return this;
    }

    /**
     * 设置点击事件
     */
    addClickEvent(component, handler, target = null) {
        this.clickEvents.push({
            target: target,
            component: component,
            handler: handler
        });
        return this;
    }

    toJSON() {
        return {
            __type__: this.__type__,
            _name: this._name,
            _objFlags: this._objFlags,
            node: this.node,
            _enabled: this._enabled,
            _normalMaterial: this._normalMaterial,
            _grayMaterial: this._grayMaterial,
            duration: this.duration,
            zoomScale: this.zoomScale,
            clickEvents: this.clickEvents,
            _N$interactable: this._N$interactable,
            _N$enableAutoGrayEffect: this._N$enableAutoGrayEffect,
            _N$transition: this._N$transition,
            transition: this.transition,
            _N$normalColor: this._N$normalColor.toJSON(),
            _N$pressedColor: this._N$pressedColor.toJSON(),
            pressedColor: this.pressedColor.toJSON(),
            _N$hoverColor: this._N$hoverColor.toJSON(),
            hoverColor: this.hoverColor.toJSON(),
            _N$disabledColor: this._N$disabledColor.toJSON(),
            _N$normalSprite: this._N$normalSprite,
            _N$pressedSprite: this._N$pressedSprite,
            pressedSprite: this.pressedSprite,
            _N$hoverSprite: this._N$hoverSprite,
            hoverSprite: this.hoverSprite,
            _N$disabledSprite: this._N$disabledSprite,
            _N$target: this._N$target,
            _id: this._id
        };
    }
}

module.exports = CCButton;
