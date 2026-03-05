/**
 * cc.Widget 组件
 */

const { generateId } = require('../utils');

// 属性映射
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

// 对齐方向位掩码
const ALIGN_FLAGS = {
    top: 1,
    verticalCenter: 2,
    bottom: 4,
    left: 8,
    horizontalCenter: 16,
    right: 32
};

// 枚举值
const ENUMS = {
    alignMode: ['ONCE', 'ON_WINDOW_RESIZE', 'ALWAYS']
};

/**
 * 创建 Widget 组件
 * @param {number} nodeId - 节点索引
 * @returns {object} 组件数据
 */
function create(nodeId) {
    return {
        "__type__": "cc.Widget",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "alignMode": 1,
        "_target": null,
        "_alignFlags": 0,
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
    
    // 计算对齐标志
    let alignFlags = 0;
    for (const dir of ['top', 'bottom', 'left', 'right', 'horizontalCenter', 'verticalCenter']) {
        if (props[dir] !== undefined && props[dir] !== null) {
            alignFlags |= ALIGN_FLAGS[dir];
        }
    }
    if (alignFlags > 0) {
        comp._alignFlags = alignFlags;
    }
    
    // 应用其他属性
    for (const [key, value] of Object.entries(props)) {
        const compKey = PROP_MAP[key];
        if (compKey) {
            comp[compKey] = value;
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
        alignMode: ENUMS.alignMode[comp.alignMode] || comp.alignMode,
        left: comp._left,
        right: comp._right,
        top: comp._top,
        bottom: comp._bottom
    };
}

module.exports = {
    type: 'widget',
    ccType: 'cc.Widget',
    create,
    applyProps,
    extractProps,
    PROP_MAP,
    ENUMS,
    ALIGN_FLAGS
};
