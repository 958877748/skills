const CCComponent = require('./CCComponent');

/**
 * Cocos Creator Widget 组件
 */
class CCWidget extends CCComponent {
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

    /**
     * 设置对齐标志
     * 45 = 左 + 右 + 上 + 下 (全对齐)
     */
    setAlignFlags(flags) {
        this._alignFlags = flags;
        return this;
    }

    /**
     * 设置边距
     */
    setMargins(left, right, top, bottom) {
        this._left = left;
        this._right = right;
        this._top = top;
        this._bottom = bottom;
        return this;
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

module.exports = CCWidget;
