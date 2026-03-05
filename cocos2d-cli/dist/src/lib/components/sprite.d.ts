interface ComponentProps {
    sizeMode?: number;
    fillType?: number;
    fillCenter?: number[];
    fillStart?: number;
    fillRange?: number;
    trim?: boolean;
    spriteFrame?: string;
    type?: number;
}
export interface SpriteComponent {
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
    _spriteFrame: {
        __uuid__: string;
    };
    _type: number;
    _sizeMode: number;
    _fillType: number;
    _fillCenter: {
        __type__: string;
        x: number;
        y: number;
    };
    _fillStart: number;
    _fillRange: number;
    _isTrimmedMode: boolean;
    _atlas: null;
    _id: string;
}
export declare function create(nodeId: number): SpriteComponent;
export declare function applyProps(comp: SpriteComponent, props: ComponentProps): void;
export declare function extractProps(comp: SpriteComponent): Record<string, unknown>;
declare const _default: {
    type: string;
    ccType: string;
    create: typeof create;
    applyProps: typeof applyProps;
    extractProps: typeof extractProps;
    PROP_MAP: Record<string, string>;
    ENUMS: {
        sizeMode: string[];
        spriteType: string[];
    };
};
export default _default;
//# sourceMappingURL=sprite.d.ts.map