import { generateId, generateUUID, parseColorToCcColor, colorToHex } from './utils.js';

/**
 * 创建节点数据
 */
export function createNodeData(name: string): Record<string, any> {
    return {
        __type__: 'cc.Node',
        _name: name,
        _objFlags: 0,
        _parent: null,
        _children: [],
        _active: true,
        _components: [],
        _prefab: null,
        _opacity: 255,
        _color: { __type__: 'cc.Color', r: 255, g: 255, b: 255, a: 255 },
        _contentSize: { __type__: 'cc.Size', width: 100, height: 100 },
        _anchorPoint: { __type__: 'cc.Vec2', x: 0.5, y: 0.5 },
        _trs: {
            __type__: 'TypedArray',
            ctor: 'Float64Array',
            array: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
        },
        _eulerAngles: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
        _skewX: 0,
        _skewY: 0,
        _is3DNode: false,
        _groupIndex: 0,
        groupIndex: 0,
        _id: generateId()
    };
}

/**
 * 设置节点属性
 */
export function setNodeProperty(node: any, key: string, value: any): void {
    if (key === 'x') {
        node._trs.array[0] = parseFloat(value);
    } else if (key === 'y') {
        node._trs.array[1] = parseFloat(value);
    } else if (key === 'width') {
        node._contentSize.width = parseFloat(value);
    } else if (key === 'height') {
        node._contentSize.height = parseFloat(value);
    } else if (key === 'scaleX') {
        node._trs.array[7] = parseFloat(value);
    } else if (key === 'scaleY') {
        node._trs.array[8] = parseFloat(value);
    } else if (key === 'rotation') {
        node._trs.array[5] = parseFloat(value) * Math.PI / 180;
        node._eulerAngles.z = parseFloat(value);
    } else if (key === 'opacity') {
        node._opacity = parseInt(value);
    } else if (key === 'color') {
        const c = parseColorToCcColor(value);
        if (c) node._color = c;
    } else if (key === 'anchorX') {
        node._anchorPoint.x = parseFloat(value);
    } else if (key === 'anchorY') {
        node._anchorPoint.y = parseFloat(value);
    } else if (key === 'name') {
        node._name = value;
    } else if (key === 'active') {
        node._active = value === 'true' || value === true;
    }
}

/**
 * 批量设置节点属性
 */
export function setNodeProperties(node: any, props: Record<string, any>): void {
    for (const [key, value] of Object.entries(props)) {
        setNodeProperty(node, key, value);
    }
}

/**
 * 获取节点状态
 */
export function getNodeState(node: any): Record<string, any> {
    return {
        name: node._name,
        active: node._active,
        x: node._trs?.array?.[0] ?? 0,
        y: node._trs?.array?.[1] ?? 0,
        width: node._contentSize?.width ?? 100,
        height: node._contentSize?.height ?? 100,
        scaleX: node._trs?.array?.[7] ?? 1,
        scaleY: node._trs?.array?.[8] ?? 1,
        rotation: node._eulerAngles?.z ?? 0,
        opacity: node._opacity ?? 255,
        anchorX: node._anchorPoint?.x ?? 0.5,
        anchorY: node._anchorPoint?.y ?? 0.5
    };
}

/**
 * 收集节点及其子节点
 */
export function collectNodeAndChildren(node: any): any[] {
    const result = [node];
    if (node._children) {
        node._children.forEach((child: any) => {
            result.push(...collectNodeAndChildren(child));
        });
    }
    return result;
}

/**
 * 从父节点移除
 */
export function removeFromParent(node: any): boolean {
    if (!node._parent) return false;
    const idx = node._parent._children.indexOf(node);
    if (idx > -1) {
        node._parent._children.splice(idx, 1);
        node._parent = null;
        return true;
    }
    return false;
}

/**
 * 删除节点
 */
export function deleteNode(node: any): boolean {
    return removeFromParent(node);
}

/**
 * 构建树形结构
 */
