import sprite from './sprite';
import label from './label';
import button from './button';
import widget from './widget';
import layout from './layout';
import canvas from './canvas';
import camera from './camera';
import particleSystem from './particle-system';

const components: Record<string, unknown> = {
    sprite,
    label,
    button,
    widget,
    layout,
    canvas,
    camera,
    particleSystem,
    particle: particleSystem
};

const typeAliases: Record<string, string> = {
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

export function getComponent(type: string): unknown {
    const normalizedName = typeAliases[type.toLowerCase()];
    return normalizedName ? components[normalizedName] : null;
}

export function createComponent(type: string, nodeId: number): unknown {
    const comp = getComponent(type);
    if (!comp) return null;
    return (comp as { create: (nodeId: number) => unknown }).create(nodeId);
}

export function applyComponentProps(comp: unknown, props: unknown, node?: unknown): void {
    if (!comp || !props) return;
    
    const ccType = (comp as { __type__: string }).__type__;
    const compModule = getComponentByCcType(ccType);
    
    if (compModule && (compModule as { applyProps: unknown }).applyProps) {
        (compModule as { applyProps: (comp: unknown, props: unknown, node?: unknown) => void }).applyProps(comp, props, node);
    }
}

export function extractComponentProps(comp: unknown): Record<string, unknown> | null {
    if (!comp) return null;
    
    const ccType = (comp as { __type__: string }).__type__;
    const compModule = getComponentByCcType(ccType);
    
    const isEnabled = (comp as { _enabled?: boolean })._enabled;
    const base = isEnabled ? { type: ccType } : { type: ccType, enabled: false };
    
    if (compModule && (compModule as { extractProps: unknown }).extractProps) {
        return { ...base, ...(compModule as { extractProps: (comp: unknown) => Record<string, unknown> }).extractProps(comp) };
    }
    
    const result: Record<string, unknown> = { ...base };
    const c = comp as Record<string, unknown>;
    for (const key of Object.keys(c)) {
        if (!key.startsWith('_') && key !== '__type__') {
            result[key] = c[key];
        }
    }
    return result;
}

function getComponentByCcType(ccType: string): unknown {
    for (const comp of Object.values(components)) {
        if ((comp as { ccType: string }).ccType === ccType) {
            return comp;
        }
    }
    return null;
}

export function parseComponent(compDef: string | Record<string, unknown>): { type: string; props: Record<string, unknown> } | null {
    if (typeof compDef === 'string') {
        const normalizedName = typeAliases[compDef.toLowerCase()];
        return normalizedName ? { type: normalizedName, props: {} } : null;
    }
    
    if (typeof compDef === 'object' && compDef.type) {
        const normalizedName = typeAliases[String(compDef.type).toLowerCase()];
        if (!normalizedName) return null;
        
        const props = { ...compDef };
        delete props.type;
        return { type: normalizedName, props: props as Record<string, unknown> };
    }
    
    return null;
}

export default {
    components,
    typeAliases,
    getComponent,
    getComponentByCcType,
    createComponent,
    applyComponentProps,
    extractComponentProps,
    parseComponent
};
