/**
 * cc.Sprite 组件
 */

const { generateId } = require('../utils');

const DEFAULT_MATERIAL = { "__uuid__": "eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432" };
const SPLASH_SPRITE_FRAME = { "__uuid__": "a23235d1-15db-4b95-8439-a2e005bfff91" };

// 属性映射
const PROP_MAP = {
    'sizeMode': '_sizeMode',
    'fillType': '_fillType',
    'fillCenter': '_fillCenter',
    'fillStart': '_fillStart',
    'fillRange': '_fillRange',
    'trim': '_isTrimmedMode',
    'spriteFrame': '_spriteFrame',
    'type': '_type'
};

// 枚举值
const ENUMS = {
    sizeMode: ['CUSTOM', 'TRIMMED', 'RAW'],
    spriteType: ['SIMPLE', 'SLICED', 'TILED', 'FILLED', 'MESH']
};

/**
 * 创建 Sprite 组件
 * @param {number} nodeId - 节点索引
 * @returns {object} 组件数据
 */
function create(nodeId) {
    return {
        "__type__": "cc.Sprite",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_materials": [DEFAULT_MATERIAL],
        "_srcBlendFactor": 770,
        "_dstBlendFactor": 771,
        "_spriteFrame": SPLASH_SPRITE_FRAME,
        "_type": 0,
        "_sizeMode": 0,
        "_fillType": 0,
        "_fillCenter": { "__type__": "cc.Vec2", "x": 0, "y": 0 },
        "_fillStart": 0,
        "_fillRange": 0,
        "_isTrimmedMode": true,
        "_atlas": null,
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
            if (key === 'fillCenter' && Array.isArray(value)) {
                comp[compKey] = { "__type__": "cc.Vec2", "x": value[0], "y": value[1] };
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
        spriteFrame: comp._spriteFrame?.__uuid__ || null,
        sizeMode: ENUMS.sizeMode[comp._sizeMode] || comp._sizeMode,
        spriteType: ENUMS.spriteType[comp._type] || comp._type,
        trim: comp._isTrimmedMode
    };
}

module.exports = {
    type: 'sprite',
    ccType: 'cc.Sprite',
    create,
    applyProps,
    extractProps,
    PROP_MAP,
    ENUMS
};
