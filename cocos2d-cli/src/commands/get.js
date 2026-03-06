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

        // 获取节点信息
        const trs = node._trs?.array || [0, 0, 0, 0, 0, 0, 1, 1, 1, 1];
        const result = {
            name: node._name,
            active: node._active,
            position: { x: trs[0], y: trs[1] },
            rotation: node._eulerAngles?.z ?? 0,
            scale: { x: trs[7], y: trs[8] },
            anchor: { x: node._anchorPoint?.x ?? 0.5, y: node._anchorPoint?.y ?? 0.5 },
            size: { w: node._contentSize?.width ?? 0, h: node._contentSize?.height ?? 0 },
            opacity: node._opacity ?? 255,
            group: node._groupIndex ?? 0
        };
        
        // 子节点名称
        if (node._children && node._children.length > 0) {
            result.children = node._children.map(c => c._name);
        }
        
        // 组件列表
        if (node._components && node._components.length > 0) {
            result.components = node._components.map(c => {
                const compInfo = {
                    type: c.__type__,
                    enabled: c._enabled
                };
                // 特殊属性
                if (c.__type__ === 'cc.Label') {
                    compInfo.string = c._string || c['_N$string'] || '';
                    compInfo.fontSize = c._fontSize || 40;
                } else if (c.__type__ === 'cc.Sprite') {
                    compInfo.sizeMode = c._sizeMode;
                } else if (c.__type__ === 'cc.Button') {
                    compInfo.interactable = c['_N$interactable'];
                    compInfo.transition = c.transition;
                } else if (c.__type__ === 'cc.Canvas') {
                    compInfo.designResolution = c._designResolution;
                } else if (c.__type__ === 'cc.Widget') {
                    compInfo.alignFlags = c._alignFlags;
                }
                return compInfo;
            });
        }

        console.log(JSON.stringify(result, null, 2));

    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };