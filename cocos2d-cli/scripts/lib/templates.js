/**
 * 模板数据
 * @module lib/templates
 */

import CCNode from './cc/CCNode.js';
import CCScene from './cc/CCScene.js';
import CCSceneAsset from './cc/CCSceneAsset.js';
import { CCPrefab, CCPrefabInfo } from './cc/CCPrefab.js';
export function createPrefab(name = 'Prefab') {
    const prefab = new CCPrefab();
    const root = new CCNode(name);
    prefab.setRoot(root);
    return prefab;
}
export function createScene(name = 'NewScene') {
    const asset = new CCSceneAsset();
    const scene = new CCScene(name);
    asset._scene = scene;
    return asset;
}
export { CCNode, CCScene, CCSceneAsset, CCPrefab, CCPrefabInfo };
