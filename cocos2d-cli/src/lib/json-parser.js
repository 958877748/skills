/**
 * JSON 解析器
 * 将简化JSON转换为CCNode对象树
 */

const { CCNode, CCCanvas, CCWidget, CCSprite, CCLabel, CCButton, CCCamera } = require('./cc');
const { parseColor } = require('./utils');

/**
 * 创建组件实例
 */
function createComponent(type) {
    switch (type.toLowerCase()) {
        case 'canvas': return new CCCanvas();
        case 'widget': return new CCWidget();
        case 'sprite': return new CCSprite();
        case 'label': return new CCLabel();
        case 'button': return new CCButton();
        case 'camera': return new CCCamera();
        default: return null;
    }
}

/**
 * 解析组件定义
 */
function parseComponent(compDef) {
    if (typeof compDef === 'string') {
        return { type: compDef, props: {} };
    }
    if (typeof compDef === 'object' && compDef.type) {
        const props = { ...compDef };
        delete props.type;
        return { type: compDef.type, props };
    }
    return null;
}

/**
 * 应用组件属性
 */
function applyComponentProps(comp, props, node) {
    if (!props) return;
    
    for (const [key, value] of Object.entries(props)) {
        switch (key) {
            case 'string':
                if (comp._string !== undefined) {
                    comp._string = value;
                    if (comp._N$string !== undefined) comp._N$string = value;
                }
                break;
            case 'fontSize':
                if (comp._fontSize !== undefined) comp._fontSize = value;
                break;
            case 'lineHeight':
                if (comp._lineHeight !== undefined) comp._lineHeight = value;
                break;
            case 'sizeMode':
                if (comp._sizeMode !== undefined) comp._sizeMode = value;
                break;
            case 'color':
                if (node) {
                    const parsed = parseColor(value);
                    if (parsed && node._color) {
                        node._color.r = parsed.r;
                        node._color.g = parsed.g;
                        node._color.b = parsed.b;
                        node._color.a = parsed.a;
                    }
                }
                break;
            default:
                if (comp[key] !== undefined) {
                    comp[key] = value;
                }
        }
    }
}

/**
 * 应用属性到节点
 */
function applyNodeProps(node, def) {
    if (def.name) node._name = def.name;
    if (def.active !== undefined) node._active = def.active;
    if (def.opacity !== undefined) node._opacity = def.opacity;
    if (def.width !== undefined) node._contentSize.width = def.width;
    if (def.height !== undefined) node._contentSize.height = def.height;
    if (def.x !== undefined) node._trs.array[0] = def.x;
    if (def.y !== undefined) node._trs.array[1] = def.y;
    if (def.rotation !== undefined) {
        node._trs.array[5] = def.rotation * Math.PI / 180;
        node._eulerAngles.z = def.rotation;
    }
    if (def.scaleX !== undefined) node._trs.array[7] = def.scaleX;
    if (def.scaleY !== undefined) node._trs.array[8] = def.scaleY;
    if (def.anchorX !== undefined) node._anchorPoint.x = def.anchorX;
    if (def.anchorY !== undefined) node._anchorPoint.y = def.anchorY;
    if (def.color) {
        const parsed = parseColor(def.color);
        if (parsed) {
            node._color.set(parsed.r, parsed.g, parsed.b, parsed.a);
        }
    }
}

/**
 * 解析节点定义（递归）
 * @param {Object} def - 节点定义
 * @returns {CCNode}
 */
function parseNode(def) {
    const node = new CCNode(def.name || 'Node');
    
    // 应用属性
    applyNodeProps(node, def);
    
    // 添加组件
    if (def.components && def.components.length > 0) {
        node._components = [];
        for (const compDef of def.components) {
            const parsed = parseComponent(compDef);
            if (parsed) {
                const comp = createComponent(parsed.type);
                if (comp) {
                    applyComponentProps(comp, parsed.props, node);
                    comp.node = node;
                    node._components.push(comp);
                }
            }
        }
    }
    
    // 递归处理子节点
    if (def.children && def.children.length > 0) {
        node._children = [];
        for (const childDef of def.children) {
            const child = parseNode(childDef);
            child._parent = node;
            node._children.push(child);
        }
    }
    
    return node;
}

/**
 * 从简化JSON解析为CCNode树
 * @param {Object|string} json - JSON对象或字符串
 * @returns {CCNode}
 */
function fromJSON(json) {
    if (typeof json === 'string') {
        json = JSON.parse(json.replace(/^\uFEFF/, '').trim());
    }
    
    const rootDef = Array.isArray(json) ? json[0] : json;
    return parseNode(rootDef);
}

module.exports = {
    fromJSON,
    parseNode,
    applyNodeProps
};
