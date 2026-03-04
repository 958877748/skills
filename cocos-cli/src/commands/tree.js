/**
 * tree 命令 - 查看节点树（支持场景和预制体）
 */

const { loadScene, loadScriptMap, buildTree, isPrefab } = require('../lib/fire-utils');

function run(args) {
    const filePath = args[0];
    
    if (!filePath) {
        console.log(JSON.stringify({ error: '用法: cocos2.4 tree <场景.fire | 预制体.prefab>' }));
        return;
    }
    
    try {
        const data = loadScene(filePath);
        const scriptMap = loadScriptMap(filePath);
        const prefab = isPrefab(data);
        
        // 输出文件类型
        if (prefab) {
            console.log(`[Prefab] ${data[1]._name || 'Root'}\n`);
        } else {
            console.log(`[Scene]\n`);
        }
        
        console.log(buildTree(data, scriptMap, 1));
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };
