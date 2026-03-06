const CCNode = require('./CCNode');

/**
 * Cocos Creator 场景类
 * 继承自 CCNode
 */
class CCScene extends CCNode {
    constructor(name = 'NewScene') {
        super(name);
        this.__type__ = 'cc.Scene';
        
        // 场景特有属性
        this._is3DNode = true;
        this._anchorPoint.set(0, 0);
        this.autoReleaseAssets = false;
    }

    toJSON() {
        // 显式控制属性顺序，Scene 特有顺序
        return {
            __type__: this.__type__,
            _objFlags: this._objFlags,
            _parent: this._parent,
            _children: this._children,
            _active: this._active,
            _components: this._components,
            _prefab: this._prefab,
            _opacity: this._opacity,
            _color: this._color.toJSON(),
            _contentSize: this._contentSize.toJSON(),
            _anchorPoint: this._anchorPoint.toJSON(),
            _trs: this._trs.toJSON(),
            _is3DNode: this._is3DNode,
            _groupIndex: this._groupIndex,
            groupIndex: this.groupIndex,
            autoReleaseAssets: this.autoReleaseAssets,
            _id: this._id
        };
    }
}

module.exports = CCScene;
