const CCComponent = require('./CCComponent');

/**
 * Cocos Creator Label 组件
 */
class CCLabel extends CCComponent {
    constructor() {
        super();
        this.__type__ = 'cc.Label';
        
        this._materials = [{ __uuid__: 'eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432' }];
        this._srcBlendFactor = 770;
        this._dstBlendFactor = 771;
        this._string = '';
        this._N$string = '';
        this._fontSize = 40;
        this._lineHeight = 40;
        this._enableWrapText = true;
        this._N$file = null;
        this._isSystemFontUsed = true;
        this._spacingX = 0;
        this._batchAsBitmap = false;
        this._styleFlags = 0;
        this._underlineHeight = 0;
        this._N$horizontalAlign = 1;
        this._N$verticalAlign = 1;
        this._N$fontFamily = 'Arial';
        this._N$overflow = 0;
        this._N$cacheMode = 0;
    }

    /**
     * 设置文本内容
     */
    setString(str) {
        this._string = str;
        this._N$string = str;
        return this;
    }

    /**
     * 设置字体大小
     */
    setFontSize(size) {
        this._fontSize = size;
        this._lineHeight = size;
        return this;
    }

    /**
     * 设置字体
     */
    setFontFamily(family) {
        this._N$fontFamily = family;
        return this;
    }

    /**
     * 转换为属性面板显示格式
     */
    toPanelJSON() {
        const H_ALIGN = ['LEFT', 'CENTER', 'RIGHT'];
        const V_ALIGN = ['TOP', 'CENTER', 'BOTTOM'];
        const OVERFLOW = ['NONE', 'CLAMP', 'SHRINK', 'RESIZE_HEIGHT'];
        return {
            ...super.toPanelJSON(),
            string: this._string,
            fontSize: this._fontSize,
            lineHeight: this._lineHeight,
            fontFamily: this._N$fontFamily,
            horizontalAlign: H_ALIGN[this._N$horizontalAlign] || this._N$horizontalAlign,
            verticalAlign: V_ALIGN[this._N$verticalAlign] || this._N$verticalAlign,
            overflow: OVERFLOW[this._N$overflow] || this._N$overflow,
            wrap: this._enableWrapText
        };
    }

    toJSON() {
        return {
            __type__: this.__type__,
            _name: this._name,
            _objFlags: this._objFlags,
            node: this.node,
            _enabled: this._enabled,
            _materials: this._materials,
            _srcBlendFactor: this._srcBlendFactor,
            _dstBlendFactor: this._dstBlendFactor,
            _string: this._string,
            _N$string: this._N$string,
            _fontSize: this._fontSize,
            _lineHeight: this._lineHeight,
            _enableWrapText: this._enableWrapText,
            _N$file: this._N$file,
            _isSystemFontUsed: this._isSystemFontUsed,
            _spacingX: this._spacingX,
            _batchAsBitmap: this._batchAsBitmap,
            _styleFlags: this._styleFlags,
            _underlineHeight: this._underlineHeight,
            _N$horizontalAlign: this._N$horizontalAlign,
            _N$verticalAlign: this._N$verticalAlign,
            _N$fontFamily: this._N$fontFamily,
            _N$overflow: this._N$overflow,
            _N$cacheMode: this._N$cacheMode,
            _id: this._id
        };
    }
}

module.exports = CCLabel;
