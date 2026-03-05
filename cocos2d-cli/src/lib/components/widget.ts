import { generateId } from '../utils';

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
    node: { __id__: number };
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

const PROP_MAP: Record<string, string> = {
    'left': '_left',
    'right': '_right',
    'top': '_top',
    'bottom': '_bottom',
    'horizontalCenter': '_horizontalCenter',
    'verticalCenter': '_verticalCenter',
    'isAbsLeft': '_isAbsLeft',
    'isAbsRight': '_isAbsRight',
    'isAbsTop': '_isAbsTop',
    'isAbsBottom': '_isAbsBottom',
    'alignMode': 'alignMode'
};

const ALIGN_FLAGS: Record<string, number> = {
    top: 1,
    verticalCenter: 2,
    bottom: 4,
    left: 8,
    horizontalCenter: 16,
    right: 32
};

const ENUMS = {
    alignMode: ['ONCE', 'ON_WINDOW_RESIZE', 'ALWAYS']
};

export function create(nodeId: number): WidgetComponent {
    return {
        __type__: "cc.Widget",
        _name: "",
        _objFlags: 0,
        node: { __id__: nodeId },
        _enabled: true,
        alignMode: 1,
        _target: null,
        _alignFlags: 0,
        _left: 0,
        _right: 0,
        _top: 0,
        _bottom: 0,
        _verticalCenter: 0,
        _horizontalCenter: 0,
        _isAbsLeft: true,
        _isAbsRight: true,
        _isAbsTop: true,
        _isAbsBottom: true,
        _isAbsHorizontalCenter: true,
        _isAbsVerticalCenter: true,
        _originalWidth: 0,
        _originalHeight: 0,
        _id: generateId()
    };
}

export function applyProps(comp: WidgetComponent, props: ComponentProps): void {
    if (!props) return;
    
    let alignFlags = 0;
    for (const dir of ['top', 'bottom', 'left', 'right', 'horizontalCenter', 'verticalCenter']) {
        if ((props as Record<string, unknown>)[dir] !== undefined && (props as Record<string, unknown>)[dir] !== null) {
            alignFlags |= ALIGN_FLAGS[dir];
        }
    }
    if (alignFlags > 0) {
        comp._alignFlags = alignFlags;
    }
    
    for (const [key, value] of Object.entries(props)) {
        const compKey = PROP_MAP[key];
        if (compKey) {
            (comp as Record<string, unknown>)[compKey] = value;
        }
    }
}

export function extractProps(comp: WidgetComponent): Record<string, unknown> {
    return {
        alignMode: ENUMS.alignMode[comp.alignMode] || comp.alignMode,
        left: comp._left,
        right: comp._right,
        top: comp._top,
        bottom: comp._bottom
    } as any;
}

export default {
    type: 'widget',
    ccType: 'cc.Widget',
    create,
    applyProps,
    extractProps,
    PROP_MAP,
    ENUMS,
    ALIGN_FLAGS
};
