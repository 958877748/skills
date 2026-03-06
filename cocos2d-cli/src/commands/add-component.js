/**
 * add-component 命令 - 添加组件
 */

const path = require('path');
const fs = require('fs');
const { CCSceneAsset, CCPrefab, CCCanvas, CCWidget, CCSprite, CCLabel, CCButton, CCCamera } = require('../lib/cc');
const { buildTree } = require('../lib/node-utils');
const { loadScriptMap, isPrefab } = require('../lib/fire-utils');

/**
 * 创建组件
 */
function createComponent(type) {
    switch (type.toLowerCase()) {
        case 'canvas': return new CCCanvas();
        case 'widget': return new CCWidget();
        case 'sprite': return new CCSprite();
        case 'label': return new CCLabel();
        case 'button': return new CCButton();
        case 'camera': return new CCCamera();
        default: return null;
    }
}

/**
 * 查找节点
 */
function findNode(root, path) {
    if (!path) return root;
    
    const parts = path.split('/').filter(p => p);
    if (parts.length === 0) return root;
    
    let current = root;
    
    if (parts[0] === root._name) {
        parts.shift();
    }
    
    for (const part of parts) {
        if (!current._children || current._children.length === 0) return null;
        const found = current._children.find(c => c._name === part);
        if (!found) return null;
        current = found;
    }
    
    return current;
}

function run(args) {
    if (args.length < 3) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli add-component <场景.fire|预制体.prefab> <节点路径> <组件类型>' }));
        return;
    }
    
    const filePath = args[0];
    const nodePath = args[1];
    const compType = args[2];
    
    const ext = path.extname(filePath).toLowerCase();
    
    try {
        let root;
        let asset;
        const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (ext === '.fire') {
            asset = CCSceneAsset.fromJSON(json);
            root = asset._scene;
        } else if (ext === '.prefab') {
            asset = CCPrefab.fromJSON(json);
            root = asset._root;
        } else {
            console.log(JSON.stringify({ error: '不支持的文件类型，仅支持 .fire 和 .prefab' }));
            return;
        }
        
        const node = findNode(root, nodePath);
        
        if (!node) {
            console.log(JSON.stringify({ error: `节点不存在: ${nodePath}` }));
            return;
        }
        
        // 创建组件
        const comp = createComponent(compType);
        if (!comp) {
            console.log(JSON.stringify({ error: `不支持的组件类型: ${compType}` }));
            return;
        }
        
        comp.node = node;
        node._components = node._components || [];
        node._components.push(comp);
        
        // 保存
        const data = asset.toJSON();
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        
        // 输出节点树
        const scriptMap = loadScriptMap(filePath);
        const prefab = isPrefab(data);
        const startIndex = prefab ? 0 : 1;
        console.log(buildTree(data, scriptMap, startIndex).trim());
        
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };
