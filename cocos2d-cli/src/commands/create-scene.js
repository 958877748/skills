/**
 * create-scene 命令 - 创建场景文件
 */

const fs = require('fs');
const path = require('path');
const { CCNode, CCScene, CCSceneAsset, CCCanvas, CCWidget, CCCamera } = require('../lib/cc');
const { buildTree } = require('../lib/node-utils');
const { loadScriptMap } = require('../lib/fire-utils');
const { generateUUID, generateCompressedUUID } = require('../lib/utils');
const { fromJSON } = require('../lib/json-parser');

/**
 * 从项目配置读取设计分辨率
 */
function getDesignResolution(outputPath) {
    const defaultResolution = { width: 960, height: 640 };
    
    let currentDir = path.dirname(path.resolve(outputPath));
    while (currentDir !== path.dirname(currentDir)) {
        const settingsPath = path.join(currentDir, 'settings', 'project.json');
        if (fs.existsSync(settingsPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                if (config['design-resolution-width'] && config['design-resolution-height']) {
                    return {
                        width: config['design-resolution-width'],
                        height: config['design-resolution-height']
                    };
                }
            } catch (e) {}
        }
        currentDir = path.dirname(currentDir);
    }
    
    return defaultResolution;
}

/**
 * 从 meta 文件读取 uuid
 */
function readUuidFromMeta(scenePath) {
    const metaPath = scenePath + '.meta';
    if (fs.existsSync(metaPath)) {
        try {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            return meta.uuid || null;
        } catch (e) {
            return null;
        }
    }
    return null;
}

/**
 * 为节点树设置 _id
 */
function setNodeId(node) {
    node._id = generateCompressedUUID();
    if (node._children) {
        node._children.forEach(child => setNodeId(child));
    }
}

/**
 * 创建默认场景结构（Canvas + Main Camera）
 */
function createDefaultScene(asset, resolution) {
    const { width, height } = resolution;
    const scene = asset._scene;
    
    // 创建 Canvas 节点
    const canvas = new CCNode('Canvas');
    canvas._contentSize.width = width;
    canvas._contentSize.height = height;
    canvas._anchorPoint.x = 0.5;
    canvas._anchorPoint.y = 0.5;
    canvas._trs.array[0] = width / 2;
    canvas._trs.array[1] = height / 2;
    canvas._is3DNode = false;
    canvas._id = generateCompressedUUID();
    
    // Canvas 组件
    const canvasComp = new CCCanvas();
    canvasComp.setDesignResolution(width, height);
    canvasComp.node = canvas;
    
    // Widget 组件
    const widget = new CCWidget();
    widget.node = canvas;
    
    canvas._components = [canvasComp, widget];
    canvas._parent = scene;
    scene._children = [canvas];
    
    // 创建 Main Camera 节点
    const camera = new CCNode('Main Camera');
    camera._contentSize.width = 0;
    camera._contentSize.height = 0;
    camera._anchorPoint.x = 0.5;
    camera._anchorPoint.y = 0.5;
    camera._is3DNode = false;
    camera._id = generateCompressedUUID();
    
    // Camera 组件
    const cameraComp = new CCCamera();
    cameraComp.node = camera;
    
    camera._components = [cameraComp];
    camera._parent = canvas;
    canvas._children = [camera];
}

function run(args) {
    if (args.length < 1) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli create-scene [JSON文件路径] <输出路径.fire>' }));
        console.log(JSON.stringify({ hint: '不传 JSON 则创建默认场景（含 Canvas 和 Main Camera）' }));
        return;
    }

    let jsonPath = null;
    let outputPath;

    if (args.length === 1) {
        outputPath = args[0];
    } else {
        jsonPath = args[0];
        outputPath = args[1];
    }

    const sceneName = path.basename(outputPath, '.fire');

    try {
        // 创建场景
        const asset = new CCSceneAsset();
        const scene = new CCScene(sceneName);
        asset._scene = scene;
        scene._children = [];
        
        // 从 JSON 创建
        if (jsonPath && fs.existsSync(jsonPath)) {
            const input = fs.readFileSync(jsonPath, 'utf8');
            const nodeDef = JSON.parse(input.replace(/^\uFEFF/, '').trim());
            
            const nodes = Array.isArray(nodeDef) ? nodeDef : [nodeDef];
            for (const def of nodes) {
                const node = fromJSON(def);
                setNodeId(node);
                node._parent = scene;
                scene._children.push(node);
            }
        } else {
            // 没有 JSON，创建默认场景结构
            const resolution = getDesignResolution(outputPath);
            createDefaultScene(asset, resolution);
        }

        // 确保目录存在
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 设置 Scene._id
        const uuid = readUuidFromMeta(outputPath);
        scene._id = uuid || generateUUID();

        // 保存
        const data = asset.toJSON();
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');

        // 输出 tree
        const scriptMap = loadScriptMap(outputPath);
        console.log(buildTree(data, scriptMap, 1).trim());

    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };
