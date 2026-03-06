/**
 * create-scene 命令 - 从 JSON 结构创建场景文件
 */

const fs = require('fs');
const path = require('path');
const { outputError } = require('../lib/utils');
const { buildTree } = require('../lib/node-utils');
const { parseComponent, createComponent, applyComponentProps } = require('../lib/components');
const { SceneData, CCNode } = require('../lib/templates');
const { loadScriptMap } = require('../lib/fire-utils');

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
 * 从 JSON 定义创建场景数据
 */
function createSceneData(nodeDefs, sceneName) {
    const sceneData = new SceneData(sceneName);
    
    // 支持数组或单个节点
    const nodes = Array.isArray(nodeDefs) ? nodeDefs : [nodeDefs];
    
    // 添加用户节点到 Scene
    for (const nodeDef of nodes) {
        addNodeFromDef(sceneData, nodeDef, 1); // 1 是 Scene 的索引
    }

    return sceneData;
}

/**
 * 从定义添加节点
 */
function addNodeFromDef(sceneData, def, parentIndex) {
    const node = new CCNode(def.name || 'Node');
    node.setParent(parentIndex);
    
    // 应用属性
    if (def.active !== undefined) node._active = def.active;
    if (def.opacity !== undefined) node._opacity = def.opacity;
    if (def.width !== undefined) node._contentSize.width = def.width;
    if (def.height !== undefined) node._contentSize.height = def.height;
    if (def.x !== undefined) node._trs.array[0] = def.x;
    if (def.y !== undefined) node._trs.array[1] = def.y;
    if (def.rotation !== undefined) {
        node._trs.array[5] = def.rotation * Math.PI / 180;
        node._eulerAngles.z = def.rotation;
    }
    if (def.scaleX !== undefined) node._trs.array[7] = def.scaleX;
    if (def.scaleY !== undefined) node._trs.array[8] = def.scaleY;
    if (def.anchorX !== undefined) node._anchorPoint.x = def.anchorX;
    if (def.anchorY !== undefined) node._anchorPoint.y = def.anchorY;
    if (def.color) {
        const { parseColor } = require('../lib/utils');
        const parsed = parseColor(def.color);
        if (parsed) {
            node._color = { "__type__": "cc.Color", ...parsed };
        }
    }
    
    const nodeIndex = sceneData.data.length;
    sceneData.data[parentIndex].addChild(nodeIndex);
    sceneData.data.push(node);
    
    // 添加组件
    if (def.components) {
        for (const compDef of def.components) {
            const parsed = parseComponent(compDef);
            if (parsed) {
                const comp = createComponent(parsed.type, nodeIndex);
                if (comp) {
                    applyComponentProps(comp, parsed.props, node);
                    sceneData.data.push(comp);
                    node.addComponent(sceneData.data.length - 1);
                }
            }
        }
    }
    
    // 递归处理子节点
    if (def.children && def.children.length > 0) {
        for (const childDef of def.children) {
            addNodeFromDef(sceneData, childDef, nodeIndex);
        }
    }
}

function run(args) {
    if (args.length < 1) {
        outputError({ 
            message: '用法: cocos2d-cli create-scene [JSON文件路径] <输出路径.fire>',
            hint: '不传 JSON 则创建默认场景'
        });
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

    // 没有传 JSON，创建默认场景
    if (!jsonPath) {
        try {
            if (fs.existsSync(outputPath)) {
                outputError(`文件已存在: ${outputPath}`);
                return;
            }
            
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const sceneData = new SceneData(sceneName);
            
            // 读取 meta 文件中的 uuid
            const uuid = readUuidFromMeta(outputPath);
            if (uuid) {
                sceneData.getScene()._id = uuid;
            }
            
            const data = sceneData.toJSON();
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
            
            const scriptMap = loadScriptMap(outputPath);
            console.log(buildTree(data, scriptMap, 1).trim());
            return;
        } catch (err) {
            outputError(err.message);
            return;
        }
    }

    if (!fs.existsSync(jsonPath)) {
        outputError(`JSON 文件不存在: ${jsonPath}`);
        return;
    }

    try {
        const input = fs.readFileSync(jsonPath, 'utf8');
        const cleanInput = input.replace(/^\uFEFF/, '').trim();
        const nodeDef = JSON.parse(cleanInput);

        const sceneData = createSceneData(nodeDef, sceneName);
        
        // 读取 meta 文件中的 uuid
        const uuid = readUuidFromMeta(outputPath);
        if (uuid) {
            sceneData.getScene()._id = uuid;
        }

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const data = sceneData.toJSON();
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
        
        const scriptMap = loadScriptMap(outputPath);
        console.log(buildTree(data, scriptMap, 1).trim());

    } catch (err) {
        outputError(err.message);
    }
}

module.exports = { run };
