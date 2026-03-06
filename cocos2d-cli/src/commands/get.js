/**
 * get 命令 - 获取节点信息
 */

const path = require('path');
const { SceneParser, PrefabParser } = require('../lib/cc');

function run(args) {
    if (args.length < 2) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli get <场景.fire | 预制体.prefab> <节点路径>' }));
        return;
    }
    
    const filePath = args[0];
    const nodePath = args[1];
    const ext = path.extname(filePath).toLowerCase();
    
    try {
        let parser;
        let node;
        
        if (ext === '.fire') {
            parser = SceneParser.parse(filePath);
        } else if (ext === '.prefab') {
            parser = PrefabParser.parse(filePath);
        } else {
            console.log(JSON.stringify({ error: '不支持的文件类型，仅支持 .fire 和 .prefab' }));
            return;
        }
        
        node = parser.resolveNode(nodePath);
        
        if (!node) {
            console.log(JSON.stringify({ error: `节点不存在: ${nodePath}` }));
            return;
        }

        console.log(JSON.stringify(node.toPanelJSON(), null, 2));

    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };