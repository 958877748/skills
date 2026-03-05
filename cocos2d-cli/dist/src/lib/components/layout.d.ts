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
    node: {
        __id__: number;
    };
    _enabled: boolean;
    _layoutSize: {
        __type__: string;
        width: number;
        height: number;
    };
    _resize: number;
    _N$layoutType: number;
    _N$cellSize: {
        __type__: string;
        width: number;
        height: number;
    };
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
export declare function create(nodeId: number): LayoutComponent;
export declare function applyProps(comp: LayoutComponent, props: ComponentProps): void;
export declare function extractProps(comp: LayoutComponent): Record<string, unknown>;
declare const _default: {
    type: string;
    ccType: string;
    create: typeof create;
    applyProps: typeof applyProps;
    extractProps: typeof extractProps;
    PROP_MAP: Record<string, string>;
    ENUMS: {
        layoutType: string[];
    };
};
export default _default;
//# sourceMappingURL=layout.d.ts.map