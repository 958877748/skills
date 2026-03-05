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
    node: {
        __id__: number;
    };
    _enabled: boolean;
    _designResolution: {
        __type__: string;
        width: number;
        height: number;
    };
    _fitWidth: boolean;
    _fitHeight: boolean;
    _id: string;
}
export declare function create(nodeId: number): CanvasComponent;
export declare function applyProps(comp: CanvasComponent, props: ComponentProps): void;
export declare function extractProps(comp: CanvasComponent): Record<string, unknown>;
declare const _default: {
    type: string;
    ccType: string;
    create: typeof create;
    applyProps: typeof applyProps;
    extractProps: typeof extractProps;
    PROP_MAP: Record<string, string>;
};
export default _default;
//# sourceMappingURL=canvas.d.ts.map