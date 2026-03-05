/**
 * prefab-create 命令 - 从 JSON 结构创建预制体文件
 */

const fs = require('fs');
const path = require('path');
const { outputError, outputSuccess } = require('../lib/utils');
const { createNodeData } = require('../lib/node-utils');
const { parseComponent, createComponent, applyComponentProps } = require('../lib/components');
const { createPrefab, generateFileId } = require('../lib/templates');

/**
 * 从 JSON 定义创建预制体数据
 */
function createPrefabData(nodeDef) {
    const data = createPrefab(nodeDef.name || 'Node');
    
    // 更新根节点
    const root = data[1];
    applyNodeDefToNode(root, nodeDef, null);
    
    // 递归添加子节点
    if (nodeDef.children && nodeDef.children.length > 0) {
        for (const childDef of nodeDef.children) {
            addChildNode(data, childDef, 1);
        }
    }
    
    return data;
}

/**
 * 应用 JSON 定义到节点
 */
function applyNodeDefToNode(node, def, parentId) {
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
    if (parentId !== null) {
        node._parent = { "__id__": parentId };
    }
}

/**
 * 添加子节点
 */
function addChildNode(data, def, parentIndex) {
    const nodeIndex = data.length;
    const node = createNodeData(def.name || 'Node', parentIndex, def);
    
    // 设置 _prefab 为 null，后面会添加 PrefabInfo
    node._prefab = null;
    
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
    
    // 添加 PrefabInfo
    const prefabInfo = {
        "__type__": "cc.PrefabInfo",
        "root": { "__id__": 1 },
        "asset": { "__id__": 0 },
        "fileId": generateFileId(),
        "sync": false
    };
    data.push(prefabInfo);
    node._prefab = { "__id__": data.length - 1 };
    
    // 更新父节点
    data[parentIndex]._children.push({ "__id__": nodeIndex });
    
    // 递归处理子节点
    if (def.children && def.children.length > 0) {
        for (const childDef of def.children) {
            addChildNode(data, childDef, nodeIndex);
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
            
            outputSuccess({ 
                path: outputPath,
                rootName: prefabName,
                nodes: 1,
                components: 0
            });
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

        fs.writeFileSync(outputPath, JSON.stringify(prefabData, null, 2), 'utf8');

        let nodeCount = 0, compCount = 0;
        for (const item of prefabData) {
            if (item.__type__ === 'cc.Node') nodeCount++;
            else if (item.__type__?.startsWith('cc.') && !['cc.Prefab', 'cc.PrefabInfo'].includes(item.__type__)) {
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
