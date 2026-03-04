/**
 * prefab-create 命令 - 从 JSON 结构创建预制体文件
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
 */

const fs = require('fs');
const path = require('path');
const { Components, generateId } = require('../lib/components');
const { createPrefab, generateFileId } = require('../lib/fire-utils');

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
 * 支持两种格式：
 * 1. 字符串: "sprite"
 * 2. 对象: { "type": "sprite", "sizeMode": 1 }
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
 */
function applyComponentProps(comp, props) {
    if (!props || !comp) return;
    
    const type = comp.__type__;
    
    // Widget 特殊处理：根据设置的方向计算 alignFlags
    // 位掩码定义 (来自 Cocos Creator 源码)
    // TOP=1, MID(verticalCenter)=2, BOT=4, LEFT=8, CENTER(horizontalCenter)=16, RIGHT=32
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
        // Sprite
        'sizeMode': '_sizeMode',
        'fillType': '_fillType',
        'fillCenter': '_fillCenter',
        'fillStart': '_fillStart',
        'fillRange': '_fillRange',
        'trim': '_isTrimmedMode',
        
        // Label
        'string': '_string',
        'fontSize': '_fontSize',
        'lineHeight': '_lineHeight',
        'horizontalAlign': '_N$horizontalAlign',
        'verticalAlign': '_N$verticalAlign',
        'overflow': '_N$overflow',
        'fontFamily': '_N$fontFamily',
        'wrap': '_enableWrapText',
        
        // Widget
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
        
        // Button
        'interactable': '_N$interactable',
        'transition': '_N$transition',
        'zoomScale': 'zoomScale',
        'duration': 'duration',
        
        // Layout
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
        
        // Canvas
        'designResolution': '_designResolution',
        'fitWidth': '_fitWidth',
        'fitHeight': '_fitHeight',
        
        // Camera
        'orthoSize': '_orthoSize',
        'backgroundColor': '_backgroundColor',
        'cullingMask': '_cullingMask',
        'zoomRatio': '_zoomRatio'
    };
    
    // 特殊处理：label 的 string 属性需要同时设置 _N$string
    if (type === 'cc.Label' && props.string !== undefined) {
        comp._N$string = props.string;
    }
    
    // 应用属性
    for (const [key, value] of Object.entries(props)) {
        const compKey = propMap[key];
        if (compKey) {
            // 处理特殊类型
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
 * 从 JSON 定义创建预制体数据
 */
function createPrefabData(nodeDef) {
    const data = [];
    
    // 索引 0: cc.Prefab
    data.push({
        "__type__": "cc.Prefab",
        "_name": "",
        "_objFlags": 0,
        "_native": "",
        "data": { "__id__": 1 },
        "optimizationPolicy": 0,
        "asyncLoadAssets": false,
        "readonly": false
    });

    const prefabInfoList = [];

    function addNode(def, parentIndex) {
        const nodeIndex = data.length;
        const uuid = generateUUID();
        const fileId = generateFileId();

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

        // 解析尺寸
        const width = def.width || 0;
        const height = def.height || 0;

        // 解析锚点
        const anchorX = def.anchorX !== undefined ? def.anchorX : 0.5;
        const anchorY = def.anchorY !== undefined ? def.anchorY : 0.5;

        // 解析旋转和缩放
        const rotation = def.rotation || 0;
        const scaleX = def.scaleX !== undefined ? def.scaleX : 1;
        const scaleY = def.scaleY !== undefined ? def.scaleY : 1;

        // 创建节点
        const node = {
            "__type__": "cc.Node",
            "_name": def.name || 'Node',
            "_objFlags": 0,
            "_parent": parentIndex === null ? null : { "__id__": parentIndex },
            "_children": [],
            "_active": def.active !== false,
            "_components": [],
            "_prefab": null,
            "_opacity": def.opacity !== undefined ? def.opacity : 255,
            "_color": color,
            "_contentSize": {
                "__type__": "cc.Size",
                width,
                height
            },
            "_anchorPoint": { "__type__": "cc.Vec2", "x": anchorX, "y": anchorY },
            "_trs": {
                "__type__": "TypedArray",
                "ctor": "Float64Array",
                "array": [
                    def.x || 0,
                    def.y || 0,
                    0,                      // z
                    0,                      // quat x
                    0,                      // quat y
                    rotation * Math.PI / 180, // quat z (rotation in radians)
                    1,                      // quat w
                    scaleX,
                    scaleY,
                    1                      // scale z
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

        // 记录 PrefabInfo
        prefabInfoList.push({
            nodeIndex,
            prefabInfo: {
                "__type__": "cc.PrefabInfo",
                "root": { "__id__": 1 },
                "asset": { "__id__": 0 },
                "fileId": fileId,
                "sync": false
            }
        });

        // 添加组件
        for (const { type, props } of compList) {
            if (Components[type]) {
                const comp = Components[type](nodeIndex);
                // 应用组件属性
                applyComponentProps(comp, props);
                const compIndex = data.length;
                data.push(comp);
                node._components.push({ "__id__": compIndex });
            }
        }

        // 更新父节点
        if (parentIndex !== null) {
            data[parentIndex]._children.push({ "__id__": nodeIndex });
        }

        // 递归处理子节点
        if (def.children && def.children.length > 0) {
            for (const child of def.children) {
                addNode(child, nodeIndex);
            }
        }

        return nodeIndex;
    }

    // 添加根节点
    addNode(nodeDef, null);

    // 添加所有 PrefabInfo
    for (const { nodeIndex, prefabInfo } of prefabInfoList) {
        data.push(prefabInfo);
        data[nodeIndex]._prefab = { "__id__": data.length - 1 };
    }

    return data;
}

function run(args) {
    if (args.length < 1) {
        console.log(JSON.stringify({ 
            error: '用法: cocos2d-cli create-prefab <输出路径.prefab>',
            hint: '从 stdin 读取 JSON 结构生成预制体',
            example: 'type panel.json | cocos2d-cli create-prefab assets/panel.prefab'
        }));
        return;
    }

    const outputPath = args[0];

    // 从 stdin 读取 JSON
    let input = '';
    
    if (!process.stdin.isTTY) {
        input = fs.readFileSync(0, 'utf8');
    }

    // 没有 stdin 输入时创建空预制体
    if (!input.trim()) {
        const prefabName = path.basename(outputPath, '.prefab');
        
        try {
            if (fs.existsSync(outputPath)) {
                console.log(JSON.stringify({ error: `文件已存在: ${outputPath}` }));
                return;
            }
            
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const data = createPrefab(prefabName);
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
            
            console.log(JSON.stringify({ 
                success: true, 
                path: outputPath,
                rootName: prefabName
            }));
            return;
        } catch (err) {
            console.log(JSON.stringify({ error: err.message }));
            return;
        }
    }

    try {
        // 移除 BOM 并解析 JSON
        input = input.replace(/^\uFEFF/, '').trim();
        const nodeDef = JSON.parse(input);

        // 支持数组格式（第一个作为根节点）
        const rootNode = Array.isArray(nodeDef) ? nodeDef[0] : nodeDef;

        // 生成预制体
        const prefabData = createPrefabData(rootNode);

        // 确保目录存在
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 保存
        fs.writeFileSync(outputPath, JSON.stringify(prefabData, null, 2), 'utf8');

        // 统计
        let nodeCount = 0, compCount = 0;
        for (const item of prefabData) {
            if (item.__type__ === 'cc.Node') nodeCount++;
            else if (item.__type__?.startsWith('cc.') && !['cc.Prefab', 'cc.PrefabInfo'].includes(item.__type__)) {
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
