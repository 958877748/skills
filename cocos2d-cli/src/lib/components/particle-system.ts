import { generateId } from '../utils';

const DEFAULT_MATERIAL = { "__uuid__": "eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432" };
const PARTICLE_FILE = { "__uuid__": "b2687ac4-099e-403c-a192-ff477686f4f5" };
const PARTICLE_SPRITE = { "__uuid__": "472df5d3-35e7-4184-9e6c-7f41bee65ee3" };

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
    node: { __id__: number };
    _enabled: boolean;
    _materials: { __uuid__: string }[];
    _srcBlendFactor: number;
    _dstBlendFactor: number;
    _custom: boolean;
    _file: { __uuid__: string };
    _spriteFrame: { __uuid__: string };
    _texture: null;
    _stopped: boolean;
    playOnLoad: boolean;
    autoRemoveOnFinish: boolean;
    totalParticles: number;
    duration: number;
    emissionRate: number;
    life: number;
    lifeVar: number;
    _startColor: { __type__: string; r: number; g: number; b: number; a: number };
    _startColorVar: { __type__: string; r: number; g: number; b: number; a: number };
    _endColor: { __type__: string; r: number; g: number; b: number; a: number };
    _endColorVar: { __type__: string; r: number; g: number; b: number; a: number };
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
    sourcePos: { __type__: string; x: number; y: number };
    posVar: { __type__: string; x: number; y: number };
    _positionType: number;
    positionType: number;
    emitterMode: number;
    gravity: { __type__: string; x: number; y: number };
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

const PROP_MAP: Record<string, string> = {
    'playOnLoad': 'playOnLoad',
    'autoRemoveOnFinish': 'autoRemoveOnFinish',
    'totalParticles': 'totalParticles',
    'duration': 'duration',
    'emissionRate': 'emissionRate',
    'life': 'life',
    'angle': 'angle',
    'speed': 'speed'
};

export function create(nodeId: number): ParticleSystemComponent {
    return {
        __type__: "cc.ParticleSystem",
        _name: "",
        _objFlags: 0,
        node: { __id__: nodeId },
        _enabled: true,
        _materials: [DEFAULT_MATERIAL],
        _srcBlendFactor: 770,
        _dstBlendFactor: 1,
        _custom: false,
        _file: PARTICLE_FILE,
        _spriteFrame: PARTICLE_SPRITE,
        _texture: null,
        _stopped: true,
        playOnLoad: true,
        autoRemoveOnFinish: false,
        totalParticles: 200,
        duration: -1,
        emissionRate: 999.999985098839,
        life: 0.20000000298023224,
        lifeVar: 0.5,
        _startColor: {
            __type__: "cc.Color",
            r: 202,
            g: 200,
            b: 86,
            a: 163
        },
        _startColorVar: {
            __type__: "cc.Color",
            r: 229,
            g: 255,
            b: 173,
            a: 198
        },
        _endColor: {
            __type__: "cc.Color",
            r: 173,
            g: 161,
            b: 19,
            a: 214
        },
        _endColorVar: {
            __type__: "cc.Color",
            r: 107,
            g: 249,
            b: 249,
            a: 188
        },
        angle: 360,
        angleVar: 360,
        startSize: 3.369999885559082,
        startSizeVar: 50,
        endSize: 30.31999969482422,
        endSizeVar: 0,
        startSpin: -47.369998931884766,
        startSpinVar: 0,
        endSpin: -47.369998931884766,
        endSpinVar: -142.11000061035156,
        sourcePos: {
            __type__: "cc.Vec2",
            x: 0,
            y: 0
        },
        posVar: {
            __type__: "cc.Vec2",
            x: 7,
            y: 7
        },
        _positionType: 1,
        positionType: 1,
        emitterMode: 0,
        gravity: {
            __type__: "cc.Vec2",
            x: 0.25,
            y: 0.8600000143051147
        },
        speed: 0,
        speedVar: 190.7899932861328,
        tangentialAccel: -92.11000061035156,
        tangentialAccelVar: 65.79000091552734,
        radialAccel: -671.0499877929688,
        radialAccelVar: 65.79000091552734,
        rotationIsDir: false,
        startRadius: 0,
        startRadiusVar: 0,
        endRadius: 0,
        endRadiusVar: 0,
        rotatePerS: 0,
        rotatePerSVar: 0,
        _N$preview: true,
        _id: generateId()
    };
}

export function applyProps(comp: ParticleSystemComponent, props: ComponentProps): void {
    if (!props) return;
    
    for (const [key, value] of Object.entries(props)) {
        const compKey = PROP_MAP[key];
        if (compKey) {
            (comp as Record<string, unknown>)[compKey] = value;
        }
    }
}

export function extractProps(comp: ParticleSystemComponent): Record<string, unknown> {
    return {
        playOnLoad: comp.playOnLoad,
        totalParticles: comp.totalParticles,
        duration: comp.duration
    } as any;
}

export default {
    type: 'particleSystem',
    ccType: 'cc.ParticleSystem',
    create,
    applyProps,
    extractProps,
    PROP_MAP
};
