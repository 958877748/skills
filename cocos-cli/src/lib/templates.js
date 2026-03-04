/**
 * 模板模块
 * 提供预制体和场景的基础模板
 */

const { generateUUID } = require('./utils');
const { generateFileId } = require('./fire-utils');

/**
 * 创建预制体基础结构
 * @param {string} name - 预制体名称
 * @returns {Array} 预制体数据数组
 */
function createPrefab(name) {
    const fileId = generateFileId();
    return [
        {
            "__type__": "cc.Prefab",
            "_name": "",
            "_objFlags": 0,
            "_native": "",
            "data": { "__id__": 1 },
            "optimizationPolicy": 0,
            "asyncLoadAssets": false,
            "readonly": false
        },
        {
            "__type__": "cc.Node",
            "_name": name,
            "_objFlags": 0,
            "_parent": null,
            "_children": [],
            "_active": true,
            "_components": [],
            "_prefab": { "__id__": 2 },
            "_opacity": 255,
            "_color": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 },
            "_contentSize": { "__type__": "cc.Size", "width": 0, "height": 0 },
            "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
            "_trs": { "__type__": "TypedArray", "ctor": "Float64Array", "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] },
            "_eulerAngles": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
            "_skewX": 0,
            "_skewY": 0,
            "_is3DNode": false,
            "_groupIndex": 0,
            "groupIndex": 0,
            "_id": ""
        },
        {
            "__type__": "cc.PrefabInfo",
            "root": { "__id__": 1 },
            "asset": { "__id__": 0 },
            "fileId": fileId,
            "sync": false
        }
    ];
}

/**
 * 创建场景基础结构
 * @param {string} sceneName - 场景名称
 * @returns {Array} 场景数据数组
 */
function createScene(sceneName) {
    const sceneUUID = generateUUID();
    const canvasUUID = generateUUID();
    const cameraUUID = generateUUID();
    
    return [
        // 索引 0: cc.SceneAsset
        {
            "__type__": "cc.SceneAsset",
            "_name": sceneName || "NewScene",
            "_objFlags": 0,
            "_native": "",
            "scene": { "__id__": 1 }
        },
        // 索引 1: cc.Scene
        {
            "__type__": "cc.Scene",
            "_name": sceneName || "NewScene",
            "_objFlags": 0,
            "_parent": null,
            "_children": [{ "__id__": 2 }],
            "_active": true,
            "_components": [],
            "_prefab": null,
            "_opacity": 255,
            "_color": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 },
            "_contentSize": { "__type__": "cc.Size", "width": 0, "height": 0 },
            "_anchorPoint": { "__type__": "cc.Vec2", "x": 0, "y": 0 },
            "_trs": { "__type__": "TypedArray", "ctor": "Float64Array", "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] },
            "_is3DNode": true,
            "_groupIndex": 0,
            "groupIndex": 0,
            "autoReleaseAssets": false,
            "_id": sceneUUID
        },
        // 索引 2: Canvas 节点
        {
            "__type__": "cc.Node",
            "_name": "Canvas",
            "_objFlags": 0,
            "_parent": { "__id__": 1 },
            "_children": [{ "__id__": 3 }],
            "_active": true,
            "_components": [{ "__id__": 5 }, { "__id__": 6 }],
            "_prefab": null,
            "_opacity": 255,
            "_color": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 },
            "_contentSize": { "__type__": "cc.Size", "width": 960, "height": 640 },
            "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
            "_trs": { "__type__": "TypedArray", "ctor": "Float64Array", "array": [480, 320, 0, 0, 0, 0, 1, 1, 1, 1] },
            "_eulerAngles": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
            "_skewX": 0,
            "_skewY": 0,
            "_is3DNode": false,
            "_groupIndex": 0,
            "groupIndex": 0,
            "_id": canvasUUID
        },
        // 索引 3: Main Camera 节点
        {
            "__type__": "cc.Node",
            "_name": "Main Camera",
            "_objFlags": 0,
            "_parent": { "__id__": 2 },
            "_children": [],
            "_active": true,
            "_components": [{ "__id__": 4 }],
            "_prefab": null,
            "_opacity": 255,
            "_color": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 },
            "_contentSize": { "__type__": "cc.Size", "width": 0, "height": 0 },
            "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
            "_trs": { "__type__": "TypedArray", "ctor": "Float64Array", "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] },
            "_eulerAngles": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
            "_skewX": 0,
            "_skewY": 0,
            "_is3DNode": false,
            "_groupIndex": 0,
            "groupIndex": 0,
            "_id": cameraUUID
        },
        // 索引 4: Camera 组件
        {
            "__type__": "cc.Camera",
            "_name": "",
            "_objFlags": 0,
            "node": { "__id__": 3 },
            "_enabled": true,
            "_cullingMask": 4294967295,
            "_clearFlags": 7,
            "_backgroundColor": { "__type__": "cc.Color", "r": 0, "g": 0, "b": 0, "a": 255 },
            "_depth": -1,
            "_zoomRatio": 1,
            "_targetTexture": null,
            "_fov": 60,
            "_orthoSize": 10,
            "_nearClip": 1,
            "_farClip": 4096,
            "_ortho": true,
            "_rect": { "__type__": "cc.Rect", "x": 0, "y": 0, "width": 1, "height": 1 },
            "_renderStages": 1,
            "_alignWithScreen": true,
            "_id": ""
        },
        // 索引 5: Canvas 组件
        {
            "__type__": "cc.Canvas",
            "_name": "",
            "_objFlags": 0,
            "node": { "__id__": 2 },
            "_enabled": true,
            "_designResolution": { "__type__": "cc.Size", "width": 960, "height": 640 },
            "_fitWidth": false,
            "_fitHeight": true,
            "_id": ""
        },
        // 索引 6: Widget 组件 (Canvas)
        {
            "__type__": "cc.Widget",
            "_name": "",
            "_objFlags": 0,
            "node": { "__id__": 2 },
            "_enabled": true,
            "alignMode": 1,
            "_target": null,
            "_alignFlags": 45,
            "_left": 0,
            "_right": 0,
            "_top": 0,
            "_bottom": 0,
            "_verticalCenter": 0,
            "_horizontalCenter": 0,
            "_isAbsLeft": true,
            "_isAbsRight": true,
            "_isAbsTop": true,
            "_isAbsBottom": true,
            "_isAbsHorizontalCenter": true,
            "_isAbsVerticalCenter": true,
            "_originalWidth": 0,
            "_originalHeight": 0,
            "_id": ""
        }
    ];
}

module.exports = {
    createPrefab,
    createScene
};
