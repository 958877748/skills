/**
 * 模板模块
 * 提供预制体和场景的基础模板
 */

const { CCNode, CCScene, CCSceneAsset, CCPrefab, CCPrefabInfo, SceneData, PrefabData } = require('./cc');

/**
 * 创建预制体基础结构
 * @param {string} name - 预制体名称
 * @returns {Array} 预制体数据数组
 */
function createPrefab(name) {
    const prefabData = new PrefabData(name);
    return prefabData.toJSON();
}

/**
 * 创建场景基础结构（最小场景，只有 SceneAsset + Scene）
 * @param {string} sceneName - 场景名称
 * @returns {Array} 场景数据数组
 */
function createScene(sceneName) {
    const sceneData = new SceneData(sceneName);
    return sceneData.toJSON();
}

module.exports = {
    createPrefab,
    createScene,
    // 导出类供其他模块使用
    CCNode,
    CCScene,
    CCSceneAsset,
    CCPrefab,
    CCPrefabInfo,
    SceneData,
    PrefabData
};