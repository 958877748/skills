"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComponent = getComponent;
exports.createComponent = createComponent;
exports.applyComponentProps = applyComponentProps;
exports.extractComponentProps = extractComponentProps;
exports.parseComponent = parseComponent;
const sprite_1 = __importDefault(require("./sprite"));
const label_1 = __importDefault(require("./label"));
const button_1 = __importDefault(require("./button"));
const widget_1 = __importDefault(require("./widget"));
const layout_1 = __importDefault(require("./layout"));
const canvas_1 = __importDefault(require("./canvas"));
const camera_1 = __importDefault(require("./camera"));
const particle_system_1 = __importDefault(require("./particle-system"));
const components = {
    sprite: sprite_1.default,
    label: label_1.default,
    button: button_1.default,
    widget: widget_1.default,
    layout: layout_1.default,
    canvas: canvas_1.default,
    camera: camera_1.default,
    particleSystem: particle_system_1.default,
    particle: particle_system_1.default
};
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
function getComponent(type) {
    const normalizedName = typeAliases[type.toLowerCase()];
    return normalizedName ? components[normalizedName] : null;
}
function createComponent(type, nodeId) {
    const comp = getComponent(type);
    if (!comp)
        return null;
    return comp.create(nodeId);
}
function applyComponentProps(comp, props, node) {
    if (!comp || !props)
        return;
    const ccType = comp.__type__;
    const compModule = getComponentByCcType(ccType);
    if (compModule && compModule.applyProps) {
        compModule.applyProps(comp, props, node);
    }
}
function extractComponentProps(comp) {
    if (!comp)
        return null;
    const ccType = comp.__type__;
    const compModule = getComponentByCcType(ccType);
    const isEnabled = comp._enabled;
    const base = isEnabled ? { type: ccType } : { type: ccType, enabled: false };
    if (compModule && compModule.extractProps) {
        return { ...base, ...compModule.extractProps(comp) };
    }
    const result = { ...base };
    const c = comp;
    for (const key of Object.keys(c)) {
        if (!key.startsWith('_') && key !== '__type__') {
            result[key] = c[key];
        }
    }
    return result;
}
function getComponentByCcType(ccType) {
    for (const comp of Object.values(components)) {
        if (comp.ccType === ccType) {
            return comp;
        }
    }
    return null;
}
function parseComponent(compDef) {
    if (typeof compDef === 'string') {
        const normalizedName = typeAliases[compDef.toLowerCase()];
        return normalizedName ? { type: normalizedName, props: {} } : null;
    }
    if (typeof compDef === 'object' && compDef.type) {
        const normalizedName = typeAliases[String(compDef.type).toLowerCase()];
        if (!normalizedName)
            return null;
        const props = { ...compDef };
        delete props.type;
        return { type: normalizedName, props: props };
    }
    return null;
}
exports.default = {
    components,
    typeAliases,
    getComponent,
    getComponentByCcType,
    createComponent,
    applyComponentProps,
    extractComponentProps,
    parseComponent
};
//# sourceMappingURL=index.js.map