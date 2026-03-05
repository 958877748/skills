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
    node: {
        __id__: number;
    };
    _enabled: boolean;
    _materials: {
        __uuid__: string;
    }[];
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
export declare function create(nodeId: number): LabelComponent;
export declare function applyProps(comp: LabelComponent, props: ComponentProps, node?: Record<string, unknown>): void;
export declare function extractProps(comp: LabelComponent): Record<string, unknown>;
declare const _default: {
    type: string;
    ccType: string;
    create: typeof create;
    applyProps: typeof applyProps;
    extractProps: typeof extractProps;
    PROP_MAP: Record<string, string>;
    ENUMS: {
        horizontalAlign: string[];
        verticalAlign: string[];
        overflow: string[];
    };
};
export default _default;
//# sourceMappingURL=label.d.ts.map