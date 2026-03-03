/**
 * create-scene 命令 - 从树形文本结构创建场景文件
 * 
 * 示例输入：
 * Canvas
 * ├─ TopBar (sprite, widget)
 * │   ├─ ScoreLabel (label)
 * │   ├─ LivesContainer
 * │   └─ GoldLabel (label)
 * ├─ GameArea
 * └─ BottomBar
 */

const fs = require('fs');
const path = require('path');
const { Components, generateId, createNodeData } = require('../lib/components');

// 支持的组件类型映射
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

// 渲染组件（一个节点只能有一个）
const RENDER_COMPONENTS = ['sprite', 'label', 'graphics', 'mask', 'richtext', 'particleSystem'];

// 功能组件（可以和渲染组件共存，也可以多个共存）
const FUNCTIONAL_COMPONENTS = ['button', 'widget', 'layout', 'canvas', 'camera'];

/**
 * 校验节点的组件配置
 * @returns {object} { valid: boolean, error?: string, warning?: string }
 */
function validateNodeComponents(nodeName, components) {
    const renderComps = components.filter(c => RENDER_COMPONENTS.includes(c));
    
    if (renderComps.length > 1) {
        return {
            valid: false,
            error: `节点 "${nodeName}" 有多个渲染组件 [${renderComps.join(', ')}]，Cocos Creator 不支持。
            
解决方法：将渲染组件拆分到子节点：
  ${nodeName} (${components.filter(c => !RENDER_COMPONENTS.includes(c)).join(', ') || '无组件'})
  └─ ${nodeName}Graphic (${renderComps[0]})

渲染组件: sprite, label, graphics, mask, richtext, particle
功能组件: button, widget, layout, canvas, camera (可多个共存)`
        };
    }
    
    return { valid: true };
}

/**
 * 递归校验所有节点
 */
function validateAllNodes(nodes, path = '') {
    const errors = [];
    
    for (const node of nodes) {
        const nodePath = path ? `${path}/${node.name}` : node.name;
        const validation = validateNodeComponents(node.name, node.components);
        
        if (!validation.valid) {
            errors.push({ node: nodePath, error: validation.error });
        }
        
        // 递归检查子节点
        if (node.children && node.children.length > 0) {
            const childErrors = validateAllNodes(node.children, nodePath);
            errors.push(...childErrors);
        }
    }
    
    return errors;
}

/**
 * 解析树形文本结构
 * 支持格式：
 * - 节点名称
 * - 节点名称 (组件1, 组件2)
 * - 节点名称 #width=100 #height=50 #x=10 #y=20
 * 
 * 树形符号支持：
 * ├─ └─ │  以及 Windows 下可能出现的 ? 乱码形式
 */
function parseTreeText(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const rootNodes = [];
    const stack = []; // [{ depth, node }]

    for (const line of lines) {
        if (!line.trim()) continue;

        // 计算深度：通过测量前导非内容字符
        // Windows 下树形符号可能被编码成 ?? 或 ?   ??
        // 策略：计算 ?? 或 ├─ 这样的分支标记数量
        
        let depth = 0;
        let contentStart = 0;
        
        // 首先尝试匹配树形模式
        // 模式1: Unicode 树形符号 ├ └
        // 模式2: Windows 乱码 ??
        const branchPattern = /([├└]─|├|└|\?\?|\?)\s*/g;
        const branches = [];
        let match;
        let lastBranchEnd = 0;
        
        while ((match = branchPattern.exec(line)) !== null) {
            branches.push(match[1]);
            lastBranchEnd = match.index + match[0].length;
        }
        
        if (branches.length > 0) {
            // 找到了分支符号，深度 = 分支数量
            depth = branches.length;
            contentStart = lastBranchEnd;
        } else {
            // 没有分支符号，检查缩进
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char !== ' ' && char !== '\t') {
                    contentStart = i;
                    break;
                }
            }
            depth = Math.floor(contentStart / 4);
        }

        // 提取节点内容
        let content = line.substring(contentStart).trim();
        
        // 清理可能残留的符号（- 和空格）
        content = content.replace(/^[\-\s]+/, '').trim();

        if (!content) continue;

        // 解析节点信息
        const nodeInfo = parseNodeLine(content);

        // 构建树结构
        while (stack.length > depth) {
            stack.pop();
        }

        const node = {
            name: nodeInfo.name,
            components: nodeInfo.components,
            options: nodeInfo.options,
            children: []
        };

        if (stack.length === 0) {
            rootNodes.push(node);
        } else {
            stack[stack.length - 1].node.children.push(node);
        }

        stack.push({ depth, node });
    }

    return rootNodes;
}

/**
 * 解析单行节点定义
 * 格式：NodeName (comp1, comp2) #key=value
 */
function parseNodeLine(line) {
    let name = line;
    let components = [];
    let options = {};

    // 提取组件 (xxx)
    const compMatch = line.match(/\(([^)]+)\)/);
    if (compMatch) {
        name = name.replace(compMatch[0], '').trim();
        const compList = compMatch[1].split(',').map(c => c.trim().toLowerCase());
        for (const comp of compList) {
            if (COMPONENT_TYPES[comp]) {
                components.push(COMPONENT_TYPES[comp]);
            }
        }
    }

    // 提取选项 #key=value
    const optionMatches = name.matchAll(/#(\w+)=([^\s#]+)/g);
    for (const match of optionMatches) {
        const key = match[1];
        let value = match[2];
        
        // 类型转换
        if (/^\d+$/.test(value)) value = parseInt(value);
        else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value);
        else if (value === 'true') value = true;
        else if (value === 'false') value = false;

        options[key] = value;
    }
    name = name.replace(/#\w+=[^\s#]+/g, '').trim();

    return { name, components, options };
}

/**
 * 生成 UUID（简化版）
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 创建场景文件数据结构（基于模板）
 */
function createSceneData(rootNodes, sceneName) {
    // 加载模板
    const templatePath = path.join(__dirname, '..', '..', 'data', 'scene-template.json');
    let data;
    
    try {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        data = JSON.parse(templateContent);
    } catch (e) {
        // 如果模板加载失败，使用内置基础结构
        data = createBasicSceneTemplate();
    }

    // 设置场景名称
    data[0]._name = sceneName || "NewScene";
    data[1]._name = sceneName || "NewScene";

    // 生成新的 UUID
    data[1]._id = generateUUID();
    data[2]._id = generateUUID();
    data[3]._id = generateUUID();

    // Canvas 节点在索引 2
    const canvasIndex = 2;
    const canvas = data[canvasIndex];

    // 递归添加节点
    function addNode(nodeDef, parentIndex) {
        const nodeIndex = data.length;
        const uuid = generateUUID();

        // 创建节点
        const node = {
            "__type__": "cc.Node",
            "_name": nodeDef.name,
            "_objFlags": 0,
            "_parent": { "__id__": parentIndex },
            "_children": [],
            "_active": true,
            "_components": [],
            "_prefab": null,
            "_opacity": 255,
            "_color": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 },
            "_contentSize": {
                "__type__": "cc.Size",
                "width": nodeDef.options.width || 0,
                "height": nodeDef.options.height || 0
            },
            "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
            "_trs": {
                "__type__": "TypedArray",
                "ctor": "Float64Array",
                "array": [
                    nodeDef.options.x || 0,
                    nodeDef.options.y || 0,
                    0, 0, 0, 0, 1, 1, 1, 1
                ]
            },
            "_eulerAngles": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
            "_skewX": 0,
            "_skewY": 0,
            "_is3DNode": false,
            "_groupIndex": 0,
            "groupIndex": 0,
            "_id": uuid
        };

        data.push(node);

        // 添加组件
        for (const compType of nodeDef.components) {
            if (Components[compType]) {
                const comp = Components[compType](nodeIndex);
                const compIndex = data.length;
                data.push(comp);
                node._components.push({ "__id__": compIndex });
            }
        }

        // 更新父节点的 _children
        const parent = data[parentIndex];
        if (parent && parent._children) {
            parent._children.push({ "__id__": nodeIndex });
        }

        // 递归处理子节点
        for (const child of nodeDef.children) {
            addNode(child, nodeIndex);
        }

        return nodeIndex;
    }

    // 处理输入的节点结构
    // 如果第一个节点是 Canvas，把它的子节点添加到模板的 Canvas 下
    if (rootNodes.length > 0 && rootNodes[0].name === 'Canvas') {
        // 用户定义了 Canvas 节点，把它的子节点添加到模板的 Canvas
        for (const child of rootNodes[0].children) {
            addNode(child, canvasIndex);
        }
    } else {
        // 用户定义的是其他节点，直接添加到 Canvas 下
        for (const rootNode of rootNodes) {
            addNode(rootNode, canvasIndex);
        }
    }

    return data;
}

