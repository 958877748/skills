import CCNode from './cc/CCNode.js';
import CCScene from './cc/CCScene.js';
import CCSceneAsset from './cc/CCSceneAsset.js';
import { CCPrefab, CCPrefabInfo } from './cc/CCPrefab.js';

/**
 * 创建预制体
 */
export function createPrefab(name: string = 'Prefab'): CCPrefab {
    const prefab = new CCPrefab();
    const root = new CCNode(name);
    prefab.setRoot(root);
    return prefab;
}

/**
 * 创建场景
 */
export function createScene(name: string = 'NewScene'): CCSceneAsset {
    const asset = new CCSceneAsset();
    const scene = new CCScene(name);
    asset._scene = scene;
    return asset;
}

// 导出类供其他模块使用
export { CCNode, CCScene, CCSceneAsset, CCPrefab, CCPrefabInfo };
