"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.applyProps = applyProps;
exports.extractProps = extractProps;
const utils_1 = require("../utils");
const PROP_MAP = {
    'designResolution': '_designResolution',
    'fitWidth': '_fitWidth',
    'fitHeight': '_fitHeight'
};
function create(nodeId) {
    return {
        __type__: "cc.Canvas",
        _name: "",
        _objFlags: 0,
        node: { __id__: nodeId },
        _enabled: true,
        _designResolution: {
            __type__: "cc.Size",
            width: 960,
            height: 640
        },
        _fitWidth: false,
        _fitHeight: true,
        _id: (0, utils_1.generateId)()
    };
}
function applyProps(comp, props) {
    if (!props)
        return;
    for (const [key, value] of Object.entries(props)) {
        const compKey = PROP_MAP[key];
        if (compKey) {
            if (key === 'designResolution' && Array.isArray(value)) {
                comp[compKey] = { __type__: "cc.Size", width: value[0], height: value[1] };
            }
            else {
                comp[compKey] = value;
            }
        }
    }
}
function extractProps(comp) {
    const clean = (obj) => {
        if (!obj || typeof obj !== 'object')
            return obj;
        const result = {};
        for (const [k, v] of Object.entries(obj)) {
            if (k !== '__type__') {
                result[k] = v;
            }
        }
        return result;
    };
    return {
        designResolution: clean(comp._designResolution),
        fitWidth: comp._fitWidth,
        fitHeight: comp._fitHeight
    };
}
exports.default = {
    type: 'canvas',
    ccType: 'cc.Canvas',
    create,
    applyProps,
    extractProps,
    PROP_MAP
};
//# sourceMappingURL=canvas.js.map