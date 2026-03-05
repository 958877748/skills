"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodeData = createNodeData;
exports.setNodeProperty = setNodeProperty;
exports.setNodeProperties = setNodeProperties;
exports.getNodeState = getNodeState;
exports.collectNodeAndChildren = collectNodeAndChildren;
exports.removeFromParent = removeFromParent;
exports.deleteNode = deleteNode;
exports.buildTree = buildTree;
exports.detectItemType = detectItemType;
const utils_1 = require("./utils");
const components_1 = require("./components");
function createNodeData(name, parentId, options = {}) {
    return {
        __type__: "cc.Node",
        _name: name,
        _objFlags: 0,
        _parent: { __id__: parentId },
        _children: [],
        _active: options.active !== false,
        _components: [],
        _prefab: options._prefab || null,
        _opacity: options.opacity !== undefined ? options.opacity : 255,
        _color: (0, utils_1.parseColorToCcColor)(options.color || '') || {
            __type__: "cc.Color",
            r: 255, g: 255, b: 255, a: 255
        },
        _contentSize: {
            __type__: "cc.Size",
            width: options.width || 0,
            height: options.height || 0
        },
        _anchorPoint: {
            __type__: "cc.Vec2",
            x: options.anchorX !== undefined ? options.anchorX : 0.5,
            y: options.anchorY !== undefined ? options.anchorY : 0.5
        },
        _trs: {
            __type__: "TypedArray",
            ctor: "Float64Array",
            array: [
                options.x || 0,
                options.y || 0,
                0, 0, 0,
                (options.rotation || 0) * Math.PI / 180,
                1,
                options.scaleX !== undefined ? options.scaleX : 1,
                options.scaleY !== undefined ? options.scaleY : 1,
                1
            ]
        },
        _eulerAngles: {
            __type__: "cc.Vec3",
            x: 0, y: 0,
            z: options.rotation || 0
        },
        _skewX: 0,
        _skewY: 0,
        _is3DNode: false,
        _groupIndex: options.group || 0,
        groupIndex: options.group || 0,
        _id: (0, utils_1.generateUUID)()
    };
}
function setNodeProperty(node, key, value) {
    switch (key) {
        case 'name':
            node._name = value;
            break;
        case 'active':
            node._active = value !== 'false' && value !== '0' && value !== '';
            break;
        case 'x':
        case 'y':
            if (!node._trs) {
                node._trs = { __type__: "TypedArray", ctor: "Float64Array", array: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] };
            }
            node._trs.array[key === 'x' ? 0 : 1] = parseFloat(value);
            break;
        case 'width':
        case 'height':
            if (!node._contentSize) {
                node._contentSize = { __type__: "cc.Size", width: 0, height: 0 };
            }
            node._contentSize[key] = parseFloat(value);
            break;
        case 'anchorX':
        case 'anchorY':
            if (!node._anchorPoint) {
                node._anchorPoint = { __type__: "cc.Vec2", x: 0.5, y: 0.5 };
            }
            node._anchorPoint[key === 'anchorX' ? 'x' : 'y'] = parseFloat(value);
            break;
        case 'opacity':
            node._opacity = Math.max(0, Math.min(255, parseInt(value)));
            break;
        case 'color':
            const color = (0, utils_1.parseColorToCcColor)(value);
            if (color)
                node._color = color;
            break;
        case 'rotation':
            if (!node._eulerAngles) {
                node._eulerAngles = { __type__: "cc.Vec3", x: 0, y: 0, z: 0 };
            }
            node._eulerAngles.z = parseFloat(value);
            break;
        case 'scaleX':
        case 'scaleY':
            if (!node._trs) {
                node._trs = { __type__: "TypedArray", ctor: "Float64Array", array: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] };
            }
            node._trs.array[key === 'scaleX' ? 7 : 8] = parseFloat(value);
            break;
        case 'group':
            node._groupIndex = parseInt(value);
            node.groupIndex = node._groupIndex;
            break;
    }
}
function setNodeProperties(node, options) {
    if (!options)
        return;
    for (const [key, value] of Object.entries(options)) {
        setNodeProperty(node, key, value);
    }
}
function getNodeState(data, node, nodeIndex) {
    const trs = node._trs?.array || [0, 0, 0, 0, 0, 0, 1, 1, 1, 1];
    const components = (node._components || []).map(ref => (0, components_1.extractComponentProps)(data[ref.__id__]));
    const children = (node._children || []).map(ref => data[ref.__id__]?._name || '(unknown)');
    const result = {
        name: node._name || '',
        active: node._active !== false,
        position: { x: trs[0], y: trs[1] },
        rotation: node._eulerAngles?.z ?? 0,
        scale: { x: trs[7], y: trs[8] },
        anchor: { x: node._anchorPoint?.x ?? 0.5, y: node._anchorPoint?.y ?? 0.5 },
        size: { w: node._contentSize?.width ?? 0, h: node._contentSize?.height ?? 0 },
        color: (0, utils_1.colorToHex)(node._color),
        opacity: node._opacity ?? 255,
        group: node._groupIndex ?? 0
    };
    if (children.length > 0)
        result.children = children;
    if (components.length > 0)
        result.components = components;
    return result;
}
function collectNodeAndChildren(data, nodeIndex, collected = new Set()) {
    if (collected.has(nodeIndex))
        return collected;
    const node = data[nodeIndex];
    if (!node)
        return collected;
    collected.add(nodeIndex);
    if (node._components) {
        for (const compRef of node._components) {
            collected.add(compRef.__id__);
        }
    }
    if (node._children) {
        for (const childRef of node._children) {
            collectNodeAndChildren(data, childRef.__id__, collected);
        }
    }
    return collected;
}
function removeFromParent(data, node, nodeIndex) {
    if (node._parent) {
        const parentIndex = node._parent.__id__;
        const parent = data[parentIndex];
        if (parent && parent._children) {
            parent._children = parent._children.filter(c => c.__id__ !== nodeIndex);
        }
    }
}
function deleteNode(data, nodeIndex, rebuildReferencesFn) {
    if (nodeIndex <= 1) {
        return { error: '不能删除根节点' };
    }
    const node = data[nodeIndex];
    if (!node) {
        return { error: `节点索引 ${nodeIndex} 不存在` };
    }
    const nodeName = node._name || '(unnamed)';
    const indicesToDelete = collectNodeAndChildren(data, nodeIndex);
    removeFromParent(data, node, nodeIndex);
    rebuildReferencesFn(data, indicesToDelete);
    const sortedIndices = Array.from(indicesToDelete).sort((a, b) => b - a);
    for (const idx of sortedIndices) {
        data.splice(idx, 1);
    }
    return {
        success: true,
        nodeName,
        nodeIndex,
        deletedCount: sortedIndices.length
    };
}
function buildTree(data, scriptMap, nodeIndex, prefix = '', isLast = true, isRoot = true) {
    const node = data[nodeIndex];
    if (!node)
        return '';
    const isSceneRoot = node.__type__ === 'cc.Scene';
    const nodeName = isRoot ? 'Root' : (node._name || '(unnamed)');
    const active = node._active !== false ? '●' : '○';
    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    let result = '';
    if (isSceneRoot) {
        result = prefix + '[Scene]\n';
    }
    else {
        result = prefix + (isRoot ? '' : active + ' ') + nodeName + ' #' + nodeIndex;
        if (node._components && node._components.length > 0) {
            const comps = node._components.map(c => {
                const comp = data[c.__id__];
                if (!comp)
                    return `? #${c.__id__}`;
                const typeName = comp.__type__;
                let displayName;
                if (uuidRegex.test(typeName)) {
                    const scriptInfo = scriptMap[typeName];
                    displayName = (scriptInfo && scriptInfo.name) ? scriptInfo.name : '[MissingScript]';
                }
                else if (typeName === 'MissingScript') {
                    displayName = '[MissingScript]';
                }
                else {
                    displayName = typeName.replace('cc.', '');
                }
                return `${displayName} #${c.__id__}`;
            }).join(', ');
            result += ` (${comps})`;
        }
        result += '\n';
    }
    if (node._children && node._children.length > 0) {
        node._children.forEach((childRef, idx) => {
            const childIsLast = idx === node._children.length - 1;
            const childPrefix = prefix + (isSceneRoot ? '' : (isRoot ? '' : (isLast ? '    ' : '│   ')));
            result += buildTree(data, scriptMap, childRef.__id__, childPrefix, childIsLast, isSceneRoot);
        });
    }
    return result;
}
function detectItemType(data, index) {
    const item = data[index];
    if (!item)
        return null;
    if (item.node !== undefined) {
        return 'component';
    }
    const itemType = item.__type__;
    if (itemType === 'cc.Node' || itemType === 'cc.Scene' || item._name !== undefined) {
        return 'node';
    }
    return 'component';
}
//# sourceMappingURL=node-utils.js.map