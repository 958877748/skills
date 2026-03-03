/**
 * set 命令 - 修改节点属性 
 * 修改成功后返回节点最终状态（与 get 命令格式一致）
 */

const { loadScene, saveScene, buildMaps, findNodeIndex, refreshEditor } = require('../lib/fire-utils');

/**
 * 将 _color 对象转为 #RRGGBB 字符串
 */
function colorToHex(color) {
    if (!color) return '#ffffff';
    const r = (color.r || 0).toString(16).padStart(2, '0');
    const g = (color.g || 0).toString(16).padStart(2, '0');
    const b = (color.b || 0).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

/**
 * 提取组件的关键属性（对应 Inspector 面板显示）
 */
function extractComponentProps(comp) {
    if (!comp) return null;
    const type = comp.__type__;
    const base = comp._enabled ? { type } : { type, enabled: false };

    const clean = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(clean);
        const result = {};
        for (const [k, v] of Object.entries(obj)) {
            if (k === '__type__') continue;
            result[k] = typeof v === 'object' ? clean(v) : v;
        }
        return result;
    };

    switch (type) {
        case 'cc.Sprite':
            return {
                ...base,
                spriteFrame: comp._spriteFrame?.__uuid__ || null,
                sizeMode: ['CUSTOM', 'TRIMMED', 'RAW'][comp._sizeMode] || comp._sizeMode,
                spriteType: ['SIMPLE', 'SLICED', 'TILED', 'FILLED', 'MESH'][comp._type] || comp._type,
                trim: comp._isTrimmedMode
            };
        case 'cc.Label':
            return {
                ...base,
                string: comp._string,
                fontSize: comp._fontSize,
                lineHeight: comp._lineHeight,
                horizontalAlign: ['LEFT', 'CENTER', 'RIGHT'][comp._N$horizontalAlign] || comp._N$horizontalAlign,
                verticalAlign: ['TOP', 'CENTER', 'BOTTOM'][comp._N$verticalAlign] || comp._N$verticalAlign,
                overflow: ['NONE', 'CLAMP', 'SHRINK', 'RESIZE_HEIGHT'][comp._N$overflow] || comp._N$overflow,
                fontFamily: comp._N$fontFamily,
                enableWrapText: comp._enableWrapText
            };
        case 'cc.Button':
            return {
                ...base,
                interactable: comp._N$interactable,
                transition: ['NONE', 'COLOR', 'SPRITE', 'SCALE'][comp._N$transition] || comp._N$transition,
                zoomScale: comp.zoomScale,
                duration: comp.duration
            };
        case 'cc.Widget':
            return {
                ...base,
                alignMode: ['ONCE', 'ON_WINDOW_RESIZE', 'ALWAYS'][comp.alignMode] || comp.alignMode,
                left: comp._left,
                right: comp._right,
                top: comp._top,
                bottom: comp._bottom
            };
        case 'cc.Layout':
            return {
                ...base,
                layoutType: ['NONE', 'HORIZONTAL', 'VERTICAL', 'GRID'][comp._N$layoutType] || comp._N$layoutType,
                spacingX: comp._N$spacingX,
                spacingY: comp._N$spacingY,
                paddingLeft: comp._N$paddingLeft,
                paddingRight: comp._N$paddingRight,
                paddingTop: comp._N$paddingTop,
                paddingBottom: comp._N$paddingBottom
            };
        case 'cc.Canvas':
            return {
                ...base,
                designResolution: clean(comp._designResolution),
                fitWidth: comp._fitWidth,
                fitHeight: comp._fitHeight
            };
        case 'cc.Camera':
            return {
                ...base,
                depth: comp._depth,
                zoomRatio: comp._zoomRatio,
                ortho: comp._ortho,
                cullingMask: comp._cullingMask
            };
        case 'cc.ParticleSystem':
            return {
                ...base,
                playOnLoad: comp.playOnLoad,
                totalParticles: comp.totalParticles,
                duration: comp.duration
            };
        default:
            const result = { ...base };
            for (const key of Object.keys(comp)) {
                if (!key.startsWith('_') && key !== '__type__') {
                    result[key] = comp[key];
                }
            }
            return result;
    }
}

