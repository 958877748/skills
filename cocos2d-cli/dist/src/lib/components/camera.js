"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.applyProps = applyProps;
exports.extractProps = extractProps;
const utils_1 = require("../utils");
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
function create(nodeId) {
    return {
        __type__: "cc.Camera",
        _name: "",
        _objFlags: 0,
        node: { __id__: nodeId },
        _enabled: true,
        _cullingMask: 4294967295,
        _clearFlags: 7,
        _backgroundColor: {
            __type__: "cc.Color",
            r: 0,
            g: 0,
            b: 0,
            a: 255
        },
        _depth: -1,
        _zoomRatio: 1,
        _targetTexture: null,
        _fov: 60,
        _orthoSize: 10,
        _nearClip: 1,
        _farClip: 4096,
        _ortho: true,
        _rect: {
            __type__: "cc.Rect",
            x: 0,
            y: 0,
            width: 1,
            height: 1
        },
        _renderStages: 1,
        _alignWithScreen: true,
        _id: (0, utils_1.generateId)()
    };
}
function applyProps(comp, props) {
    if (!props)
        return;
    for (const [key, value] of Object.entries(props)) {
        const compKey = PROP_MAP[key];
        if (compKey) {
            if (key === 'backgroundColor' && typeof value === 'string') {
                const ccColor = (0, utils_1.parseColorToCcColor)(value);
                if (ccColor) {
                    comp[compKey] = ccColor;
                }
            }
            else {
                comp[compKey] = value;
            }
        }
    }
}
function extractProps(comp) {
    return {
        depth: comp._depth,
        zoomRatio: comp._zoomRatio,
        ortho: comp._ortho,
        cullingMask: comp._cullingMask
    };
}
exports.default = {
    type: 'camera',
    ccType: 'cc.Camera',
    create,
    applyProps,
    extractProps,
    PROP_MAP
};
//# sourceMappingURL=camera.js.map