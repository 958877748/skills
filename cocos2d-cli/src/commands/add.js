/**
 * add 命令 - 添加节点
 */

const path = require('path');
const { SceneParser, PrefabParser, CCNode, CCCanvas, CCWidget, CCSprite, CCLabel, CCButton } = require('../lib/cc');
const { buildTree } = require('../lib/node-utils');
const { loadScriptMap, isPrefab } = require('../lib/fire-utils');

/**
 * 解析命令行选项
 */
function parseOptions(args, startIndex) {
    const options = {};
    for (let i = startIndex; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const eqIndex = arg.indexOf('=');
            if (eqIndex > 0) {
                const key = arg.substring(2, eqIndex);
                let value = arg.substring(eqIndex + 1);
                // 转换数值
                if (!isNaN(value) && value !== '') {
                    value = parseFloat(value);
                }
                options[key] = value;
            }
        }
    }
    return options;
}

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
        default:
            return null;
    }
}

function run(args) {
    if (args.length < 3) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli add <场景.fire|预制体.prefab> <父节点路径> <节点名称> [--type=组件类型] [--x=N] [--y=N]' }));
        return;
    }
    
    const filePath = args[0];
    const parentPath = args[1];
    const nodeName = args[2];
    const options = parseOptions(args, 3);
    
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
        
        const parent = parser.resolveNode(parentPath);
        
        if (!parent) {
            console.log(JSON.stringify({ error: `父节点不存在: ${parentPath}` }));
            return;
        }
        
        // 创建节点
        const node = new CCNode(nodeName);
        
        // 应用属性
        if (options.x !== undefined) node._trs.array[0] = parseFloat(options.x);
        if (options.y !== undefined) node._trs.array[1] = parseFloat(options.y);
        if (options.width !== undefined) node._contentSize.width = parseFloat(options.width);
        if (options.height !== undefined) node._contentSize.height = parseFloat(options.height);
        if (options.scaleX !== undefined) node._trs.array[7] = parseFloat(options.scaleX);
        if (options.scaleY !== undefined) node._trs.array[8] = parseFloat(options.scaleY);
        if (options.rotation !== undefined) {
            node._trs.array[5] = parseFloat(options.rotation) * Math.PI / 180;
            node._eulerAngles.z = parseFloat(options.rotation);
        }
        if (options.active !== undefined) {
            node._active = options.active !== 'false' && options.active !== false;
        }
        
        // 添加组件
        if (options.type) {
            const comp = createComponent(options.type);
            if (comp) {
                parser.addComponent(node, comp);
                
                // 组件特殊属性
                if (options.type.toLowerCase() === 'label') {
                    if (options.string) {
                        comp._string = options.string;
                        comp['_N$string'] = options.string;
                    }
                    if (options.fontSize) {
                        comp._fontSize = parseInt(options.fontSize);
                        comp._lineHeight = parseInt(options.fontSize);
                    }
                }
            }
        }
        
        // 添加节点
        parser.addNode(node, parent);
        
        // 保存
        parser.save(filePath);
        
        // 输出节点树
        const data = parser.toJSON();
        const scriptMap = loadScriptMap(filePath);
        const prefab = isPrefab(data);
        const startIndex = prefab ? 0 : 1;
        console.log(buildTree(data, scriptMap, startIndex).trim());
        
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };