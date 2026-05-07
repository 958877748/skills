/**
 * Cocos Creator CCSprite 组件模拟
 * @module lib/cc/CCSprite
 */

import CCComponent from './CCComponent.js';
import CCVec2 from './CCVec2.js';
const default_sprite_splash = 'a23235d1-15db-4b95-8439-a2e005bfff91';
export default class CCSprite extends CCComponent {
    _materials;
    _srcBlendFactor;
    _dstBlendFactor;
    _spriteFrame;
    _type;
    _sizeMode;
    _fillType;
    _fillCenter;
    _fillStart;
    _fillRange;
    _isTrimmedMode;
    _atlas;
    constructor() {
        super();
        this.__type__ = 'cc.Sprite';
        this._materials = [{ __uuid__: 'eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432' }];
        this._srcBlendFactor = 770;
        this._dstBlendFactor = 771;
        this._spriteFrame = null;
        this._type = 0;
        this._sizeMode = 0;
        this._fillType = 0;
        this._fillCenter = new CCVec2();
        this._fillStart = 0;
        this._fillRange = 0;
        this._isTrimmedMode = true;
        this._atlas = null;
        this.setSpriteFrame(default_sprite_splash);
    }
    setSpriteFrame(uuid) {
        this._spriteFrame = { __uuid__: uuid };
        return this;
    }
    setSizeMode(mode) {
        this._sizeMode = mode;
        return this;
    }
    getProp() {
        const SIZE_MODE = ['CUSTOM', 'RAW', 'TRIMMED'];
        const SPRITE_TYPE = ['SIMPLE', 'SLICED', 'TILED', 'FILLED', 'MESH'];
        return {
            sizeMode: SIZE_MODE[this._sizeMode] || this._sizeMode,
            type: SPRITE_TYPE[this._type] || this._type,
            trim: this._isTrimmedMode
        };
    }
    setProp(props) {
        if (props.sizeMode !== undefined)
            this.setSizeMode(props.sizeMode);
        if (props.spriteFrame !== undefined)
            this.setSpriteFrame(props.spriteFrame);
        if (props.type !== undefined)
            this._type = props.type;
        return this;
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
            _spriteFrame: this._spriteFrame,
            _type: this._type,
            _sizeMode: this._sizeMode,
            _fillType: this._fillType,
            _fillCenter: this._fillCenter.toJSON(),
            _fillStart: this._fillStart,
            _fillRange: this._fillRange,
            _isTrimmedMode: this._isTrimmedMode,
            _atlas: this._atlas,
            _id: this._id
        };
    }
}