/**
 * 创建基础场景模板（当模板文件不存在时使用）
 */
function createBasicSceneTemplate() {
    return [
        {
            "__type__": "cc.SceneAsset",
            "_name": "",
            "_objFlags": 0,
            "_native": "",
            "scene": { "__id__": 1 }
        },
        {
            "__type__": "cc.Scene",
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
            "_id": ""
        },
        {
            "__type__": "cc.Node",
            "_name": "Canvas",
            "_objFlags": 0,
            "_parent": { "__id__": 1 },
            "_children": [{ "__id__": 3 }],
            "_active": true,
            "_components": [{ "__id__": 5 }, { "__id__": 6 }],
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
            "_id": ""
        },
        {
            "__type__": "cc.Node",
            "_name": "Main Camera",
            "_objFlags": 0,
            "_parent": { "__id__": 2 },
            "_children": [],
            "_active": true,
            "_components": [{ "__id__": 4 }],
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
            "_id": ""
        },
        {
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
            "_id": ""
        },
        {
            "__type__": "cc.Canvas",
            "_name": "",
            "_objFlags": 0,
            "node": { "__id__": 2 },
            "_enabled": true,
            "_designResolution": { "__type__": "cc.Size", "width": 960, "height": 640 },
            "_fitWidth": false,
            "_fitHeight": true,
            "_id": ""
        },
        {
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
            "_id": ""
        }
    ];
}

function run(args) {
    if (args.length < 1) {
        console.log(JSON.stringify({ 
            error: '用法: cocos2.4 create-scene <输出路径.fire> [场景名称]',
            hint: '从 stdin 读取树形结构，例如：\n  echo "Canvas\\n├─ TopBar (sprite)" | cocos2.4 create-scene assets/scene.fire'
        }));
        return;
    }

    const outputPath = args[0];
    const sceneName = args[1] || path.basename(outputPath, '.fire');

    // 从 stdin 读取树形结构
    let input = '';
    
    // 检查是否是管道输入
    if (!process.stdin.isTTY) {
        // 同步读取 stdin（简化处理）
        const fs = require('fs');
        input = fs.readFileSync(0, 'utf8');
    }

    if (!input.trim()) {
        console.log(JSON.stringify({ 
            error: '请通过 stdin 提供场景结构',
            example: `echo "Canvas (canvas)\\n├─ TopBar (sprite, widget)\\n│   └─ ScoreLabel (label)" | cocos2.4 create-scene assets/game.fire`
        }));
        return;
    }

    try {
        // 解析树形结构
        const rootNodes = parseTreeText(input);

        if (rootNodes.length === 0) {
            console.log(JSON.stringify({ error: '未能解析出任何节点' }));
            return;
        }

        // 校验组件配置
        const validationErrors = validateAllNodes(rootNodes);
        if (validationErrors.length > 0) {
            console.log(JSON.stringify({ 
                error: '组件配置错误',
                details: validationErrors
            }));
            return;
        }

        // 生成场景数据
        const sceneData = createSceneData(rootNodes, sceneName);

        // 确保输出目录存在
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 保存文件
        fs.writeFileSync(outputPath, JSON.stringify(sceneData, null, 2), 'utf8');

        // 统计信息
        let nodeCount = 0;
        let compCount = 0;
        for (const item of sceneData) {
            if (item.__type__ === 'cc.Node') nodeCount++;
            else if (item.__type__?.startsWith('cc.') && item.__type__ !== 'cc.Scene' && item.__type__ !== 'cc.SceneAsset') {
                compCount++;
            }
        }

        console.log(JSON.stringify({
            success: true,
            path: outputPath,
            nodes: nodeCount,
            components: compCount,
            structure: rootNodes.map(n => n.name)
        }));

    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };