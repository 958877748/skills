/**
 * prefab-create 命令 - 从 JSON 结构创建预制体文件
 */

const fs = require('fs');
const path = require('path');
const { outputError } = require('../lib/utils');
const { buildTree } = require('../lib/node-utils');
const { parseComponent, createComponent, applyComponentProps } = require('../lib/components');
const { createPrefab, PrefabData, CCNode, CCPrefabInfo } = require('../lib/templates');
const { generateFileId, loadScriptMap } = require('../lib/fire-utils');

/**
 * 从 JSON 定义创建预制体数据
 */
function createPrefabData(nodeDef) {
    const prefabData = new PrefabData(nodeDef.name || 'Node');
    
    // 更新根节点属性
    applyNodeDefToNode(prefabData.getRoot(), nodeDef);
    
    // 递归添加子节点
    if (nodeDef.children && nodeDef.children.length > 0) {
        for (const childDef of nodeDef.children) {
            addChildFromDef(prefabData, childDef, 1);
        }
    }
    
    return prefabData;
}

/**
 * 应用 JSON 定义到节点
 */
function applyNodeDefToNode(node, def) {
    if (def.name) node._name = def.name;
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
}

/**
 * 添加子节点
 */
function addChildFromDef(prefabData, def, parentIndex) {
    const node = new CCNode(def.name || 'Node');
    node.setParent(parentIndex);
    
    // 应用属性
    applyNodeDefToNode(node, def);
    
    const nodeIndex = prefabData.data.length;
    prefabData.data[parentIndex].addChild(nodeIndex);
    
    // 创建 PrefabInfo
    const prefabInfo = new CCPrefabInfo(1, 0);
    
    prefabData.data.push(node, prefabInfo);
    node._prefab = { __id__: prefabData.data.length - 1 };
    
    // 添加组件
    if (def.components) {
        for (const compDef of def.components) {
            const parsed = parseComponent(compDef);
            if (parsed) {
                const comp = createComponent(parsed.type, nodeIndex);
                if (comp) {
                    applyComponentProps(comp, parsed.props, node);
                    prefabData.data.push(comp);
                    node.addComponent(prefabData.data.length - 1);
                }
            }
        }
    }
    
    // 递归处理子节点
    if (def.children && def.children.length > 0) {
        for (const childDef of def.children) {
            addChildFromDef(prefabData, childDef, nodeIndex);
        }
    }
}

function run(args) {
    if (args.length < 1) {
        outputError({ 
            message: '用法: cocos2d-cli create-prefab [JSON文件路径] <输出路径.prefab>',
            hint: '不传 JSON 则创建默认预制体'
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

    // 没有传 JSON，创建默认预制体
    if (!jsonPath) {
        const prefabName = path.basename(outputPath, '.prefab');
        
        try {
            if (fs.existsSync(outputPath)) {
                outputError(`文件已存在: ${outputPath}`);
                return;
            }
            
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const data = createPrefab(prefabName);
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

        const rootNode = Array.isArray(nodeDef) ? nodeDef[0] : nodeDef;
        const prefabData = createPrefabData(rootNode);

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const data = prefabData.toJSON();
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');

        const scriptMap = loadScriptMap(outputPath);
        console.log(buildTree(data, scriptMap, 1).trim());

    } catch (err) {
        outputError(err.message);
    }
}

module.exports = { run };
