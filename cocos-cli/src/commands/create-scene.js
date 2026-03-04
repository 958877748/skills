/**
 * create-scene 命令 - 从 JSON 结构创建场景文件
 * 
 * JSON 格式示例：
 * {
 *   "name": "Panel",
 *   "width": 400,
 *   "height": 300,
 *   "color": "#ffffff",
 *   "components": [
 *     { "type": "sprite", "sizeMode": 1 },
 *     { "type": "widget", "top": 0, "bottom": 0 }
 *   ],
 *   "children": [...]
 * }
 * 
 * 节点属性：name, width, height, x, y, color, opacity, anchorX, anchorY, rotation, scaleX, scaleY, active
 * 组件属性：type + 各组件特有属性
 * 
 * 场景会自动包含 Canvas 和 Main Camera 节点
 */

const fs = require('fs');
const path = require('path');
const { Components, generateId } = require('../lib/components');

// 支持的组件类型
const COMPONENT_TYPES = {
    'sprite': 'sprite',
    'label': 'label',
    'button': 'button',
    'layout': 'layout',
    'widget': 'widget',
    'camera': 'camera',
    'canvas': 'canvas',
    'particle': 'particleSystem',
    'particlesystem': 'particleSystem'
};

/**
 * 解析颜色字符串 #RRGGBB 或 #RRGGBBAA
 */
function parseColor(colorStr) {
    if (!colorStr || typeof colorStr !== 'string') return null;
    
    let hex = colorStr.replace('#', '');
    if (hex.length === 6) {
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16),
            a: 255
        };
    } else if (hex.length === 8) {
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16),
            a: parseInt(hex.substring(6, 8), 16)
        };
    }
    return null;
}

/**
 * 生成 UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 解析组件定义
 */
function parseComponent(compDef) {
    if (typeof compDef === 'string') {
        const type = COMPONENT_TYPES[compDef.toLowerCase()];
        return type ? { type, props: {} } : null;
    }
    
    if (typeof compDef === 'object' && compDef.type) {
        const type = COMPONENT_TYPES[compDef.type.toLowerCase()];
        if (!type) return null;
        
        const props = { ...compDef };
        delete props.type;
        return { type, props };
    }
    
    return null;
}

/**
 * 应用组件属性
 * @param comp 组件对象
 * @param props 属性对象
 * @param node 节点对象（可选，用于 label 的 color 设置到节点）
 */
