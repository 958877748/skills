interface ComponentProps {
    interactable?: boolean;
    transition?: number;
    zoomScale?: number;
    duration?: number;
    target?: {
        __id__: number;
    };
}
export interface ButtonComponent {
    [key: string]: any;
    __type__: string;
    _name: string;
    _objFlags: number;
    node: {
        __id__: number;
    };
    _enabled: boolean;
    _normalMaterial: null;
    _grayMaterial: null;
    duration: number;
    zoomScale: number;
    clickEvents: unknown[];
    _N$interactable: boolean;
    _N$enableAutoGrayEffect: boolean;
    _N$transition: number;
    transition: number;
    _N$normalColor: {
        __type__: string;
        r: number;
        g: number;
        b: number;
        a: number;
    };
    _N$pressedColor: {
        __type__: string;
        r: number;
        g: number;
        b: number;
        a: number;
    };
    pressedColor: {
        __type__: string;
        r: number;
        g: number;
        b: number;
        a: number;
    };
    _N$hoverColor: {
        __type__: string;
        r: number;
        g: number;
        b: number;
        a: number;
    };
    hoverColor: {
        __type__: string;
        r: number;
        g: number;
        b: number;
        a: number;
    };
    _N$disabledColor: {
        __type__: string;
        r: number;
        g: number;
        b: number;
        a: number;
    };
    _N$normalSprite: {
        __uuid__: string;
    };
    _N$pressedSprite: {
        __uuid__: string;
    };
    pressedSprite: {
        __uuid__: string;
    };
    _N$hoverSprite: {
        __uuid__: string;
    };
    hoverSprite: {
        __uuid__: string;
    };
    _N$disabledSprite: {
        __uuid__: string;
    };
    _N$target: null;
    _id: string;
}
export declare function create(nodeId: number): ButtonComponent;
export declare function applyProps(comp: ButtonComponent, props: ComponentProps): void;
export declare function extractProps(comp: ButtonComponent): Record<string, unknown>;
declare const _default: {
    type: string;
    ccType: string;
    create: typeof create;
    applyProps: typeof applyProps;
    extractProps: typeof extractProps;
    PROP_MAP: Record<string, string>;
    ENUMS: {
        transition: string[];
    };
};
export default _default;
//# sourceMappingURL=button.d.ts.map