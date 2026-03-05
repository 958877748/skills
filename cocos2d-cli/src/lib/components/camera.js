/**
 * cc.Camera 组件
 */

const { generateId, parseColorToCcColor } = require('../utils');

// 属性映射
const PROP_MAP = {
    'depth': '_depth',
    'zoomRatio': '_zoomRatio',
    'ortho': '_ortho',
    'orthoSize': '_orthoSize',
    'cullingMask': '_cullingMask',
    'backgroundColor': '_backgroundColor',
    'fov': '_fov',
    'nearClip': '_nearClip',
    'farClip': '_farClip'
};

/**
 * 创建 Camera 组件
 * @param {number} nodeId - 节点索引
 * @returns {object} 组件数据
 */
function create(nodeId) {
    return {
        "__type__": "cc.Camera",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_cullingMask": 4294967295,
        "_clearFlags": 7,
        "_backgroundColor": {
            "__type__": "cc.Color",
            "r": 0,
            "g": 0,
            "b": 0,
            "a": 255
        },
        "_depth": -1,
        "_zoomRatio": 1,
        "_targetTexture": null,
        "_fov": 60,
        "_orthoSize": 10,
        "_nearClip": 1,
        "_farClip": 4096,
        "_ortho": true,
        "_rect": {
            "__type__": "cc.Rect",
            "x": 0,
            "y": 0,
            "width": 1,
            "height": 1
        },
        "_renderStages": 1,
        "_alignWithScreen": true,
        "_id": generateId()
    };
}

/**
 * 应用属性
 * @param {object} comp - 组件对象
 * @param {object} props - 属性对象
 */
function applyProps(comp, props) {
    if (!props) return;
    
    for (const [key, value] of Object.entries(props)) {
        const compKey = PROP_MAP[key];
        if (compKey) {
            // backgroundColor 特殊处理
            if (key === 'backgroundColor' && typeof value === 'string') {
                const ccColor = parseColorToCcColor(value);
                if (ccColor) {
                    comp[compKey] = ccColor;
                }
            } else {
                comp[compKey] = value;
            }
        }
    }
}

/**
 * 提取属性（用于显示）
 * @param {object} comp - 组件对象
 * @returns {object} 提取的属性
 */
function extractProps(comp) {
    return {
        depth: comp._depth,
        zoomRatio: comp._zoomRatio,
        ortho: comp._ortho,
        cullingMask: comp._cullingMask
    };
}

module.exports = {
    type: 'camera',
    ccType: 'cc.Camera',
    create,
    applyProps,
    extractProps,
    PROP_MAP
};