function applyComponentProps(comp, props, node) {
    if (!props || !comp) return;
    
    const type = comp.__type__;
    
    // Label 的 color 属性应该设置到节点上
    if (type === 'cc.Label' && props.color && node) {
        const parsed = parseColor(props.color);
        if (parsed) {
            node._color = { "__type__": "cc.Color", ...parsed };
        }
        delete props.color; // 不再在组件中处理
    }
    
    // Widget 特殊处理：根据设置的方向计算 alignFlags
    if (type === 'cc.Widget') {
        const ALIGN = { 
            top: 1, 
            verticalCenter: 2, 
            bottom: 4, 
            left: 8, 
            horizontalCenter: 16, 
            right: 32 
        };
        let alignFlags = 0;
        
        for (const dir of ['top', 'bottom', 'left', 'right', 'horizontalCenter', 'verticalCenter']) {
            if (props[dir] !== undefined && props[dir] !== null) {
                alignFlags |= ALIGN[dir];
            }
        }
        
        if (alignFlags > 0) {
            comp._alignFlags = alignFlags;
        }
    }
    
    // 通用属性映射
    const propMap = {
        'sizeMode': '_sizeMode',
        'fillType': '_fillType',
        'fillCenter': '_fillCenter',
        'fillStart': '_fillStart',
        'fillRange': '_fillRange',
        'trim': '_isTrimmedMode',
        'string': '_string',
        'fontSize': '_fontSize',
        'lineHeight': '_lineHeight',
        'horizontalAlign': '_N$horizontalAlign',
        'verticalAlign': '_N$verticalAlign',
        'overflow': '_N$overflow',
        'fontFamily': '_N$fontFamily',
        'wrap': '_enableWrapText',
        'alignFlags': '_alignFlags',
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
        'interactable': '_N$interactable',
        'transition': '_N$transition',
        'zoomScale': 'zoomScale',
        'duration': 'duration',
        'layoutType': '_N$layoutType',
        'cellSize': '_N$cellSize',
        'startAxis': '_N$startAxis',
        'paddingLeft': '_N$paddingLeft',
        'paddingRight': '_N$paddingRight',
        'paddingTop': '_N$paddingTop',
        'paddingBottom': '_N$paddingBottom',
        'spacingX': '_N$spacingX',
        'spacingY': '_N$spacingY',
        'resize': '_resize',
        'designResolution': '_designResolution',
        'fitWidth': '_fitWidth',
        'fitHeight': '_fitHeight',
        'orthoSize': '_orthoSize',
        'backgroundColor': '_backgroundColor',
        'cullingMask': '_cullingMask',
        'zoomRatio': '_zoomRatio'
    };
    
    if (type === 'cc.Label' && props.string !== undefined) {
        comp._N$string = props.string;
    }
    
    for (const [key, value] of Object.entries(props)) {
        const compKey = propMap[key];
        if (compKey) {
            if (key === 'fillCenter' && Array.isArray(value)) {
                comp[compKey] = { "__type__": "cc.Vec2", "x": value[0], "y": value[1] };
            } else if (key === 'cellSize' && Array.isArray(value)) {
                comp[compKey] = { "__type__": "cc.Size", "width": value[0], "height": value[1] };
            } else if (key === 'designResolution' && Array.isArray(value)) {
                comp[compKey] = { "__type__": "cc.Size", "width": value[0], "height": value[1] };
            } else if ((key === 'backgroundColor' || key === 'color') && typeof value === 'string') {
                const color = parseColor(value);
                if (color) {
                    comp[compKey] = { "__type__": "cc.Color", ...color };
                }
            } else {
                comp[compKey] = value;
            }
        }
    }
}

/**
 * 创建场景数据结构
 */
function createSceneData(nodeDefs, sceneName) {
    const data = [];
    
    // 场景 UUID
    const sceneUUID = generateUUID();
    const canvasUUID = generateUUID();
    const cameraUUID = generateUUID();
    
    // 索引 0: cc.SceneAsset
    data.push({
        "__type__": "cc.SceneAsset",
        "_name": sceneName || "NewScene",
        "_objFlags": 0,
        "_native": "",
        "scene": { "__id__": 1 }
    });
    
    // 索引 1: cc.Scene
    data.push({
        "__type__": "cc.Scene",
        "_name": sceneName || "NewScene",
        "_objFlags": 0,
        "_parent": null,
        "_children": [{ "__id__": 2 }],
        "_active": true,
        "_components": [],
        "_prefab": null,
        "_opacity": 255,
        "_color": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 },
        "_contentSize": { "__type__": "cc.Size", "width": 0, "height": 0 },
        "_anchorPoint": { "__type__": "cc.Vec2", "x": 0, "y": 0 },
        "_trs": { "__type__": "TypedArray", "ctor": "Float64Array", "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] },
        "_is3DNode": true,
        "_groupIndex": 0,
        "groupIndex": 0,
        "autoReleaseAssets": false,
        "_id": sceneUUID
    });
    
    // 索引 2: Canvas 节点
    data.push({
        "__type__": "cc.Node",
        "_name": "Canvas",
        "_objFlags": 0,
        "_parent": { "__id__": 1 },
        "_children": [{ "__id__": 3 }],  // Main Camera
        "_active": true,
        "_components": [{ "__id__": 5 }, { "__id__": 6 }],  // Canvas, Widget
        "_prefab": null,
        "_opacity": 255,
        "_color": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 },
        "_contentSize": { "__type__": "cc.Size", "width": 960, "height": 640 },
        "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
        "_trs": { "__type__": "TypedArray", "ctor": "Float64Array", "array": [480, 320, 0, 0, 0, 0, 1, 1, 1, 1] },
        "_eulerAngles": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
        "_skewX": 0,
        "_skewY": 0,
        "_is3DNode": false,
        "_groupIndex": 0,
        "groupIndex": 0,
        "_id": canvasUUID
    });
    
    // 索引 3: Main Camera 节点
    data.push({
        "__type__": "cc.Node",
        "_name": "Main Camera",
        "_objFlags": 0,
        "_parent": { "__id__": 2 },
        "_children": [],
        "_active": true,
        "_components": [{ "__id__": 4 }],  // Camera
        "_prefab": null,
        "_opacity": 255,
        "_color": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 },
        "_contentSize": { "__type__": "cc.Size", "width": 0, "height": 0 },
        "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
        "_trs": { "__type__": "TypedArray", "ctor": "Float64Array", "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] },
        "_eulerAngles": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
        "_skewX": 0,
        "_skewY": 0,
        "_is3DNode": false,
        "_groupIndex": 0,
        "groupIndex": 0,
        "_id": cameraUUID
    });
    
    // 索引 4: Camera 组件
    data.push({
        "__type__": "cc.Camera",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": 3 },
        "_enabled": true,
        "_cullingMask": 4294967295,
        "_clearFlags": 7,
        "_backgroundColor": { "__type__": "cc.Color", "r": 0, "g": 0, "b": 0, "a": 255 },
        "_depth": -1,
        "_zoomRatio": 1,
        "_targetTexture": null,
        "_fov": 60,
        "_orthoSize": 10,
        "_nearClip": 1,
        "_farClip": 4096,
        "_ortho": true,
        "_rect": { "__type__": "cc.Rect", "x": 0, "y": 0, "width": 1, "height": 1 },
        "_renderStages": 1,
        "_alignWithScreen": true,
        "_id": generateId()
    });
    
    // 索引 5: Canvas 组件
    data.push({
        "__type__": "cc.Canvas",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": 2 },
        "_enabled": true,
        "_designResolution": { "__type__": "cc.Size", "width": 960, "height": 640 },
        "_fitWidth": false,
        "_fitHeight": true,
        "_id": generateId()
    });
    
    // 索引 6: Widget 组件 (Canvas)
    data.push({
        "__type__": "cc.Widget",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": 2 },
        "_enabled": true,
        "alignMode": 1,
        "_target": null,
        "_alignFlags": 45,
        "_left": 0,
        "_right": 0,
        "_top": 0,
        "_bottom": 0,
        "_verticalCenter": 0,
        "_horizontalCenter": 0,
        "_isAbsLeft": true,
        "_isAbsRight": true,
        "_isAbsTop": true,
        "_isAbsBottom": true,
        "_isAbsHorizontalCenter": true,
        "_isAbsVerticalCenter": true,
        "_originalWidth": 0,
        "_originalHeight": 0,
        "_id": generateId()
    });

    // Canvas 节点索引
    const canvasIndex = 2;

    // 递归添加用户节点
    function addNode(def, parentIndex) {
        const nodeIndex = data.length;
        const uuid = generateUUID();

        // 解析组件
        const compList = (def.components || [])
            .map(parseComponent)
            .filter(Boolean);

        // 解析颜色
        let color = { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 };
        if (def.color) {
            const parsed = parseColor(def.color);
            if (parsed) {
                color = { "__type__": "cc.Color", ...parsed };
            }
        }

        // 解析尺寸和位置
        const width = def.width || 0;
        const height = def.height || 0;
        const anchorX = def.anchorX !== undefined ? def.anchorX : 0.5;
        const anchorY = def.anchorY !== undefined ? def.anchorY : 0.5;
        const rotation = def.rotation || 0;
        const scaleX = def.scaleX !== undefined ? def.scaleX : 1;
        const scaleY = def.scaleY !== undefined ? def.scaleY : 1;

        // 创建节点
        const node = {
            "__type__": "cc.Node",
            "_name": def.name || 'Node',
            "_objFlags": 0,
            "_parent": { "__id__": parentIndex },
            "_children": [],
            "_active": def.active !== false,
            "_components": [],
            "_prefab": null,
            "_opacity": def.opacity !== undefined ? def.opacity : 255,
            "_color": color,
            "_contentSize": { "__type__": "cc.Size", width, height },
            "_anchorPoint": { "__type__": "cc.Vec2", "x": anchorX, "y": anchorY },
            "_trs": {
                "__type__": "TypedArray",
                "ctor": "Float64Array",
                "array": [
                    def.x || 0,
                    def.y || 0,
                    0, 0, 0,
                    rotation * Math.PI / 180,
                    1, scaleX, scaleY, 1
                ]
            },
            "_eulerAngles": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": rotation },
            "_skewX": 0,
            "_skewY": 0,
            "_is3DNode": false,
            "_groupIndex": 0,
            "groupIndex": 0,
            "_id": uuid
        };

        data.push(node);

        // 添加组件
        for (const { type, props } of compList) {
            if (Components[type]) {
                const comp = Components[type](nodeIndex);
                applyComponentProps(comp, props, node);
                const compIndex = data.length;
                data.push(comp);
                node._components.push({ "__id__": compIndex });
            }
        }

        // 更新父节点的 _children
        data[parentIndex]._children.push({ "__id__": nodeIndex });

        // 递归处理子节点
        if (def.children && def.children.length > 0) {
            for (const child of def.children) {
                addNode(child, nodeIndex);
            }
        }

        return nodeIndex;
    }

    // 支持数组或单个节点
    const nodes = Array.isArray(nodeDefs) ? nodeDefs : [nodeDefs];
    
    // 添加用户节点到 Canvas
    for (const nodeDef of nodes) {
        addNode(nodeDef, canvasIndex);
    }

    return data;
}

