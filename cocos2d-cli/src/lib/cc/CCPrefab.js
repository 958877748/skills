const CCObject = require('./CCObject');
const { generateFileId } = require('../fire-utils');

/**
 * Cocos Creator 预制体类
 */
class CCPrefab extends CCObject {
    constructor() {
        super('');
        this.__type__ = 'cc.Prefab';
        
        this._native = '';
        this.data = null; // { __id__: 1 }
        this.optimizationPolicy = 0;
        this.asyncLoadAssets = false;
        this.readonly = false;
    }

    /**
     * 设置根节点引用
     */
    setRoot(nodeIndex) {
        this.data = { __id__: nodeIndex };
        return this;
    }
}

/**
 * Cocos Creator 预制体信息类
 */
class CCPrefabInfo extends CCObject {
    constructor(rootIndex, assetIndex) {
        super('');
        this.__type__ = 'cc.PrefabInfo';
        
        this.root = { __id__: rootIndex };
        this.asset = { __id__: assetIndex };
        this.fileId = generateFileId();
        this.sync = false;
    }
}

module.exports = { CCPrefab, CCPrefabInfo };
