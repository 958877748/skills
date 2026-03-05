interface ComponentProps {
    playOnLoad?: boolean;
    autoRemoveOnFinish?: boolean;
    totalParticles?: number;
    duration?: number;
    emissionRate?: number;
    life?: number;
    angle?: number;
    speed?: number;
}
export interface ParticleSystemComponent {
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
    _custom: boolean;
    _file: {
        __uuid__: string;
    };
    _spriteFrame: {
        __uuid__: string;
    };
    _texture: null;
    _stopped: boolean;
    playOnLoad: boolean;
    autoRemoveOnFinish: boolean;
    totalParticles: number;
    duration: number;
    emissionRate: number;
    life: number;
    lifeVar: number;
    _startColor: {
        __type__: string;
        r: number;
        g: number;
        b: number;
        a: number;
    };
    _startColorVar: {
        __type__: string;
        r: number;
        g: number;
        b: number;
        a: number;
    };
    _endColor: {
        __type__: string;
        r: number;
        g: number;
        b: number;
        a: number;
    };
    _endColorVar: {
        __type__: string;
        r: number;
        g: number;
        b: number;
        a: number;
    };
    angle: number;
    angleVar: number;
    startSize: number;
    startSizeVar: number;
    endSize: number;
    endSizeVar: number;
    startSpin: number;
    startSpinVar: number;
    endSpin: number;
    endSpinVar: number;
    sourcePos: {
        __type__: string;
        x: number;
        y: number;
    };
    posVar: {
        __type__: string;
        x: number;
        y: number;
    };
    _positionType: number;
    positionType: number;
    emitterMode: number;
    gravity: {
        __type__: string;
        x: number;
        y: number;
    };
    speed: number;
    speedVar: number;
    tangentialAccel: number;
    tangentialAccelVar: number;
    radialAccel: number;
    radialAccelVar: number;
    rotationIsDir: boolean;
    startRadius: number;
    startRadiusVar: number;
    endRadius: number;
    endRadiusVar: number;
    rotatePerS: number;
    rotatePerSVar: number;
    _N$preview: boolean;
    _id: string;
}
export declare function create(nodeId: number): ParticleSystemComponent;
export declare function applyProps(comp: ParticleSystemComponent, props: ComponentProps): void;
export declare function extractProps(comp: ParticleSystemComponent): Record<string, unknown>;
declare const _default: {
    type: string;
    ccType: string;
    create: typeof create;
    applyProps: typeof applyProps;
    extractProps: typeof extractProps;
    PROP_MAP: Record<string, string>;
};
export default _default;
//# sourceMappingURL=particle-system.d.ts.map