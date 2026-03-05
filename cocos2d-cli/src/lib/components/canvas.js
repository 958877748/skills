/**
 * cc.Canvas 组件
 */

const { generateId } = require('../utils');

// 属性映射
const PROP_MAP = {
    'designResolution': '_designResolution',
    'fitWidth': '_fitWidth',
    'fitHeight': '_fitHeight'
};

/**
 * 创建 Canvas 组件
 * @param {number} nodeId - 节点索引
 * @returns {object} 组件数据
 */
function create(nodeId) {
    return {
        "__type__": "cc.Canvas",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_designResolution": {
            "__type__": "cc.Size",
            "width": 960,
            "height": 640
        },
        "_fitWidth": false,
        "_fitHeight": true,
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
            // designResolution 特殊处理
            if (key === 'designResolution' && Array.isArray(value)) {
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
    const clean = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
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

module.exports = {
    type: 'canvas',
    ccType: 'cc.Canvas',
    create,
    applyProps,
    extractProps,
    PROP_MAP
};
