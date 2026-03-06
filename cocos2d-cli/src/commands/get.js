/**
 * get 命令 - 获取节点或组件属性
 */

const path = require('path');
const fs = require('fs');
const { CCSceneAsset, CCPrefab } = require('../lib/cc');

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

/**
 * 查找组件
 */
function findComponent(node, compType) {
    if (!node._components) return null;
    
    const type = compType.toLowerCase();
    const typeName = 'cc.' + type.charAt(0).toUpperCase() + type.slice(1);
    
    return node._components.find(c => c.__type__ === typeName);
}

/**
 * 获取节点属性值
 */
function getNodeProp(node, prop) {
    switch (prop.toLowerCase()) {
        case 'name': return node._name;
        case 'active': return node._active;
        case 'x': return node._trs.array[0];
        case 'y': return node._trs.array[1];
        case 'width': return node._contentSize.width;
        case 'height': return node._contentSize.height;
        case 'scalex': return node._trs.array[7];
        case 'scaley': return node._trs.array[8];
        case 'rotation': return node._eulerAngles.z;
        case 'anchorx': return node._anchorPoint.x;
        case 'anchory': return node._anchorPoint.y;
        case 'opacity': return node._opacity;
        case 'color': return node._color;
        default: return undefined;
    }
}

function run(args) {
    if (args.length < 3) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli get <场景.fire|预制体.prefab> <节点路径> <属性名|组件.属性>' }));
        return;
    }
    
    const filePath = args[0];
    const nodePath = args[1];
    const propPath = args[2];
    
    const ext = path.extname(filePath).toLowerCase();
    
    try {
        let root;
        const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (ext === '.fire') {
            const asset = CCSceneAsset.fromJSON(json);
            root = asset._scene;
        } else if (ext === '.prefab') {
            const asset = CCPrefab.fromJSON(json);
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
        
        // 检查是否是组件属性（格式: 组件.属性）
        const parts = propPath.split('.');
        
        if (parts.length === 2) {
            // 组件属性
            const comp = findComponent(node, parts[0]);
            if (!comp) {
                console.log(JSON.stringify({ error: `组件不存在: ${parts[0]}` }));
                return;
            }
            
            const value = comp[parts[1]];
            if (value === undefined) {
                console.log(JSON.stringify({ error: `属性不存在: ${parts[1]}` }));
                return;
            }
            
            console.log(JSON.stringify({ value }));
        } else {
            // 节点属性
            const value = getNodeProp(node, propPath);
            if (value === undefined) {
                console.log(JSON.stringify({ error: `属性不存在: ${propPath}` }));
                return;
            }
            
            console.log(JSON.stringify({ value }));
        }
        
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };
