/**
 * 节点工具模块
 * 提供节点创建、属性设置、删除等功能
 */

const { generateId, generateUUID, parseColorToCcColor, colorToHex } = require('./utils');

/**
 * 创建节点数据
 * @param {string} name - 节点名称
 * @param {number} parentId - 父节点索引
 * @param {object} options - 可选参数
 * @returns {object} 节点数据
 */
function createNodeData(name, parentId, options = {}) {
    return {
        "__type__": "cc.Node",
        "_name": name,
        "_objFlags": 0,
        "_parent": { "__id__": parentId },
        "_children": [],
        "_active": options.active !== false,
        "_components": [],
        "_prefab": options._prefab || null,
        "_opacity": options.opacity !== undefined ? options.opacity : 255,
        "_color": parseColorToCcColor(options.color) || { 
            "__type__": "cc.Color", 
            "r": 255, "g": 255, "b": 255, "a": 255 
        },
        "_contentSize": {
            "__type__": "cc.Size",
            "width": options.width || 0,
            "height": options.height || 0
        },
        "_anchorPoint": {
            "__type__": "cc.Vec2",
            "x": options.anchorX !== undefined ? options.anchorX : 0.5,
            "y": options.anchorY !== undefined ? options.anchorY : 0.5
        },
        "_trs": {
            "__type__": "TypedArray",
            "ctor": "Float64Array",
            "array": [
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
        "_eulerAngles": {
            "__type__": "cc.Vec3",
            "x": 0, "y": 0,
            "z": options.rotation || 0
        },
        "_skewX": 0,
        "_skewY": 0,
        "_is3DNode": false,
        "_groupIndex": options.group || 0,
        "groupIndex": options.group || 0,
        "_id": generateUUID()
    };
}

/**
 * 设置节点属性
 * @param {object} node - 节点对象
 * @param {string} key - 属性名
 * @param {*} value - 属性值
 */
function setNodeProperty(node, key, value) {
    switch (key) {
        case 'name':
            node._name = value;
            break;
        case 'active':
            node._active = value !== 'false' && value !== false;
            break;
        case 'x':
        case 'y':
            if (!node._trs) {
                node._trs = { "__type__": "TypedArray", "ctor": "Float64Array", "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] };
            }
            node._trs.array[key === 'x' ? 0 : 1] = parseFloat(value);
            break;
        case 'width':
        case 'height':
            if (!node._contentSize) {
                node._contentSize = { "__type__": "cc.Size", "width": 0, "height": 0 };
            }
            node._contentSize[key] = parseFloat(value);
            break;
        case 'anchorX':
        case 'anchorY':
            if (!node._anchorPoint) {
                node._anchorPoint = { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 };
            }
            node._anchorPoint[key === 'anchorX' ? 'x' : 'y'] = parseFloat(value);
            break;
        case 'opacity':
            node._opacity = Math.max(0, Math.min(255, parseInt(value)));
            break;
        case 'color':
            const color = parseColorToCcColor(value);
            if (color) node._color = color;
            break;
        case 'rotation':
            if (!node._eulerAngles) {
                node._eulerAngles = { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 };
            }
            node._eulerAngles.z = parseFloat(value);
            break;
        case 'scaleX':
        case 'scaleY':
            if (!node._trs) {
                node._trs = { "__type__": "TypedArray", "ctor": "Float64Array", "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] };
            }
            node._trs.array[key === 'scaleX' ? 7 : 8] = parseFloat(value);
            break;
        case 'group':
            node._groupIndex = parseInt(value);
            node.groupIndex = node._groupIndex;
            break;
    }
}

/**
 * 批量设置节点属性
 * @param {object} node - 节点对象
 * @param {object} options - 属性对象
 */
function setNodeProperties(node, options) {
    if (!options) return;
    for (const [key, value] of Object.entries(options)) {
        setNodeProperty(node, key, value);
    }
}

/**
 * 获取节点状态
 * @param {Array} data - 场景/预制体数据数组
 * @param {object} node - 节点对象
 * @param {number} nodeIndex - 节点索引
 * @returns {object} 节点状态
 */
function getNodeState(data, node, nodeIndex) {
    const { extractComponentProps } = require('./components');
    const trs = node._trs?.array || [0, 0, 0, 0, 0, 0, 1, 1, 1, 1];
    const components = (node._components || []).map(ref => extractComponentProps(data[ref.__id__]));
    const children = (node._children || []).map(ref => data[ref.__id__]?._name || '(unknown)');

    const result = {
        name: node._name,
        active: node._active,
        position: { x: trs[0], y: trs[1] },
        rotation: node._eulerAngles?.z ?? 0,
        scale: { x: trs[7], y: trs[8] },
        anchor: { x: node._anchorPoint?.x ?? 0.5, y: node._anchorPoint?.y ?? 0.5 },
        size: { w: node._contentSize?.width ?? 0, h: node._contentSize?.height ?? 0 },
        color: colorToHex(node._color),
        opacity: node._opacity ?? 255,
        group: node._groupIndex ?? 0
    };

    if (children.length > 0) result.children = children;
    if (components.length > 0) result.components = components;

    return result;
}

/**
 * 收集节点及其所有子节点和组件的索引
 * @param {Array} data - 场景数据
 * @param {number} nodeIndex - 节点索引
 * @param {Set} collected - 已收集的索引集合
 * @returns {Set} 收集的索引集合
 */
function collectNodeAndChildren(data, nodeIndex, collected = new Set()) {
    if (collected.has(nodeIndex)) return collected;
    
    const node = data[nodeIndex];
    if (!node) return collected;
    
    collected.add(nodeIndex);
    
    // 收集所有组件
    if (node._components) {
        for (const compRef of node._components) {
            collected.add(compRef.__id__);
        }
    }
    
    // 递归收集子节点
    if (node._children) {
        for (const childRef of node._children) {
            collectNodeAndChildren(data, childRef.__id__, collected);
        }
    }
    
    return collected;
}

/**
 * 从父节点的 _children 中移除节点引用
 * @param {Array} data - 场景数据
 * @param {object} node - 要删除的节点
 * @param {number} nodeIndex - 节点索引
 */
function removeFromParent(data, node, nodeIndex) {
    if (node._parent) {
        const parentIndex = node._parent.__id__;
        const parent = data[parentIndex];
        if (parent && parent._children) {
            parent._children = parent._children.filter(c => c.__id__ !== nodeIndex);
        }
    }
}

/**
 * 删除节点
 * @param {Array} data - 场景数据
 * @param {number} nodeIndex - 节点索引
 * @param {Function} rebuildReferences - 重建引用函数
 * @returns {object} 删除结果
 */
function deleteNode(data, nodeIndex, rebuildReferences) {
    if (nodeIndex <= 1) {
        return { error: '不能删除根节点' };
    }
    
    const node = data[nodeIndex];
    if (!node) {
        return { error: `节点索引 ${nodeIndex} 不存在` };
    }
    
    const nodeName = node._name || '(unnamed)';
    
    // 收集所有需要删除的索引
    const indicesToDelete = collectNodeAndChildren(data, nodeIndex);
    
    // 从父节点移除引用
    removeFromParent(data, node, nodeIndex);
    
    // 重建引用
    rebuildReferences(data, indicesToDelete);
    
    // 删除元素（从大到小排序）
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

/**
 * 构建组件信息字符串
 */
function buildComponentInfo(data, node, scriptMap, uuidRegex) {
    if (!node._components || node._components.length === 0) return '';
    
    const comps = node._components.map(c => {
        const comp = data[c.__id__];
        if (!comp) return `? #${c.__id__}`;
        const typeName = comp.__type__;
        let displayName;
        if (uuidRegex.test(typeName)) {
            const scriptInfo = scriptMap[typeName];
            displayName = (scriptInfo && scriptInfo.name) ? scriptInfo.name : '[MissingScript]';
        } else if (typeName === 'MissingScript') {
            displayName = '[MissingScript]';
        } else {
            displayName = typeName.replace('cc.', '');
        }
        return `${displayName} #${c.__id__}`;
    }).join(', ');
    
    return ` (${comps})`;
}

/**
 * 构建节点树输出
 * @param {Array} data - 场景数据
 * @param {object} scriptMap - 脚本映射
 * @param {number} nodeIndex - 节点索引
 * @param {string} prefix - 前缀
 * @param {boolean} isLast - 是否是最后一个子节点
 * @param {boolean} isRoot - 是否是根节点
 * @returns {string} 树形字符串
 */
function buildTree(data, scriptMap, nodeIndex, prefix = '', isLast = true, isRoot = true) {
    const node = data[nodeIndex];
    if (!node) return '';
    
    const isSceneRoot = node.__type__ === 'cc.Scene';
    const isPrefabRoot = node.__type__ === 'cc.Prefab';
    const nodeName = isRoot ? 'Root' : (node._name || '(unnamed)');
    const active = node._active !== false ? '●' : '○';
    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    
    let result = '';
    
    if (isSceneRoot) {
        result = '[Scene]\n';
    } else if (isPrefabRoot) {
        // 预制体直接显示根节点
        const prefabNode = data[1];
        if (!prefabNode) return '';
        
        const prefabActive = prefabNode._active !== false ? '●' : '○';
        result = prefabActive + ' ' + (prefabNode._name || 'Root') + ' #' + 1;
        result += buildComponentInfo(data, prefabNode, scriptMap, uuidRegex);
        result += '\n';
        
        // 处理子节点
        if (prefabNode._children && prefabNode._children.length > 0) {
            prefabNode._children.forEach((childRef, idx) => {
                const childIsLast = idx === prefabNode._children.length - 1;
                result += buildTree(data, scriptMap, childRef.__id__, '', childIsLast, false);
            });
        }
        return result;
    } else {
        const connector = isRoot ? '' : (isLast ? '└── ' : '├── ');
        result = prefix + connector + (isRoot ? '' : active + ' ') + nodeName + ' #' + nodeIndex;
        result += buildComponentInfo(data, node, scriptMap, uuidRegex);
        result += '\n';
    }
    
    // 处理子节点
    if (node._children && node._children.length > 0) {
        const childPrefix = prefix + (isSceneRoot ? '' : (isRoot ? '' : (isLast ? '    ' : '│   ')));
        node._children.forEach((childRef, idx) => {
            const childIsLast = idx === node._children.length - 1;
            result += buildTree(data, scriptMap, childRef.__id__, childPrefix, childIsLast, false);
        });
    }
    
    return result;
}

/**
 * 判断索引指向的是节点还是组件
 * @param {Array} data - 场景数据
 * @param {number} index - 索引
 * @returns {string|null} 'node' 或 'component' 或 null
 */
function detectItemType(data, index) {
    const item = data[index];
    if (!item) return null;
    
    // 组件有 node 属性指向所属节点
    if (item.node !== undefined) {
        return 'component';
    }
    
    // 节点有 _name 或类型为 cc.Node/cc.Scene
    const itemType = item.__type__;
    if (itemType === 'cc.Node' || itemType === 'cc.Scene' || item._name !== undefined) {
        return 'node';
    }
    
    return 'component';
}

module.exports = {
    createNodeData,
    setNodeProperty,
    setNodeProperties,
    getNodeState,
    collectNodeAndChildren,
    removeFromParent,
    deleteNode,
    buildTree,
    detectItemType
};
