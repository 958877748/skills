import CCComponent from './CCComponent.js';

/**
 * Cocos Creator RichText 组件
 * 支持 BBCode 标签语法：
 *   <color=#ff0000>红色</color>
 *   <size=30>大字</size>
 *   <b>加粗</b>  <i>斜体</i>  <u>下划线</u>
 *   <br/>  换行
 */
export default class CCRichText extends CCComponent {
    _string: string;
    _horizontalAlign: number;
    _fontSize: number;
    _maxWidth: number;
    _lineHeight: number;
    _imageAtlas: any;
    _handleTouchEvent: boolean;

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

    toJSON(): Record<string, any> {
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