function run(args) {
    if (args.length < 2) {
        console.log(JSON.stringify({ 
            error: '用法: cocos2d-cli create-scene <JSON文件路径> <输出路径.fire>',
            hint: '从 JSON 文件读取结构生成场景',
            example: 'cocos2d-cli create-scene scene.json assets/scene.fire'
        }));
        return;
    }

    const jsonPath = args[0];
    const outputPath = args[1];
    const sceneName = path.basename(outputPath, '.fire');

    // 检查 JSON 文件是否存在
    if (!fs.existsSync(jsonPath)) {
        console.log(JSON.stringify({ 
            error: `JSON 文件不存在: ${jsonPath}`
        }));
        return;
    }

    try {
        // 从文件读取 JSON
        const input = fs.readFileSync(jsonPath, 'utf8');
        // 移除 BOM 并解析 JSON
        const cleanInput = input.replace(/^\uFEFF/, '').trim();
        const nodeDef = JSON.parse(cleanInput);

        // 生成场景数据
        const sceneData = createSceneData(nodeDef, sceneName);

        // 确保输出目录存在
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 保存文件
        fs.writeFileSync(outputPath, JSON.stringify(sceneData, null, 2), 'utf8');

        // 统计信息
        let nodeCount = 0, compCount = 0;
        for (const item of sceneData) {
            if (item.__type__ === 'cc.Node') nodeCount++;
            else if (item.__type__?.startsWith('cc.') && !['cc.Scene', 'cc.SceneAsset'].includes(item.__type__)) {
                compCount++;
            }
        }

        console.log(JSON.stringify({
            success: true,
            path: outputPath,
            nodes: nodeCount,
            components: compCount
        }));

    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };
