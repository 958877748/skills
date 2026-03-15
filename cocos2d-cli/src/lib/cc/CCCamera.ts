import CCComponent from './CCComponent.js';
import CCColor from './CCColor.js';
import CCRect from './CCRect.js';

/**
 * Cocos Creator Camera 组件
 */
export default class CCCamera extends CCComponent {
    _cullingMask: number;
    _clearFlags: number;
    _backgroundColor: CCColor;
    _depth: number;
    _zoomRatio: number;
    _targetTexture: any;
    _fov: number;
    _orthoSize: number;
    _nearClip: number;
    _farClip: number;
    _ortho: boolean;
    _rect: CCRect;
    _renderStages: number;
    _alignWithScreen: boolean;

    constructor() {
        super();
        this.__type__ = 'cc.Camera';
        
        this._cullingMask = 4294967295;
        this._clearFlags = 7;
        this._backgroundColor = new CCColor(0, 0, 0, 255);
        this._depth = -1;
        this._zoomRatio = 1;
        this._targetTexture = null;
        this._fov = 60;
        this._orthoSize = 10;
        this._nearClip = 1;
        this._farClip = 4096;
        this._ortho = true;
        this._rect = new CCRect(0, 0, 1, 1);
        this._renderStages = 1;
        this._alignWithScreen = true;
    }

    setOrthoSize(size: number): this {
        this._orthoSize = size;
        return this;
    }

    setDepth(depth: number): this {
        this._depth = depth;
        return this;
    }

    setBackgroundColor(r: number, g: number, b: number, a: number = 255): this {
        this._backgroundColor.set(r, g, b, a);
        return this;
    }

    toPanelJSON(): Record<string, any> {
        return {
            ...super.getProp(),
            depth: this._depth,
            zoomRatio: this._zoomRatio,
            ortho: this._ortho,
            orthoSize: this._orthoSize,
            backgroundColor: this._backgroundColor ? `#${this._backgroundColor.r.toString(16).padStart(2,'0')}${this._backgroundColor.g.toString(16).padStart(2,'0')}${this._backgroundColor.b.toString(16).padStart(2,'0')}` : '#000000'
        };
    }

    toJSON(): Record<string, any> {
        return {
            __type__: this.__type__,
            _name: this._name,
            _objFlags: this._objFlags,
            node: this.node,
            _enabled: this._enabled,
            _cullingMask: this._cullingMask,
            _clearFlags: this._clearFlags,
            _backgroundColor: this._backgroundColor.toJSON(),
            _depth: this._depth,
            _zoomRatio: this._zoomRatio,
            _targetTexture: this._targetTexture,
            _fov: this._fov,
            _orthoSize: this._orthoSize,
            _nearClip: this._nearClip,
            _farClip: this._farClip,
            _ortho: this._ortho,
            _rect: this._rect.toJSON(),
            _renderStages: this._renderStages,
            _alignWithScreen: this._alignWithScreen,
            _id: this._id
        };
    }
}
