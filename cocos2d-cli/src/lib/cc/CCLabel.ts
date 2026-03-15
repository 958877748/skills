import CCComponent from './CCComponent.js';

/**
 * Cocos Creator Label 组件
 */
export default class CCLabel extends CCComponent {
    _materials: { __uuid__: string }[];
    _srcBlendFactor: number;
    _dstBlendFactor: number;
    _string: string;
    _N$string: string;
    _fontSize: number;
    _lineHeight: number;
    _enableWrapText: boolean;
    _N$file: any;
    _isSystemFontUsed: boolean;
    _spacingX: number;
    _batchAsBitmap: boolean;
    _styleFlags: number;
    _underlineHeight: number;
    _N$horizontalAlign: number;
    _N$verticalAlign: number;
    _N$fontFamily: string;
    _N$overflow: number;
    _N$cacheMode: number;

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

    setString(str: string): this {
        this._string = str;
        this._N$string = str;
        return this;
    }

    setFontSize(size: number): this {
        this._fontSize = size;
        this._lineHeight = size;
        return this;
    }

    setFontFamily(family: string): this {
        this._N$fontFamily = family;
        return this;
    }

    getProp(): Record<string, any> {
        const H_ALIGN = ['LEFT', 'CENTER', 'RIGHT'];
        const V_ALIGN = ['TOP', 'CENTER', 'BOTTOM'];
        const OVERFLOW = ['NONE', 'CLAMP', 'SHRINK', 'RESIZE_HEIGHT'];
        return {
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

    static parseHAlign(value: string | number): number {
        if (typeof value === 'number') return value;
        switch (String(value).toLowerCase()) {
            case 'left':   return 0;
            case 'center': return 1;
            case 'right':  return 2;
            default:       return 1;
        }
    }

    static parseVAlign(value: string | number): number {
        if (typeof value === 'number') return value;
        switch (String(value).toLowerCase()) {
            case 'top':    return 0;
            case 'center': return 1;
            case 'bottom': return 2;
            default:       return 1;
        }
    }

    setProp(props: Record<string, any>): this {
        super.setProp(props);
        if (props.string !== undefined) this.setString(props.string);
        if (props.fontSize !== undefined) this.setFontSize(props.fontSize);
        if (props.lineHeight !== undefined) this._lineHeight = props.lineHeight;
        if (props.fontFamily !== undefined) this.setFontFamily(props.fontFamily);
        if (props.horizontalAlign !== undefined) this._N$horizontalAlign = CCLabel.parseHAlign(props.horizontalAlign);
        if (props.verticalAlign !== undefined) this._N$verticalAlign = CCLabel.parseVAlign(props.verticalAlign);
        return this;
    }

    toJSON(): Record<string, any> {
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
            _lineHeight: this._fontSize,
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
