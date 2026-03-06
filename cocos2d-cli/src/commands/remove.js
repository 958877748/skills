/**
 * remove 命令 - 删除节点
 */

const path = require('path');
const fs = require('fs');
const { CCSceneAsset, CCPrefab } = require('../lib/cc');
const { buildTree } = require('../lib/node-utils');
const { loadScriptMap, isPrefab } = require('../lib/fire-utils');

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
    if (args.length < 2) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli remove <场景.fire|预制体.prefab> <节点路径>' }));
        return;
    }
    
    const filePath = args[0];
    const nodePath = args[1];
    
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
        
        // 不能删除根节点
        if (node === root) {
            console.log(JSON.stringify({ error: '不能删除根节点' }));
            return;
        }
        
        // 从父节点移除
        if (node._parent) {
            const idx = node._parent._children.indexOf(node);
            if (idx > -1) {
                node._parent._children.splice(idx, 1);
            }
        }
        
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
