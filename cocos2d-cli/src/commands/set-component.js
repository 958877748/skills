/**
 * set-component 命令 - 设置组件属性
 */

const path = require('path');
const fs = require('fs');
const { CCSceneAsset, CCPrefab } = require('../lib/cc');
const { buildTree } = require('../lib/node-utils');
const { loadScriptMap, isPrefab } = require('../lib/fire-utils');

/**
 * 查找节点
 */
function findNode(root, nodePath) {
    if (!nodePath) return root;
    
    const parts = nodePath.split('/').filter(p => p);
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

/**
 * 查找组件
 */
function findComponent(node, compType) {
    if (!node._components) return null;
    
    const type = compType.toLowerCase();
    const typeName = 'cc.' + type.charAt(0).toUpperCase() + type.slice(1);
    
    return node._components.find(c => c.__type__ === typeName);
}

function run(args) {
    if (args.length < 4) {
        console.log(JSON.stringify({ 
            error: '用法: cocos2d-cli set-component <场景.fire|预制体.prefab> <节点路径> <组件类型> <属性名> <值>' 
        }));
        return;
    }
    
    const filePath = args[0];
    const nodePath = args[1];
    const compType = args[2];
    const prop = args[3];
    const value = args[4];
    
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
        
        const comp = findComponent(node, compType);
        
        if (!comp) {
            console.log(JSON.stringify({ error: `组件不存在: ${compType}` }));
            return;
        }
        
        // 调用组件的 setProp 方法
        if (typeof comp.setProp !== 'function') {
            console.log(JSON.stringify({ error: '组件不支持 setProp 方法' }));
            return;
        }
        
        // 构造属性对象并调用 setProp
        const props = { [prop]: value };
        comp.setProp(props);
        
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
