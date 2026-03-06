/**
 * 模板模块
 * 提供预制体和场景的创建方法
 */

const { CCNode, CCScene, CCSceneAsset, CCPrefab, CCPrefabInfo } = require('./cc');

/**
 * 创建预制体
 * @param {string} name - 预制体名称
 * @returns {CCPrefab}
 */
function createPrefab(name = 'Node') {
    const prefab = new CCPrefab();
    const node = new CCNode(name);
    const info = new CCPrefabInfo();
    
    prefab._root = node;
    node._prefab = info;
    
    return prefab;
}

/**
 * 创建场景
 * @param {string} name - 场景名称
 * @returns {CCSceneAsset}
 */
function createScene(name = 'NewScene') {
    const asset = new CCSceneAsset();
    const scene = new CCScene(name);
    
    asset._scene = scene;
    scene._parent = null;
    scene._children = [];
    
    return asset;
}

module.exports = {
    createPrefab,
    createScene,
    // 导出类供其他模块使用
    CCNode,
    CCScene,
    CCSceneAsset,
    CCPrefab,
    CCPrefabInfo
};
