const CCObject = require('./CCObject');
const CCNode = require('./CCNode');
const CCScene = require('./CCScene');
const CCSceneAsset = require('./CCSceneAsset');
const { CCPrefab, CCPrefabInfo } = require('./CCPrefab');
const CCColor = require('./CCColor');
const CCSize = require('./CCSize');
const CCVec2 = require('./CCVec2');
const CCVec3 = require('./CCVec3');
const CCTrs = require('./CCTrs');
const CCRect = require('./CCRect');
const CCComponent = require('./CCComponent');
const CCCanvas = require('./CCCanvas');
const CCWidget = require('./CCWidget');
const CCCamera = require('./CCCamera');
const CCSprite = require('./CCSprite');
const CCLabel = require('./CCLabel');
const CCButton = require('./CCButton');
const SceneParser = require('./SceneParser');
const PrefabParser = require('./PrefabParser');
const { generateUUID } = require('../utils');

/**
 * 场景数据数组管理器
 */
class SceneData {
    constructor(name = 'NewScene') {
        this.data = [];
        
        // 创建基础场景结构
        const asset = new CCSceneAsset(); // SceneAsset 不需要名字
        const scene = new CCScene(name);
        
        asset.setScene(1);
        
        this.data.push(asset, scene);
    }

    /**
     * 获取场景资产
     */
    getAsset() {
        return this.data[0];
    }

    /**
     * 获取场景
     */
    getScene() {
        return this.data[1];
    }

    /**
     * 添加节点到场景
     */
    addNode(node) {
        const index = this.data.length;
        node.setParent(1); // 父节点是 Scene
        node.setId(generateUUID()); // 场景中的节点需要 _id
        this.getScene().addChild(index);
        this.data.push(node);
        return index;
    }

    /**
     * 添加组件
     */
    addComponent(component, nodeIndex) {
        const index = this.data.length;
        this.data.push(component);
        this.data[nodeIndex].addComponent(index);
        return index;
    }

    /**
     * 转换为 JSON
     */
    toJSON() {
        return this.data.map(item => {
            if (item && typeof item.toJSON === 'function') {
                return item.toJSON();
            }
            return item;
        });
    }
}

/**
 * 预制体数据数组管理器
 */
class PrefabData {
    constructor(name = 'Node') {
        this.data = [];
        
        // 创建基础预制体结构
        const prefab = new CCPrefab();
        const node = new CCNode(name);
        const info = new CCPrefabInfo(1, 0);
        
        prefab.setRoot(1);
        node._prefab = { __id__: 2 };
        
        this.data.push(prefab, node, info);
    }

    /**
     * 获取预制体
     */
    getPrefab() {
        return this.data[0];
    }

    /**
     * 获取根节点
     */
    getRoot() {
        return this.data[1];
    }

    /**
     * 添加子节点
     */
    addChild(node, parentIndex = 1) {
        const index = this.data.length;
        node.setParent(parentIndex);
        node._prefab = { __id__: this.data.length + 1 }; // 预留 PrefabInfo 位置
        
        // 创建 PrefabInfo
        const info = new CCPrefabInfo(1, 0);
        
        this.data[parentIndex].addChild(index);
        this.data.push(node, info);
        
        // 更新节点的 _prefab 引用
        node._prefab = { __id__: this.data.length - 1 };
        
        return index;
    }

    /**
     * 添加组件
     */
    addComponent(component, nodeIndex) {
        const index = this.data.length;
        this.data.push(component);
        this.data[nodeIndex].addComponent(index);
        return index;
    }

    /**
     * 转换为 JSON
     */
    toJSON() {
        return this.data.map(item => {
            if (item && typeof item.toJSON === 'function') {
                return item.toJSON();
            }
            return item;
        });
    }
}

module.exports = {
    CCObject,
    CCNode,
    CCScene,
    CCSceneAsset,
    CCPrefab,
    CCPrefabInfo,
    CCColor,
    CCSize,
    CCVec2,
    CCVec3,
    CCTrs,
    CCRect,
    CCComponent,
    CCCanvas,
    CCWidget,
    CCCamera,
    CCSprite,
    CCLabel,
    CCButton,
    SceneParser,
    PrefabParser,
    SceneData,
    PrefabData
};