// 解析颜色
function parseColor(colorStr) {
    if (!colorStr) return null;
    let color = colorStr;
    if (typeof color === 'string') {
        if (color.startsWith('#')) color = color.slice(1);
        if (color.length === 6) {
            const r = parseInt(color.slice(0, 2), 16);
            const g = parseInt(color.slice(2, 4), 16);
            const b = parseInt(color.slice(4, 6), 16);
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                return { "__type__": "cc.Color", r, g, b, a: 255 };
            }
        }
    }
    return null;
}

/**
 * 获取节点的完整状态（与 get 命令一致）
 */
function getNodeState(data, node, nodeIndex) {
    const trs = node._trs?.array || [0,0,0, 0,0,0,1, 1,1,1];
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

function run(args) {
    if (args.length < 2) {
        console.log(JSON.stringify({ error: '用法: cocos2.4 set <场景文件路径> <节点索引|名称> [选项]' }));
        return;
    }
    
    const scenePath = args[0];
    const nodeRef = args[1];
    
    // 解析选项
    const options = {};
    args.slice(2).forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            options[key] = value;
        }
    });
    
    try {
        const data = loadScene(scenePath);
        const { indexMap } = buildMaps(data);
        
        // 查找节点
        const nodeIndex = findNodeIndex(data, indexMap, nodeRef);
        
        if (nodeIndex === null || !data[nodeIndex]) {
            console.log(JSON.stringify({ error: `找不到节点: ${nodeRef}` }));
            return;
        }
        
        const node = data[nodeIndex];
        
        // 修改名称
        if (options.name !== undefined) {
            node._name = options.name;
        }
        
        // 修改激活状态
        if (options.active !== undefined) {
            node._active = options.active !== 'false';
        }
        
        // 修改位置
        if (options.x !== undefined || options.y !== undefined) {
            if (!node._trs) {
                node._trs = { "__type__": "TypedArray", "ctor": "Float64Array", "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] };
            }
            if (options.x !== undefined) node._trs.array[0] = parseFloat(options.x);
            if (options.y !== undefined) node._trs.array[1] = parseFloat(options.y);
        }
        
        // 修改大小
        if (options.width !== undefined || options.height !== undefined) {
            if (!node._contentSize) {
                node._contentSize = { "__type__": "cc.Size", width: 0, height: 0 };
            }
            if (options.width !== undefined) node._contentSize.width = parseFloat(options.width);
            if (options.height !== undefined) node._contentSize.height = parseFloat(options.height);
        }
        
        // 修改锚点
        if (options.anchorX !== undefined || options.anchorY !== undefined) {
            if (!node._anchorPoint) {
                node._anchorPoint = { "__type__": "cc.Vec2", x: 0.5, y: 0.5 };
            }
            if (options.anchorX !== undefined) node._anchorPoint.x = parseFloat(options.anchorX);
            if (options.anchorY !== undefined) node._anchorPoint.y = parseFloat(options.anchorY);
        }
        
        // 修改透明度
        if (options.opacity !== undefined) {
            node._opacity = Math.max(0, Math.min(255, parseInt(options.opacity)));
        }
        
        // 修改颜色
        if (options.color !== undefined) {
            const color = parseColor(options.color);
            if (color) {
                node._color = color;
            }
        }
        
        // 修改旋转角度
        if (options.rotation !== undefined) {
            if (!node._eulerAngles) {
                node._eulerAngles = { "__type__": "cc.Vec3", x: 0, y: 0, z: 0 };
            }
            node._eulerAngles.z = parseFloat(options.rotation);
        }
        
        // 修改缩放
        if (options.scaleX !== undefined || options.scaleY !== undefined) {
            if (!node._trs) {
                node._trs = { "__type__": "TypedArray", "ctor": "Float64Array", "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] };
            }
            if (options.scaleX !== undefined) node._trs.array[7] = parseFloat(options.scaleX);
            if (options.scaleY !== undefined) node._trs.array[8] = parseFloat(options.scaleY);
        }
        
        // 保存场景
        saveScene(scenePath, data);
        
        // 触发编辑器刷新
        refreshEditor(scenePath);
        
        // 返回节点最终状态（与 get 命令格式一致）
        console.log(JSON.stringify(getNodeState(data, node, nodeIndex)));
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };