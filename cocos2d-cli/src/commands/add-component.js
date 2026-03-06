/**
 * add-component 命令 - 给节点添加组件
 */

const path = require('path');
const { SceneParser, PrefabParser, CCCanvas, CCWidget, CCSprite, CCLabel, CCButton, CCCamera } = require('../lib/cc');

/**
 * 创建组件
 */
function createComponent(type) {
    switch (type.toLowerCase()) {
        case 'canvas':
            return new CCCanvas();
        case 'widget':
            return new CCWidget();
        case 'sprite':
            return new CCSprite();
        case 'label':
            return new CCLabel();
        case 'button':
            return new CCButton();
        case 'camera':
            return new CCCamera();
        default:
            return null;
    }
}

function run(args) {
    if (args.length < 3) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli add-component <场景.fire|预制体.prefab> <节点路径> <组件类型>' }));
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
        
        // 检查是否已有该类型组件
        const ccType = 'cc.' + componentType.charAt(0).toUpperCase() + componentType.slice(1);
        const existingComp = node._components?.find(c => c.__type__ === ccType);
        
        if (existingComp) {
            console.log(JSON.stringify({ error: `节点已有 ${ccType} 组件` }));
            return;
        }
        
        // 创建组件
        const comp = createComponent(componentType);
        
        if (!comp) {
            console.log(JSON.stringify({ error: `未知组件类型: ${componentType}` }));
            return;
        }
        
        parser.addComponent(node, comp);
        
        // 保存
        parser.save(filePath);
        
        console.log(JSON.stringify({
            success: true,
            node: node._name,
            component: ccType
        }, null, 2));
        
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };