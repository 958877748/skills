/**
 * Cocos Creator CCRichText 组件模拟
 * @module lib/cc/CCRichText
 */

import CCComponent from './CCComponent.js';
export default class CCRichText extends CCComponent {
    _string;
    _horizontalAlign;
    _fontSize;
    _maxWidth;
    _lineHeight;
    _imageAtlas;
    _handleTouchEvent;
    constructor() {
        super();
        this.__type__ = 'cc.RichText';
        this._string = '';
        this._horizontalAlign = 0;
        this._fontSize = 40;
        this._maxWidth = 0;
        this._lineHeight = 40;
        this._imageAtlas = null;
        this._handleTouchEvent = true;
    }
    toJSON() {
        return {
            __type__: this.__type__,
            _name: this._name,
            _objFlags: this._objFlags,
            node: this.node,
            _enabled: this._enabled,
            _string: this._string,
            _horizontalAlign: this._horizontalAlign,
            _fontSize: this._fontSize,
            _maxWidth: this._maxWidth,
            _lineHeight: this._lineHeight,
            _imageAtlas: this._imageAtlas,
            _handleTouchEvent: this._handleTouchEvent,
            _id: this._id
        };
    }
}
