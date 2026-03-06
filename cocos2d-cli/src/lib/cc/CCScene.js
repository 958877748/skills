const CCNode = require('./CCNode');

/**
 * Cocos Creator 场景类
 * 继承自 CCNode，添加场景特有属性
 */
class CCScene extends CCNode {
    constructor(name = 'NewScene') {
        super(name);
        this.__type__ = 'cc.Scene';
        
        // 场景特有属性
        this._is3DNode = true;
        this._anchorPoint = { __type__: 'cc.Vec2', x: 0, y: 0 };
        this.autoReleaseAssets = false;
        
        // 移除节点不需要的属性
        delete this._prefab;
    }
}

module.exports = CCScene;
