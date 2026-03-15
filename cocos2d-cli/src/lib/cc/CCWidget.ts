import CCComponent from './CCComponent.js';

/**
 * Cocos Creator Widget 组件
 */
export default class CCWidget extends CCComponent {
    alignMode: number;
    _target: any;
    _alignFlags: number;
    _left: number;
    _right: number;
    _top: number;
    _bottom: number;
    _verticalCenter: number;
    _horizontalCenter: number;
    _isAbsLeft: boolean;
    _isAbsRight: boolean;
    _isAbsTop: boolean;
    _isAbsBottom: boolean;
    _isAbsHorizontalCenter: boolean;
    _isAbsVerticalCenter: boolean;
    _originalWidth: number;
    _originalHeight: number;

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

    setAlignFlags(flags: number): this {
        this._alignFlags = flags;
        return this;
    }

    setMargins(left: number, right: number, top: number, bottom: number): this {
        this._left = left;
        this._right = right;
        this._top = top;
        this._bottom = bottom;
        return this;
    }

    toPanelJSON(): Record<string, any> {
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

    toJSON(): Record<string, any> {
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
