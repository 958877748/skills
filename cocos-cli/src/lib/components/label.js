/**
 * cc.Label 组件
 */

const { generateId, parseColorToCcColor } = require('../utils');

const DEFAULT_MATERIAL = { "__uuid__": "eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432" };

// 属性映射
const PROP_MAP = {
    'string': '_string',
    'fontSize': '_fontSize',
    'lineHeight': '_lineHeight',
    'horizontalAlign': '_N$horizontalAlign',
    'verticalAlign': '_N$verticalAlign',
    'overflow': '_N$overflow',
    'fontFamily': '_N$fontFamily',
    'wrap': '_enableWrapText',
    'color': '_color'  // 特殊处理，设置到节点
};

// 枚举值
const ENUMS = {
    horizontalAlign: ['LEFT', 'CENTER', 'RIGHT'],
    verticalAlign: ['TOP', 'CENTER', 'BOTTOM'],
    overflow: ['NONE', 'CLAMP', 'SHRINK', 'RESIZE_HEIGHT']
};

/**
 * 创建 Label 组件
 * @param {number} nodeId - 节点索引
 * @returns {object} 组件数据
 */
function create(nodeId) {
    return {
        "__type__": "cc.Label",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_materials": [DEFAULT_MATERIAL],
        "_srcBlendFactor": 770,
        "_dstBlendFactor": 771,
        "_string": "Label",
        "_N$string": "Label",
        "_fontSize": 40,
        "_lineHeight": 40,
        "_enableWrapText": true,
        "_N$file": null,
        "_isSystemFontUsed": true,
        "_spacingX": 0,
        "_batchAsBitmap": false,
        "_styleFlags": 0,
        "_underlineHeight": 0,
        "_N$horizontalAlign": 1,
        "_N$verticalAlign": 1,
        "_N$fontFamily": "Arial",
        "_N$overflow": 0,
        "_N$cacheMode": 0,
        "_id": generateId()
    };
}

/**
 * 应用属性
 * @param {object} comp - 组件对象
 * @param {object} props - 属性对象
 * @param {object} node - 节点对象（可选，用于 color）
 */
function applyProps(comp, props, node) {
    if (!props) return;
    
    // color 特殊处理：设置到节点
    if (props.color && node) {
        const ccColor = parseColorToCcColor(props.color);
        if (ccColor) {
            node._color = ccColor;
        }
        delete props.color;
    }
    
    for (const [key, value] of Object.entries(props)) {
        const compKey = PROP_MAP[key];
        if (compKey) {
            comp[compKey] = value;
            // string 需要同步到 _N$string
            if (key === 'string') {
                comp._N$string = value;
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

module.exports = {
    type: 'label',
    ccType: 'cc.Label',
    create,
    applyProps,
    extractProps,
    PROP_MAP,
    ENUMS
};
