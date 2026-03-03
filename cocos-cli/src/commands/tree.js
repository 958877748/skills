/**
 * tree 命令 - 查看节点树 
 */

const { loadScene, loadScriptMap, buildTree } = require('../lib/fire-utils');

function run(args) {
    const scenePath = args[0];
    
    if (!scenePath) {
        console.log(JSON.stringify({ error: '用法: cocos2.4 tree <场景文件路径>' }));
        return;
    }
    
    try {
        const data = loadScene(scenePath);
        const scriptMap = loadScriptMap(scenePath);
        console.log(buildTree(data, scriptMap, 1));
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };
