"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.applyProps = applyProps;
exports.extractProps = extractProps;
const utils_1 = require("../utils");
const DEFAULT_MATERIAL = { "__uuid__": "eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432" };
const PROP_MAP = {
    'string': '_string',
    'fontSize': '_fontSize',
    'lineHeight': '_lineHeight',
    'horizontalAlign': '_N$horizontalAlign',
    'verticalAlign': '_N$verticalAlign',
    'overflow': '_N$overflow',
    'fontFamily': '_N$fontFamily',
    'wrap': '_enableWrapText',
    'color': '_color'
};
const ENUMS = {
    horizontalAlign: ['LEFT', 'CENTER', 'RIGHT'],
    verticalAlign: ['TOP', 'CENTER', 'BOTTOM'],
    overflow: ['NONE', 'CLAMP', 'SHRINK', 'RESIZE_HEIGHT']
};
function create(nodeId) {
    return {
        __type__: "cc.Label",
        _name: "",
        _objFlags: 0,
        node: { __id__: nodeId },
        _enabled: true,
        _materials: [DEFAULT_MATERIAL],
        _srcBlendFactor: 770,
        _dstBlendFactor: 771,
        _string: "Label",
        _N$string: "Label",
        _fontSize: 40,
        _lineHeight: 40,
        _enableWrapText: true,
        _N$file: null,
        _isSystemFontUsed: true,
        _spacingX: 0,
        _batchAsBitmap: false,
        _styleFlags: 0,
        _underlineHeight: 0,
        _N$horizontalAlign: 1,
        _N$verticalAlign: 1,
        _N$fontFamily: "Arial",
        _N$overflow: 0,
        _N$cacheMode: 0,
        _id: (0, utils_1.generateId)()
    };
}
function applyProps(comp, props, node) {
    if (!props)
        return;
    if (props.color && node) {
        const ccColor = (0, utils_1.parseColorToCcColor)(props.color);
        if (ccColor) {
            node._color = ccColor;
        }
        delete props.color;
    }
    for (const [key, value] of Object.entries(props)) {
        const compKey = PROP_MAP[key];
        if (compKey) {
            comp[compKey] = value;
            if (key === 'string') {
                comp._N$string = value;
            }
        }
    }
}
function extractProps(comp) {
    return {
        string: comp._string,
        fontSize: comp._fontSize,
        lineHeight: comp._lineHeight,
        horizontalAlign: ENUMS.horizontalAlign[comp._N$horizontalAlign] || comp._N$horizontalAlign,
        verticalAlign: ENUMS.verticalAlign[comp._N$verticalAlign] || comp._N$verticalAlign,
        overflow: ENUMS.overflow[comp._N$overflow] || comp._N$overflow,
        fontFamily: comp._N$fontFamily,
        enableWrapText: comp._enableWrapText
    };
}
exports.default = {
    type: 'label',
    ccType: 'cc.Label',
    create,
    applyProps,
    extractProps,
    PROP_MAP,
    ENUMS
};
//# sourceMappingURL=label.js.map