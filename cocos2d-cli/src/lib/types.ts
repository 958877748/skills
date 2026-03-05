export interface ColorObject {
    __type__: string;
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface SizeObject {
    __type__: string;
    width: number;
    height: number;
}

export interface Vec2Object {
    __type__: string;
    x: number;
    y: number;
}

export interface Vec3Object {
    __type__: string;
    x: number;
    y: number;
    z: number;
}

export interface TypedArrayObject {
    __type__: string;
    ctor: string;
    array: number[];
}

export interface NodeReference {
    __id__: number;
}

export interface ComponentReference {
    __id__: number;
}

export interface NodeData {
    [key: string]: any;
    __type__: string;
    _name?: string;
    _objFlags?: number;
    _parent?: NodeReference;
    _children?: NodeReference[];
    _active?: boolean;
    _components?: ComponentReference[];
    _prefab?: any;
    _opacity?: number;
    _color?: ColorObject;
    _contentSize?: SizeObject;
    _anchorPoint?: Vec2Object;
    _trs?: TypedArrayObject;
    _eulerAngles?: Vec3Object;
    _skewX?: number;
    _skewY?: number;
    _is3DNode?: boolean;
    _groupIndex?: number;
    groupIndex?: number;
    _id?: string;
    node?: NodeReference;
}

export interface SceneData extends Array<NodeData> {
    [index: number]: NodeData;
}

export interface IndexInfo {
    _id: string | null;
    name: string;
    path: string;
    type: string;
}

export interface MapResult {
    idMap: Record<number, number>;
    indexMap: Record<number, IndexInfo>;
    prefab: boolean;
}

export interface NodeOptions {
    active?: boolean;
    opacity?: number;
    color?: string;
    width?: number;
    height?: number;
    anchorX?: number;
    anchorY?: number;
    x?: number;
    y?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    group?: number;
    _prefab?: any;
}

export interface DeleteResult {
    error?: string;
    success?: boolean;
    nodeName?: string;
    nodeIndex?: number;
    deletedCount?: number;
}

export interface NodeState {
    name: string;
    active: boolean;
    position: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
    anchor: { x: number; y: number };
    size: { w: number; h: number };
    color: string;
    opacity: number;
    group: number;
    children?: string[];
    components?: any[];
}

export interface ScriptInfo {
    name?: string;
    type?: string;
}

export interface OptionsObject {
    [key: string]: string;
}

export interface OutputData {
    error?: string;
    success?: boolean;
    [key: string]: any;
}
