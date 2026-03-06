/**
 * tree 命令 - 查看节点树（支持场景和预制体）
 */

const { loadScene, loadScriptMap, isPrefab } = require('../lib/fire-utils');
const { buildTree } = require('../lib/node-utils');

function run(args) {
    const filePath = args[0];
    
    if (!filePath) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli tree <场景.fire | 预制体.prefab>' }));
        return;
    }
    
    try {
        const data = loadScene(filePath);
        const scriptMap = loadScriptMap(filePath);
        const prefab = isPrefab(data);
        
        // Prefab 从索引 0 开始，Scene 从索引 1 开始
        const startIndex = prefab ? 0 : 1;
        console.log(buildTree(data, scriptMap, startIndex).trim());
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };