/**
 * prefab-create 命令 - 从 JSON 结构创建预制体文件
 */

const fs = require('fs');
const path = require('path');
const { outputError } = require('../lib/utils');
const { buildTree } = require('../lib/node-utils');
const { createPrefab } = require('../lib/templates');
const { CCPrefab, CCPrefabInfo } = require('../lib/cc');
const { loadScriptMap } = require('../lib/fire-utils');
const { fromJSON } = require('../lib/json-parser');

/**
 * 为节点树添加 PrefabInfo
 */
function addPrefabInfo(node, isRoot = false) {
    node._prefab = new CCPrefabInfo();
    
    if (node._children) {
        node._children.forEach(child => addPrefabInfo(child, false));
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

    const prefabName = path.basename(outputPath, '.prefab');

    try {
        // 没有传 JSON，创建默认预制体
        if (!jsonPath) {
            if (fs.existsSync(outputPath)) {
                outputError(`文件已存在: ${outputPath}`);
                return;
            }
            
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const prefab = createPrefab(prefabName);
            const data = prefab.toJSON();
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
            
            const scriptMap = loadScriptMap(outputPath);
            console.log(buildTree(data, scriptMap, 1).trim());
            return;
        }

        // 从 JSON 文件创建
        if (!fs.existsSync(jsonPath)) {
            outputError(`JSON 文件不存在: ${jsonPath}`);
            return;
        }

        const input = fs.readFileSync(jsonPath, 'utf8');
        const rootNode = fromJSON(input);
        
        // 确保根节点名称
        if (!rootNode._name || rootNode._name === 'Node') {
            rootNode._name = prefabName;
        }
        
        // 为所有节点添加 PrefabInfo
        addPrefabInfo(rootNode, true);
        
        // 创建预制体
        const prefab = new CCPrefab();
        prefab._root = rootNode;

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const data = prefab.toJSON();
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');

        const scriptMap = loadScriptMap(outputPath);
        console.log(buildTree(data, scriptMap, 1).trim());

    } catch (err) {
        outputError(err.message);
    }
}

module.exports = { run };