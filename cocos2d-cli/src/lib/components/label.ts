import { generateId, parseColorToCcColor } from '../utils';

const DEFAULT_MATERIAL = { "__uuid__": "eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432" };

interface ComponentProps {
    string?: string;
    fontSize?: number;
    lineHeight?: number;
    horizontalAlign?: number;
    verticalAlign?: number;
    overflow?: number;
    fontFamily?: string;
    wrap?: boolean;
    color?: string;
}

export interface LabelComponent {
    [key: string]: any;
    __type__: string;
    _name: string;
    _objFlags: number;
    node: { __id__: number };
    _enabled: boolean;
    _materials: { __uuid__: string }[];
    _srcBlendFactor: number;
    _dstBlendFactor: number;
    _string: string;
    _N$string: string;
    _fontSize: number;
    _lineHeight: number;
    _enableWrapText: boolean;
    _N$file: null;
    _isSystemFontUsed: boolean;
    _spacingX: number;
    _batchAsBitmap: boolean;
    _styleFlags: number;
    _underlineHeight: number;
    _N$horizontalAlign: number;
    _N$verticalAlign: number;
    _N$fontFamily: string;
    _N$overflow: number;
    _N$cacheMode: number;
    _id: string;
}

const PROP_MAP: Record<string, string> = {
    'string': '_string',
    'fontSize': '_fontSize',
    'lineHeight': '_lineHeight',
    'horizontalAlign': '_N$horizontalAlign',
    'verticalAlign': '_N$verticalAlign',
    'overflow': '_N$overflow',
    'fontFamily': '_N$fontFamily',
    'wrap': '_enableWrapText',
    'color': '_color'
};

const ENUMS = {
    horizontalAlign: ['LEFT', 'CENTER', 'RIGHT'],
    verticalAlign: ['TOP', 'CENTER', 'BOTTOM'],
    overflow: ['NONE', 'CLAMP', 'SHRINK', 'RESIZE_HEIGHT']
};

export function create(nodeId: number): LabelComponent {
    return {
        __type__: "cc.Label",
        _name: "",
        _objFlags: 0,
        node: { __id__: nodeId },
        _enabled: true,
        _materials: [DEFAULT_MATERIAL],
        _srcBlendFactor: 770,
        _dstBlendFactor: 771,
        _string: "Label",
        _N$string: "Label",
        _fontSize: 40,
        _lineHeight: 40,
        _enableWrapText: true,
        _N$file: null,
        _isSystemFontUsed: true,
        _spacingX: 0,
        _batchAsBitmap: false,
        _styleFlags: 0,
        _underlineHeight: 0,
        _N$horizontalAlign: 1,
        _N$verticalAlign: 1,
        _N$fontFamily: "Arial",
        _N$overflow: 0,
        _N$cacheMode: 0,
        _id: generateId()
    };
}

export function applyProps(comp: LabelComponent, props: ComponentProps, node?: Record<string, unknown>): void {
    if (!props) return;
    
    if (props.color && node) {
        const ccColor = parseColorToCcColor(props.color);
        if (ccColor) {
            (node as Record<string, unknown>)._color = ccColor;
        }
        delete props.color;
    }
    
    for (const [key, value] of Object.entries(props)) {
        const compKey = PROP_MAP[key];
        if (compKey) {
            (comp as Record<string, unknown>)[compKey] = value;
            if (key === 'string') {
                comp._N$string = value as string;
            }
        }
    }
}

export function extractProps(comp: LabelComponent): Record<string, unknown> {
    return {
        string: comp._string,
        fontSize: comp._fontSize,
        lineHeight: comp._lineHeight,
        horizontalAlign: ENUMS.horizontalAlign[comp._N$horizontalAlign] || comp._N$horizontalAlign,
        verticalAlign: ENUMS.verticalAlign[comp._N$verticalAlign] || comp._N$verticalAlign,
        overflow: ENUMS.overflow[comp._N$overflow] || comp._N$overflow,
        fontFamily: comp._N$fontFamily,
        enableWrapText: comp._enableWrapText
    } as any;
}

export default {
    type: 'label',
    ccType: 'cc.Label',
    create,
    applyProps,
    extractProps,
    PROP_MAP,
    ENUMS
};
