"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.applyProps = applyProps;
exports.extractProps = extractProps;
const utils_1 = require("../utils");
const PROP_MAP = {
    'layoutType': '_N$layoutType',
    'cellSize': '_N$cellSize',
    'startAxis': '_N$startAxis',
    'paddingLeft': '_N$paddingLeft',
    'paddingRight': '_N$paddingRight',
    'paddingTop': '_N$paddingTop',
    'paddingBottom': '_N$paddingBottom',
    'spacingX': '_N$spacingX',
    'spacingY': '_N$spacingY',
    'resize': '_resize'
};
const ENUMS = {
    layoutType: ['NONE', 'HORIZONTAL', 'VERTICAL', 'GRID']
};
function create(nodeId) {
    return {
        __type__: "cc.Layout",
        _name: "",
        _objFlags: 0,
        node: { __id__: nodeId },
        _enabled: true,
        _layoutSize: {
            __type__: "cc.Size",
            width: 200,
            height: 150
        },
        _resize: 1,
        _N$layoutType: 2,
        _N$cellSize: {
            __type__: "cc.Size",
            width: 40,
            height: 40
        },
        _N$startAxis: 0,
        _N$paddingLeft: 0,
        _N$paddingRight: 0,
        _N$paddingTop: 0,
        _N$paddingBottom: 0,
        _N$spacingX: 0,
        _N$spacingY: 0,
        _N$verticalDirection: 1,
        _N$horizontalDirection: 0,
        _N$affectedByScale: false,
        _id: (0, utils_1.generateId)()
    };
}
function applyProps(comp, props) {
    if (!props)
        return;
    for (const [key, value] of Object.entries(props)) {
        const compKey = PROP_MAP[key];
        if (compKey) {
            if (key === 'cellSize' && Array.isArray(value)) {
                comp[compKey] = { __type__: "cc.Size", width: value[0], height: value[1] };
            }
            else {
                comp[compKey] = value;
            }
        }
    }
}
function extractProps(comp) {
    return {
        layoutType: ENUMS.layoutType[comp._N$layoutType] || comp._N$layoutType,
        spacingX: comp._N$spacingX,
        spacingY: comp._N$spacingY,
        paddingLeft: comp._N$paddingLeft,
        paddingRight: comp._N$paddingRight,
        paddingTop: comp._N$paddingTop,
        paddingBottom: comp._N$paddingBottom
    };
}
exports.default = {
    type: 'layout',
    ccType: 'cc.Layout',
    create,
    applyProps,
    extractProps,
    PROP_MAP,
    ENUMS
};
//# sourceMappingURL=layout.js.map