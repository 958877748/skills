const CCObject = require('./CCObject');

/**
 * Cocos Creator 场景资源类
 */
class CCSceneAsset extends CCObject {
    constructor(name = 'NewScene') {
        super(name);
        this.__type__ = 'cc.SceneAsset';
        
        this._native = '';
        this.scene = null; // { __id__: 1 }
    }

    /**
     * 设置场景引用
     */
    setScene(sceneIndex) {
        this.scene = { __id__: sceneIndex };
        return this;
    }
}

module.exports = CCSceneAsset;
