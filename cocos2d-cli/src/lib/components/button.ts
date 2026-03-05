import { generateId } from '../utils';

const BUTTON_NORMAL_SPRITE = { "__uuid__": "f0048c10-f03e-4c97-b9d3-3506e1d58952" };
const BUTTON_PRESSED_SPRITE = { "__uuid__": "e9ec654c-97a2-4787-9325-e6a10375219a" };
const BUTTON_DISABLED_SPRITE = { "__uuid__": "29158224-f8dd-4661-a796-1ffab537140e" };

interface ComponentProps {
    interactable?: boolean;
    transition?: number;
    zoomScale?: number;
    duration?: number;
    target?: { __id__: number };
}

export interface ButtonComponent {
    [key: string]: any;
    __type__: string;
    _name: string;
    _objFlags: number;
    node: { __id__: number };
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
    _N$normalColor: { __type__: string; r: number; g: number; b: number; a: number };
    _N$pressedColor: { __type__: string; r: number; g: number; b: number; a: number };
    pressedColor: { __type__: string; r: number; g: number; b: number; a: number };
    _N$hoverColor: { __type__: string; r: number; g: number; b: number; a: number };
    hoverColor: { __type__: string; r: number; g: number; b: number; a: number };
    _N$disabledColor: { __type__: string; r: number; g: number; b: number; a: number };
    _N$normalSprite: { __uuid__: string };
    _N$pressedSprite: { __uuid__: string };
    pressedSprite: { __uuid__: string };
    _N$hoverSprite: { __uuid__: string };
    hoverSprite: { __uuid__: string };
    _N$disabledSprite: { __uuid__: string };
    _N$target: null;
    _id: string;
}

const PROP_MAP: Record<string, string> = {
    'interactable': '_N$interactable',
    'transition': '_N$transition',
    'zoomScale': 'zoomScale',
    'duration': 'duration',
    'target': '_N$target'
};

const ENUMS = {
    transition: ['NONE', 'COLOR', 'SPRITE', 'SCALE']
};

export function create(nodeId: number): ButtonComponent {
    return {
        __type__: "cc.Button",
        _name: "",
        _objFlags: 0,
        node: { __id__: nodeId },
        _enabled: true,
        _normalMaterial: null,
        _grayMaterial: null,
        duration: 0.1,
        zoomScale: 1.2,
        clickEvents: [],
        _N$interactable: true,
        _N$enableAutoGrayEffect: false,
        _N$transition: 3,
        transition: 3,
        _N$normalColor: {
            __type__: "cc.Color",
            r: 255,
            g: 255,
            b: 255,
            a: 255
        },
        _N$pressedColor: {
            __type__: "cc.Color",
            r: 200,
            g: 200,
            b: 200,
            a: 255
        },
        pressedColor: {
            __type__: "cc.Color",
            r: 200,
            g: 200,
            b: 200,
            a: 255
        },
        _N$hoverColor: {
            __type__: "cc.Color",
            r: 255,
            g: 255,
            b: 255,
            a: 255
        },
        hoverColor: {
            __type__: "cc.Color",
            r: 255,
            g: 255,
            b: 255,
            a: 255
        },
        _N$disabledColor: {
            __type__: "cc.Color",
            r: 120,
            g: 120,
            b: 120,
            a: 200
        },
        _N$normalSprite: BUTTON_NORMAL_SPRITE,
        _N$pressedSprite: BUTTON_PRESSED_SPRITE,
        pressedSprite: BUTTON_PRESSED_SPRITE,
        _N$hoverSprite: BUTTON_NORMAL_SPRITE,
        hoverSprite: BUTTON_NORMAL_SPRITE,
        _N$disabledSprite: BUTTON_DISABLED_SPRITE,
        _N$target: null,
        _id: generateId()
    };
}

export function applyProps(comp: ButtonComponent, props: ComponentProps): void {
    if (!props) return;
    
    for (const [key, value] of Object.entries(props)) {
        const compKey = PROP_MAP[key];
        if (compKey) {
            (comp as Record<string, unknown>)[compKey] = value;
        }
    }
}

export function extractProps(comp: ButtonComponent): Record<string, unknown> {
    return {
        interactable: comp._N$interactable,
        transition: ENUMS.transition[comp._N$transition] || comp._N$transition,
        zoomScale: comp.zoomScale,
        duration: comp.duration
    } as any;
}

export default {
    type: 'button',
    ccType: 'cc.Button',
    create,
    applyProps,
    extractProps,
    PROP_MAP,
    ENUMS
};
