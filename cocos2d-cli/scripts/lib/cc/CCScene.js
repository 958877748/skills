/**
 * Cocos Creator CCScene 模拟
 * @module lib/cc/CCScene
 */

import CCNode from './CCNode.js';
export default class CCScene extends CCNode {
    autoReleaseAssets;
    constructor(name = 'NewScene') {
        super(name);
        this.__type__ = 'cc.Scene';
        this._is3DNode = true;
        this._anchorPoint.set(0, 0);
        this.autoReleaseAssets = false;
    }
    toJSON() {
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
