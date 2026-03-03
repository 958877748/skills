/**
 * get 命令 - 获取节点信息         
 * 返回与编辑器 Inspector 面板一致的所有属性
 */

const { loadScene, buildMaps, findNodeIndex } = require('../lib/fire-utils');

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

    // 只在 disabled 时才输出 enabled 字段
    const base = comp._enabled ? { type } : { type, enabled: false };

    // 清理对象中的 __type__ 字段
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
            // 未知组件：返回去掉内部字段的原始属性
            const result = { ...base };
            for (const key of Object.keys(comp)) {
                if (!key.startsWith('_') && key !== '__type__') {
                    result[key] = comp[key];
                }
            }
            return result;
    }
}

function run(args) {
    if (args.length < 2) {
        console.log(JSON.stringify({ error: '用法: cocos2.4 get <场景文件路径> <节点索引|名称>' }));
        return;
    }
    
    const scenePath = args[0];
    const nodeRef = args[1];
    
    try {
        const data = loadScene(scenePath);
        const { indexMap } = buildMaps(data);
        
        // 查找节点
        const idx = findNodeIndex(data, indexMap, nodeRef);
        
        if (idx === null || idx < 0 || idx >= data.length) {
            console.log(JSON.stringify({ error: `无效的节点索引: ${nodeRef}` }));
            return;
        }
        
        const node = data[idx];
        if (!node) {
            console.log(JSON.stringify({ error: `节点不存在: ${nodeRef}` }));
            return;
        }

        // 从 _trs 数组解析变换属性
        // 格式: [x, y, z, qx, qy, qz, qw, scaleX, scaleY, scaleZ]
        const trs = node._trs?.array || [0,0,0, 0,0,0,1, 1,1,1];

        // 组件详细信息
        const components = (node._components || []).map(ref => {
            const comp = data[ref.__id__];
            return extractComponentProps(comp);
        });

        // 子节点名称
        const children = (node._children || []).map(ref => data[ref.__id__]?._name || '(unknown)');

        const info = indexMap[idx] || {};

        // 精简 JSON 输出
        const result = {
            name: info.name,
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

        console.log(JSON.stringify(result));

    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };