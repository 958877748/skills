import { generateId, parseColorToCcColor } from '../utils';

interface ComponentProps {
    depth?: number;
    zoomRatio?: number;
    ortho?: boolean;
    orthoSize?: number;
    cullingMask?: number;
    backgroundColor?: string;
    fov?: number;
    nearClip?: number;
    farClip?: number;
}

export interface CameraComponent {
    [key: string]: any;
    __type__: string;
    _name: string;
    _objFlags: number;
    node: { __id__: number };
    _enabled: boolean;
    _cullingMask: number;
    _clearFlags: number;
    _backgroundColor: { __type__: string; r: number; g: number; b: number; a: number };
    _depth: number;
    _zoomRatio: number;
    _targetTexture: null;
    _fov: number;
    _orthoSize: number;
    _nearClip: number;
    _farClip: number;
    _ortho: boolean;
    _rect: { __type__: string; x: number; y: number; width: number; height: number };
    _renderStages: number;
    _alignWithScreen: boolean;
    _id: string;
}

const PROP_MAP: Record<string, string> = {
    'depth': '_depth',
    'zoomRatio': '_zoomRatio',
    'ortho': '_ortho',
    'orthoSize': '_orthoSize',
    'cullingMask': '_cullingMask',
    'backgroundColor': '_backgroundColor',
    'fov': '_fov',
    'nearClip': '_nearClip',
    'farClip': '_farClip'
};

export function create(nodeId: number): CameraComponent {
    return {
        __type__: "cc.Camera",
        _name: "",
        _objFlags: 0,
        node: { __id__: nodeId },
        _enabled: true,
        _cullingMask: 4294967295,
        _clearFlags: 7,
        _backgroundColor: {
            __type__: "cc.Color",
            r: 0,
            g: 0,
            b: 0,
            a: 255
        },
        _depth: -1,
        _zoomRatio: 1,
        _targetTexture: null,
        _fov: 60,
        _orthoSize: 10,
        _nearClip: 1,
        _farClip: 4096,
        _ortho: true,
        _rect: {
            __type__: "cc.Rect",
            x: 0,
            y: 0,
            width: 1,
            height: 1
        },
        _renderStages: 1,
        _alignWithScreen: true,
        _id: generateId()
    };
}

export function applyProps(comp: CameraComponent, props: ComponentProps): void {
    if (!props) return;
    
    for (const [key, value] of Object.entries(props)) {
        const compKey = PROP_MAP[key];
        if (compKey) {
            if (key === 'backgroundColor' && typeof value === 'string') {
                const ccColor = parseColorToCcColor(value);
                if (ccColor) {
                    (comp as Record<string, unknown>)[compKey] = ccColor;
                }
            } else {
                (comp as Record<string, unknown>)[compKey] = value;
            }
        }
    }
}

export function extractProps(comp: CameraComponent): Record<string, unknown> {
    return {
        depth: comp._depth,
        zoomRatio: comp._zoomRatio,
        ortho: comp._ortho,
        cullingMask: comp._cullingMask
    } as any;
}

export default {
    type: 'camera',
    ccType: 'cc.Camera',
    create,
    applyProps,
    extractProps,
    PROP_MAP
};
