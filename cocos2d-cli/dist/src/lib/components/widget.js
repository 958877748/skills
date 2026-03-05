"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.applyProps = applyProps;
exports.extractProps = extractProps;
const utils_1 = require("../utils");
const PROP_MAP = {
    'left': '_left',
    'right': '_right',
    'top': '_top',
    'bottom': '_bottom',
    'horizontalCenter': '_horizontalCenter',
    'verticalCenter': '_verticalCenter',
    'isAbsLeft': '_isAbsLeft',
    'isAbsRight': '_isAbsRight',
    'isAbsTop': '_isAbsTop',
    'isAbsBottom': '_isAbsBottom',
    'alignMode': 'alignMode'
};
const ALIGN_FLAGS = {
    top: 1,
    verticalCenter: 2,
    bottom: 4,
    left: 8,
    horizontalCenter: 16,
    right: 32
};
const ENUMS = {
    alignMode: ['ONCE', 'ON_WINDOW_RESIZE', 'ALWAYS']
};
function create(nodeId) {
    return {
        __type__: "cc.Widget",
        _name: "",
        _objFlags: 0,
        node: { __id__: nodeId },
        _enabled: true,
        alignMode: 1,
        _target: null,
        _alignFlags: 0,
        _left: 0,
        _right: 0,
        _top: 0,
        _bottom: 0,
        _verticalCenter: 0,
        _horizontalCenter: 0,
        _isAbsLeft: true,
        _isAbsRight: true,
        _isAbsTop: true,
        _isAbsBottom: true,
        _isAbsHorizontalCenter: true,
        _isAbsVerticalCenter: true,
        _originalWidth: 0,
        _originalHeight: 0,
        _id: (0, utils_1.generateId)()
    };
}
function applyProps(comp, props) {
    if (!props)
        return;
    let alignFlags = 0;
    for (const dir of ['top', 'bottom', 'left', 'right', 'horizontalCenter', 'verticalCenter']) {
        if (props[dir] !== undefined && props[dir] !== null) {
            alignFlags |= ALIGN_FLAGS[dir];
        }
    }
    if (alignFlags > 0) {
        comp._alignFlags = alignFlags;
    }
    for (const [key, value] of Object.entries(props)) {
        const compKey = PROP_MAP[key];
        if (compKey) {
            comp[compKey] = value;
        }
    }
}
function extractProps(comp) {
    return {
        alignMode: ENUMS.alignMode[comp.alignMode] || comp.alignMode,
        left: comp._left,
        right: comp._right,
        top: comp._top,
        bottom: comp._bottom
    };
}
exports.default = {
    type: 'widget',
    ccType: 'cc.Widget',
    create,
    applyProps,
    extractProps,
    PROP_MAP,
    ENUMS,
    ALIGN_FLAGS
};
//# sourceMappingURL=widget.js.map