export function buildTree(data: any[], scriptMap: Record<string, string>, startIndex: number): string {
    const root = data[startIndex];
    if (!root) return '';
    
    // 如果根节点是预制体，实际根节点在 data[1]
    if (root.__type__ === 'cc.Prefab') {
        const prefabNode = data[1];
        if (!prefabNode) return '';
        
        const prefabActive = prefabNode._active !== false ? '●' : '○';
        let result = prefabActive + ' ' + (prefabNode._name || 'Root');
        result += buildComponentInfo(data, prefabNode, scriptMap);
        result += '\n';
        
        // 处理子节点
        if (prefabNode._children && prefabNode._children.length > 0) {
            prefabNode._children.forEach((childRef: any, idx: number) => {
                const childIsLast = idx === prefabNode._children.length - 1;
                result += buildTreeNode(data, scriptMap, childRef.__id__, '', childIsLast, false);
            });
        }
        return result;
    }
    
    // 对于场景，根节点是场景节点
    const sceneRoot = root;
    if (sceneRoot.__type__ === 'cc.Scene') {
        let result = '[Scene]\n';
        
        // 处理子节点
        if (sceneRoot._children && sceneRoot._children.length > 0) {
            sceneRoot._children.forEach((childRef: any, idx: number) => {
                const childIsLast = idx === sceneRoot._children.length - 1;
                result += buildTreeNode(data, scriptMap, childRef.__id__, '', childIsLast, false);
            });
        }
        return result;
    }
    
    // 其他情况，直接构建节点树
    return buildTreeNode(data, scriptMap, startIndex, '', true, true);
}

/**
 * 构建组件信息字符串
 */
function buildComponentInfo(data: any[], node: any, scriptMap: Record<string, string>): string {
    if (!node._components || node._components.length === 0) return '';
    
    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    
    const comps = node._components.map((c: any) => {
        const comp = data[c.__id__];
        if (!comp) return '?';
        const typeName = comp.__type__;
        let displayName;
        if (uuidRegex.test(typeName)) {
            const scriptInfo = scriptMap[typeName];
            if (scriptInfo) {
                // scriptInfo 是字符串（脚本名称）
                displayName = scriptInfo;
            } else {
                displayName = '[MissingScript]';
            }
        } else if (typeName === 'MissingScript') {
            displayName = '[MissingScript]';
        } else {
            displayName = typeName.replace('cc.', '');
        }
        return displayName;
    }).join(', ');
    
    return ` (${comps})`;
}

/**
 * 构建节点树输出
 * @param data 场景数据
 * @param scriptMap 脚本映射
 * @param nodeIndex 节点索引
 * @param prefix 前缀
 * @param isLast 是否是最后一个子节点
 * @param isRoot 是否是根节点
 * @returns 树形字符串
 */
function buildTreeNode(data: any[], scriptMap: Record<string, string>, nodeIndex: number, prefix: string = '', isLast: boolean = true, isRoot: boolean = true): string {
    const node = data[nodeIndex];
    if (!node) return '';
    
    const nodeName = node._name || '(unnamed)';
    const active = node._active !== false ? '●' : '○';
    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    
    let result = '';
    
    const connector = isRoot ? '' : (isLast ? '└── ' : '├── ');
    result = prefix + connector + (isRoot ? '' : active + ' ') + nodeName;
    result += buildComponentInfo(data, node, scriptMap);
    result += '\n';
    
    // 处理子节点
    if (node._children && node._children.length > 0) {
        const childPrefix = prefix + (isRoot ? '' : (isLast ? '    ' : '│   '));
        node._children.forEach((childRef: any, idx: number) => {
            const childIsLast = idx === node._children.length - 1;
            result += buildTreeNode(data, scriptMap, childRef.__id__, childPrefix, childIsLast, false);
        });
    }
    
    return result;
}

/**
 * 检测项目类型
 */
export function detectItemType(item: any): string {
    if (!item) return 'unknown';
    if (item.__type__ === 'cc.Node') return 'node';
    if (item.__type__ === 'cc.Scene') return 'scene';
    if (item.__type__?.includes('cc.')) return 'component';
    return 'unknown';
}
