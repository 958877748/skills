/**
 * 组件模块入口
 * 统一导出所有组件
 */

const sprite = require('./sprite');
const label = require('./label');
const button = require('./button');
const widget = require('./widget');
const layout = require('./layout');
const canvas = require('./canvas');
const camera = require('./camera');
const particleSystem = require('./particle-system');

// 组件类型映射
const components = {
    sprite,
    label,
    button,
    widget,
    layout,
    canvas,
    camera,
    particleSystem,
    // 别名
    particle: particleSystem
};

// 类型名称映射（支持多种写法）
const typeAliases = {
    'sprite': 'sprite',
    'label': 'label',
    'button': 'button',
    'widget': 'widget',
    'layout': 'layout',
    'canvas': 'canvas',
    'camera': 'camera',
    'particle': 'particleSystem',
    'particlesystem': 'particleSystem',
    'particleSystem': 'particleSystem'
};

/**
 * 获取组件模块
 * @param {string} type - 组件类型
 * @returns {object|null} 组件模块
 */
function getComponent(type) {
    const normalizedName = typeAliases[type.toLowerCase()];
    return normalizedName ? components[normalizedName] : null;
}

/**
 * 创建组件
 * @param {string} type - 组件类型
 * @param {number} nodeId - 节点索引
 * @returns {object|null} 组件数据
 */
function createComponent(type, nodeId) {
    const comp = getComponent(type);
    return comp ? comp.create(nodeId) : null;
}

/**
 * 应用组件属性
 * @param {object} comp - 组件对象
 * @param {object} props - 属性对象
 * @param {object} node - 节点对象（可选）
 */
function applyComponentProps(comp, props, node) {
    if (!comp || !props) return;
    
    const ccType = comp.__type__;
    const compModule = getComponentByCcType(ccType);
    
    if (compModule && compModule.applyProps) {
        compModule.applyProps(comp, props, node);
    }
}

/**
 * 提取组件属性
 * @param {object} comp - 组件对象
 * @returns {object} 提取的属性
 */
function extractComponentProps(comp) {
    if (!comp) return null;
    
    const ccType = comp.__type__;
    const compModule = getComponentByCcType(ccType);
    
    const base = comp._enabled ? { type: ccType } : { type: ccType, enabled: false };
    
    if (compModule && compModule.extractProps) {
        return { ...base, ...compModule.extractProps(comp) };
    }
    
    // 默认提取：非 _ 开头的属性
    const result = { ...base };
    for (const key of Object.keys(comp)) {
        if (!key.startsWith('_') && key !== '__type__') {
            result[key] = comp[key];
        }
    }
    return result;
}

/**
 * 通过 cc.__type__ 获取组件模块
 * @param {string} ccType - cc 类型名
 * @returns {object|null} 组件模块
 */
function getComponentByCcType(ccType) {
    for (const comp of Object.values(components)) {
        if (comp.ccType === ccType) {
            return comp;
        }
    }
    return null;
}

/**
 * 解析组件定义
 * 支持两种格式：
 * 1. 字符串: "sprite"
 * 2. 对象: { "type": "sprite", "sizeMode": 1 }
 * @param {string|object} compDef - 组件定义
 * @returns {object|null} - { type, props } 或 null
 */
function parseComponent(compDef) {
    if (typeof compDef === 'string') {
        const normalizedName = typeAliases[compDef.toLowerCase()];
        return normalizedName ? { type: normalizedName, props: {} } : null;
    }
    
    if (typeof compDef === 'object' && compDef.type) {
        const normalizedName = typeAliases[compDef.type.toLowerCase()];
        if (!normalizedName) return null;
        
        const props = { ...compDef };
        delete props.type;
        return { type: normalizedName, props };
    }
    
    return null;
}

module.exports = {
    components,
    typeAliases,
    getComponent,
    getComponentByCcType,
    createComponent,
    applyComponentProps,
    extractComponentProps,
    parseComponent
};
