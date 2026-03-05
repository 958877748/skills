interface ComponentProps {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    horizontalCenter?: number;
    verticalCenter?: number;
    isAbsLeft?: boolean;
    isAbsRight?: boolean;
    isAbsTop?: boolean;
    isAbsBottom?: boolean;
    alignMode?: number;
}
export interface WidgetComponent {
    [key: string]: any;
    __type__: string;
    _name: string;
    _objFlags: number;
    node: {
        __id__: number;
    };
    _enabled: boolean;
    alignMode: number;
    _target: null;
    _alignFlags: number;
    _left: number;
    _right: number;
    _top: number;
    _bottom: number;
    _verticalCenter: number;
    _horizontalCenter: number;
    _isAbsLeft: boolean;
    _isAbsRight: boolean;
    _isAbsTop: boolean;
    _isAbsBottom: boolean;
    _isAbsHorizontalCenter: boolean;
    _isAbsVerticalCenter: boolean;
    _originalWidth: number;
    _originalHeight: number;
    _id: string;
}
export declare function create(nodeId: number): WidgetComponent;
export declare function applyProps(comp: WidgetComponent, props: ComponentProps): void;
export declare function extractProps(comp: WidgetComponent): Record<string, unknown>;
declare const _default: {
    type: string;
    ccType: string;
    create: typeof create;
    applyProps: typeof applyProps;
    extractProps: typeof extractProps;
    PROP_MAP: Record<string, string>;
    ENUMS: {
        alignMode: string[];
    };
    ALIGN_FLAGS: Record<string, number>;
};
export default _default;
//# sourceMappingURL=widget.d.ts.map