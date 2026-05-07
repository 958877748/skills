/**
 * Cocos Creator CCLayout 组件模拟
 * @module lib/cc/CCLayout
 */

import CCComponent from './CCComponent.js';
import CCSize from './CCSize.js';
export default class CCLayout extends CCComponent {
    _layoutSize;
    _resize;
    _N$layoutType;
    _N$cellSize;
    _N$startAxis;
    _N$paddingLeft;
    _N$paddingRight;
    _N$paddingTop;
    _N$paddingBottom;
    _N$spacingX;
    _N$spacingY;
    _N$verticalDirection;
    _N$horizontalDirection;
    _N$affectedByScale;
    constructor() {
        super();
        this.__type__ = 'cc.Layout';
        this._layoutSize = new CCSize(300, 200);
        this._resize = 0;
        this._N$layoutType = 0;
        this._N$cellSize = new CCSize(40, 40);
        this._N$startAxis = 0;
        this._N$paddingLeft = 0;
        this._N$paddingRight = 0;
        this._N$paddingTop = 0;
        this._N$paddingBottom = 0;
        this._N$spacingX = 0;
        this._N$spacingY = 0;
        this._N$verticalDirection = 1;
        this._N$horizontalDirection = 0;
        this._N$affectedByScale = false;
    }
    setLayoutType(type) {
        this._N$layoutType = type;
        return this;
    }
    setPadding(left, right, top, bottom) {
        this._N$paddingLeft = left;
        this._N$paddingRight = right;
        this._N$paddingTop = top;
        this._N$paddingBottom = bottom;
        return this;
    }
    setSpacing(x, y) {
        this._N$spacingX = x;
        this._N$spacingY = y;
        return this;
    }
    setResizeMode(mode) {
        this._resize = mode;
        return this;
    }
    toJSON() {
        return {
            __type__: this.__type__,
            _name: this._name,
            _objFlags: this._objFlags,
            node: this.node,
            _enabled: this._enabled,
            _layoutSize: this._layoutSize.toJSON(),
            _resize: this._resize,
            _N$layoutType: this._N$layoutType,
            _N$cellSize: this._N$cellSize.toJSON(),
            _N$startAxis: this._N$startAxis,
            _N$paddingLeft: this._N$paddingLeft,
            _N$paddingRight: this._N$paddingRight,
            _N$paddingTop: this._N$paddingTop,
            _N$paddingBottom: this._N$paddingBottom,
            _N$spacingX: this._N$spacingX,
            _N$spacingY: this._N$spacingY,
            _N$verticalDirection: this._N$verticalDirection,
            _N$horizontalDirection: this._N$horizontalDirection,
            _N$affectedByScale: this._N$affectedByScale,
            _id: this._id
        };
    }
}
