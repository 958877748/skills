import { generateId } from '../utils';

interface ComponentProps {
    layoutType?: number;
    cellSize?: number[];
    startAxis?: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    spacingX?: number;
    spacingY?: number;
    resize?: number;
}

export interface LayoutComponent {
    [key: string]: any;
    __type__: string;
    _name: string;
    _objFlags: number;
    node: { __id__: number };
    _enabled: boolean;
    _layoutSize: { __type__: string; width: number; height: number };
    _resize: number;
    _N$layoutType: number;
    _N$cellSize: { __type__: string; width: number; height: number };
    _N$startAxis: number;
    _N$paddingLeft: number;
    _N$paddingRight: number;
    _N$paddingTop: number;
    _N$paddingBottom: number;
    _N$spacingX: number;
    _N$spacingY: number;
    _N$verticalDirection: number;
    _N$horizontalDirection: number;
    _N$affectedByScale: boolean;
    _id: string;
}

const PROP_MAP: Record<string, string> = {
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

const ENUMS = {
    layoutType: ['NONE', 'HORIZONTAL', 'VERTICAL', 'GRID']
};

export function create(nodeId: number): LayoutComponent {
    return {
        __type__: "cc.Layout",
        _name: "",
        _objFlags: 0,
        node: { __id__: nodeId },
        _enabled: true,
        _layoutSize: {
            __type__: "cc.Size",
            width: 200,
            height: 150
        },
        _resize: 1,
        _N$layoutType: 2,
        _N$cellSize: {
            __type__: "cc.Size",
            width: 40,
            height: 40
        },
        _N$startAxis: 0,
        _N$paddingLeft: 0,
        _N$paddingRight: 0,
        _N$paddingTop: 0,
        _N$paddingBottom: 0,
        _N$spacingX: 0,
        _N$spacingY: 0,
        _N$verticalDirection: 1,
        _N$horizontalDirection: 0,
        _N$affectedByScale: false,
        _id: generateId()
    };
}

export function applyProps(comp: LayoutComponent, props: ComponentProps): void {
    if (!props) return;
    
    for (const [key, value] of Object.entries(props)) {
        const compKey = PROP_MAP[key];
        if (compKey) {
            if (key === 'cellSize' && Array.isArray(value)) {
                (comp as Record<string, unknown>)[compKey] = { __type__: "cc.Size", width: value[0], height: value[1] };
            } else {
                (comp as Record<string, unknown>)[compKey] = value;
            }
        }
    }
}

export function extractProps(comp: LayoutComponent): Record<string, unknown> {
    return {
        layoutType: ENUMS.layoutType[comp._N$layoutType] || comp._N$layoutType,
        spacingX: comp._N$spacingX,
        spacingY: comp._N$spacingY,
        paddingLeft: comp._N$paddingLeft,
        paddingRight: comp._N$paddingRight,
        paddingTop: comp._N$paddingTop,
        paddingBottom: comp._N$paddingBottom
    } as any;
}

export default {
    type: 'layout',
    ccType: 'cc.Layout',
    create,
    applyProps,
    extractProps,
    PROP_MAP,
    ENUMS
};
