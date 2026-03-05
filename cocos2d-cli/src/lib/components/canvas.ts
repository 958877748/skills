import { generateId } from '../utils';

interface ComponentProps {
    designResolution?: number[];
    fitWidth?: boolean;
    fitHeight?: boolean;
}

export interface CanvasComponent {
    [key: string]: any;
    __type__: string;
    _name: string;
    _objFlags: number;
    node: { __id__: number };
    _enabled: boolean;
    _designResolution: { __type__: string; width: number; height: number };
    _fitWidth: boolean;
    _fitHeight: boolean;
    _id: string;
}

const PROP_MAP: Record<string, string> = {
    'designResolution': '_designResolution',
    'fitWidth': '_fitWidth',
    'fitHeight': '_fitHeight'
};

export function create(nodeId: number): CanvasComponent {
    return {
        __type__: "cc.Canvas",
        _name: "",
        _objFlags: 0,
        node: { __id__: nodeId },
        _enabled: true,
        _designResolution: {
            __type__: "cc.Size",
            width: 960,
            height: 640
        },
        _fitWidth: false,
        _fitHeight: true,
        _id: generateId()
    };
}

export function applyProps(comp: CanvasComponent, props: ComponentProps): void {
    if (!props) return;
    
    for (const [key, value] of Object.entries(props)) {
        const compKey = PROP_MAP[key];
        if (compKey) {
            if (key === 'designResolution' && Array.isArray(value)) {
                (comp as Record<string, unknown>)[compKey] = { __type__: "cc.Size", width: value[0], height: value[1] };
            } else {
                (comp as Record<string, unknown>)[compKey] = value;
            }
        }
    }
}

export function extractProps(comp: CanvasComponent): Record<string, unknown> {
    const clean = (obj: unknown): unknown => {
        if (!obj || typeof obj !== 'object') return obj;
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
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
    } as any;
}

export default {
    type: 'canvas',
    ccType: 'cc.Canvas',
    create,
    applyProps,
    extractProps,
    PROP_MAP
};
