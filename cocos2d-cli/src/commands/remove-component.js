/**
 * remove-component 命令 - 删除节点组件
 */

const path = require('path');
const { SceneParser, PrefabParser } = require('../lib/cc');

function run(args) {
    if (args.length < 3) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli remove-component <场景.fire|预制体.prefab> <节点路径> <组件类型>' }));
        return;
    }
    
    const filePath = args[0];
    const nodePath = args[1];
    const componentType = args[2];
    
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
        
        // 查找组件
        const ccType = 'cc.' + componentType.charAt(0).toUpperCase() + componentType.slice(1);
        const comp = node._components?.find(c => c.__type__ === ccType);
        
        if (!comp) {
            console.log(JSON.stringify({ error: `节点没有 ${ccType} 组件` }));
            return;
        }
        
        // 删除组件
        parser.removeComponent(comp);
        
        // 保存
        parser.save(filePath);
        
        // 输出组件列表
        const compNames = node._components.map(c => c.__type__.replace('cc.', ''));
        console.log(`components[${compNames.join(', ')}]`);
        
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };
