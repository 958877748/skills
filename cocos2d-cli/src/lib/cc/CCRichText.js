const CCComponent = require('./CCComponent');

/**
 * Cocos Creator RichText 组件
 * 支持 BBCode 标签语法：
 *   <color=#ff0000>红色</color>
 *   <size=30>大字</size>
 *   <b>加粗</b>  <i>斜体</i>  <u>下划线</u>
 *   <br/>  换行
 */
class CCRichText extends CCComponent {
    constructor() {
        super();
        this.__type__ = 'cc.RichText';

        this._string = '';
        this._horizontalAlign = 0; // 0=LEFT 1=CENTER 2=RIGHT
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

module.exports = CCRichText;
