/**
 * remove 命令 - 删除节点
 */

const path = require('path');
const { SceneParser, PrefabParser } = require('../lib/cc');

function run(args) {
    if (args.length < 2) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli remove <场景.fire|预制体.prefab> <节点路径>' }));
        return;
    }
    
    const filePath = args[0];
    const nodePath = args[1];
    
    const ext = path.extname(filePath).toLowerCase();
    
    try {
        let parser;
        
        if (ext === '.fire') {
            parser = SceneParser.parse(filePath);
        } else if (ext === '.prefab') {
            parser = PrefabParser.parse(filePath);
        } else {
            console.log(JSON.stringify({ error: '不支持的文件类型，仅支持 .fire 和 .prefab' }));
            return;
        }
        
        const node = parser.resolveNode(nodePath);
        
        if (!node) {
            console.log(JSON.stringify({ error: `节点不存在: ${nodePath}` }));
            return;
        }
        
        const nodeName = node._name;
        
        // 删除节点
        const success = parser.removeNode(node);
        
        if (!success) {
            console.log(JSON.stringify({ error: '无法删除节点（可能是根节点）' }));
            return;
        }
        
        // 保存
        parser.save(filePath);
        
        console.log(JSON.stringify({
            success: true,
            removed: nodeName
        }, null, 2));
        
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };