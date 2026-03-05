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
    node: {
        __id__: number;
    };
    _enabled: boolean;
    _cullingMask: number;
    _clearFlags: number;
    _backgroundColor: {
        __type__: string;
        r: number;
        g: number;
        b: number;
        a: number;
    };
    _depth: number;
    _zoomRatio: number;
    _targetTexture: null;
    _fov: number;
    _orthoSize: number;
    _nearClip: number;
    _farClip: number;
    _ortho: boolean;
    _rect: {
        __type__: string;
        x: number;
        y: number;
        width: number;
        height: number;
    };
    _renderStages: number;
    _alignWithScreen: boolean;
    _id: string;
}
export declare function create(nodeId: number): CameraComponent;
export declare function applyProps(comp: CameraComponent, props: ComponentProps): void;
export declare function extractProps(comp: CameraComponent): Record<string, unknown>;
declare const _default: {
    type: string;
    ccType: string;
    create: typeof create;
    applyProps: typeof applyProps;
    extractProps: typeof extractProps;
    PROP_MAP: Record<string, string>;
};
export default _default;
//# sourceMappingURL=camera.d.ts.map