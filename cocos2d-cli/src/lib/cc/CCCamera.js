const CCComponent = require('./CCComponent');
const CCColor = require('./CCColor');
const CCRect = require('./CCRect');

/**
 * Cocos Creator Camera 组件
 */
class CCCamera extends CCComponent {
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

    /**
     * 设置正交大小
     */
    setOrthoSize(size) {
        this._orthoSize = size;
        return this;
    }

    /**
     * 设置深度
     */
    setDepth(depth) {
        this._depth = depth;
        return this;
    }

    /**
     * 设置背景颜色
     */
    setBackgroundColor(r, g, b, a = 255) {
        this._backgroundColor.set(r, g, b, a);
        return this;
    }

    /**
     * 转换为属性面板显示格式
     */
    toPanelJSON() {
        return {
            ...super.toPanelJSON(),
            depth: this._depth,
            zoomRatio: this._zoomRatio,
            ortho: this._ortho,
            orthoSize: this._orthoSize,
            backgroundColor: this._backgroundColor ? `#${this._backgroundColor.r.toString(16).padStart(2,'0')}${this._backgroundColor.g.toString(16).padStart(2,'0')}${this._backgroundColor.b.toString(16).padStart(2,'0')}` : '#000000'
        };
    }

    toJSON() {
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

module.exports = CCCamera;
