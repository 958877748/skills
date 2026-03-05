/**
 * create-scene 命令 - 从 JSON 结构创建场景文件
 */

const fs = require('fs');
const path = require('path');
const { outputError, outputSuccess } = require('../lib/utils');
const { createNodeData } = require('../lib/node-utils');
const { parseComponent, createComponent, applyComponentProps } = require('../lib/components');
const { createScene } = require('../lib/templates');

/**
 * 从 JSON 定义创建场景数据
 */
function createSceneData(nodeDefs, sceneName) {
    const data = createScene(sceneName);
    
    // Canvas 节点索引
    const canvasIndex = 2;

    // 支持数组或单个节点
    const nodes = Array.isArray(nodeDefs) ? nodeDefs : [nodeDefs];
    
    // 添加用户节点到 Canvas
    for (const nodeDef of nodes) {
        addUserNode(data, nodeDef, canvasIndex);
    }

    return data;
}

/**
 * 添加用户节点
 */
function addUserNode(data, def, parentIndex) {
    const nodeIndex = data.length;
    const node = createNodeData(def.name || 'Node', parentIndex, def);
    
    data.push(node);
    
    // 添加组件
    if (def.components) {
        for (const compDef of def.components) {
            const parsed = parseComponent(compDef);
            if (parsed) {
                const comp = createComponent(parsed.type, nodeIndex);
                if (comp) {
                    applyComponentProps(comp, parsed.props, node);
                    data.push(comp);
                    node._components.push({ "__id__": data.length - 1 });
                }
            }
        }
    }
    
    // 更新父节点的 _children
    data[parentIndex]._children.push({ "__id__": nodeIndex });
    
    // 递归处理子节点
    if (def.children && def.children.length > 0) {
        for (const childDef of def.children) {
            addUserNode(data, childDef, nodeIndex);
        }
    }
}

function run(args) {
    if (args.length < 2) {
        outputError({ 
            message: '用法: cocos2d-cli create-scene <JSON文件路径> <输出路径.fire>',
            hint: '从 JSON 文件读取结构生成场景'
        });
        return;
    }

    const jsonPath = args[0];
    const outputPath = args[1];
    const sceneName = path.basename(outputPath, '.fire');

    if (!fs.existsSync(jsonPath)) {
        outputError(`JSON 文件不存在: ${jsonPath}`);
        return;
    }

    try {
        const input = fs.readFileSync(jsonPath, 'utf8');
        const cleanInput = input.replace(/^\uFEFF/, '').trim();
        const nodeDef = JSON.parse(cleanInput);

        const sceneData = createSceneData(nodeDef, sceneName);

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, JSON.stringify(sceneData, null, 2), 'utf8');

        let nodeCount = 0, compCount = 0;
        for (const item of sceneData) {
            if (item.__type__ === 'cc.Node') nodeCount++;
            else if (item.__type__?.startsWith('cc.') && !['cc.Scene', 'cc.SceneAsset'].includes(item.__type__)) {
                compCount++;
            }
        }

        outputSuccess({
            path: outputPath,
            nodes: nodeCount,
            components: compCount
        });

    } catch (err) {
        outputError(err.message);
    }
}

module.exports = { run };
