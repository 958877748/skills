/**
 * Cocos Creator CCWidget 组件模拟
 * @module lib/cc/CCWidget
 */

import CCComponent from './CCComponent.js';
export default class CCWidget extends CCComponent {
    alignMode;
    _target;
    _alignFlags;
    _left;
    _right;
    _top;
    _bottom;
    _verticalCenter;
    _horizontalCenter;
    _isAbsLeft;
    _isAbsRight;
    _isAbsTop;
    _isAbsBottom;
    _isAbsHorizontalCenter;
    _isAbsVerticalCenter;
    _originalWidth;
    _originalHeight;
    constructor() {
        super();
        this.__type__ = 'cc.Widget';
        this.alignMode = 1;
        this._target = null;
        this._alignFlags = 45;
        this._left = 0;
        this._right = 0;
        this._top = 0;
        this._bottom = 0;
        this._verticalCenter = 0;
        this._horizontalCenter = 0;
        this._isAbsLeft = true;
        this._isAbsRight = true;
        this._isAbsTop = true;
        this._isAbsBottom = true;
        this._isAbsHorizontalCenter = true;
        this._isAbsVerticalCenter = true;
        this._originalWidth = 0;
        this._originalHeight = 0;
    }
    setAlignFlags(flags) {
        this._alignFlags = flags;
        return this;
    }
    setMargins(left, right, top, bottom) {
        this._left = left;
        this._right = right;
        this._top = top;
        this._bottom = bottom;
        return this;
    }
    toPanelJSON() {
        return {
            ...super.getProp(),
            top: this._top,
            bottom: this._bottom,
            left: this._left,
            right: this._right,
            horizontalCenter: this._horizontalCenter,
            verticalCenter: this._verticalCenter,
            isAbsLeft: this._isAbsLeft,
            isAbsRight: this._isAbsRight,
            isAbsTop: this._isAbsTop,
            isAbsBottom: this._isAbsBottom
        };
    }
    toJSON() {
        return {
            __type__: this.__type__,
            _name: this._name,
            _objFlags: this._objFlags,
            node: this.node,
            _enabled: this._enabled,
            alignMode: this.alignMode,
            _target: this._target,
            _alignFlags: this._alignFlags,
            _left: this._left,
            _right: this._right,
            _top: this._top,
            _bottom: this._bottom,
            _verticalCenter: this._verticalCenter,
            _horizontalCenter: this._horizontalCenter,
            _isAbsLeft: this._isAbsLeft,
            _isAbsRight: this._isAbsRight,
            _isAbsTop: this._isAbsTop,
            _isAbsBottom: this._isAbsBottom,
            _isAbsHorizontalCenter: this._isAbsHorizontalCenter,
            _isAbsVerticalCenter: this._isAbsVerticalCenter,
            _originalWidth: this._originalWidth,
            _originalHeight: this._originalHeight,
            _id: this._id
        };
    }
}
