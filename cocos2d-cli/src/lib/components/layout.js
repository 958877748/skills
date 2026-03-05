/**
 * cc.Layout 组件
 */

const { generateId } = require('../utils');

// 属性映射
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

// 枚举值
const ENUMS = {
    layoutType: ['NONE', 'HORIZONTAL', 'VERTICAL', 'GRID']
};

/**
 * 创建 Layout 组件
 * @param {number} nodeId - 节点索引
 * @returns {object} 组件数据
 */
function create(nodeId) {
    return {
        "__type__": "cc.Layout",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_layoutSize": {
            "__type__": "cc.Size",
            "width": 200,
            "height": 150
        },
        "_resize": 1,
        "_N$layoutType": 2,
        "_N$cellSize": {
            "__type__": "cc.Size",
            "width": 40,
            "height": 40
        },
        "_N$startAxis": 0,
        "_N$paddingLeft": 0,
        "_N$paddingRight": 0,
        "_N$paddingTop": 0,
        "_N$paddingBottom": 0,
        "_N$spacingX": 0,
        "_N$spacingY": 0,
        "_N$verticalDirection": 1,
        "_N$horizontalDirection": 0,
        "_N$affectedByScale": false,
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
            // cellSize 特殊处理
            if (key === 'cellSize' && Array.isArray(value)) {
                comp[compKey] = { "__type__": "cc.Size", "width": value[0], "height": value[1] };
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
        layoutType: ENUMS.layoutType[comp._N$layoutType] || comp._N$layoutType,
        spacingX: comp._N$spacingX,
        spacingY: comp._N$spacingY,
        paddingLeft: comp._N$paddingLeft,
        paddingRight: comp._N$paddingRight,
        paddingTop: comp._N$paddingTop,
        paddingBottom: comp._N$paddingBottom
    };
}

module.exports = {
    type: 'layout',
    ccType: 'cc.Layout',
    create,
    applyProps,
    extractProps,
    PROP_MAP,
    ENUMS
};
