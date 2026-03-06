/**
 * set 命令 - 设置节点或组件属性
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
 * 设置节点属性值
 */
function setNodeProp(node, prop, value) {
    switch (prop.toLowerCase()) {
        case 'name': node._name = value; return true;
        case 'active': node._active = value === 'true' || value === true; return true;
        case 'x': node._trs.array[0] = parseFloat(value); return true;
        case 'y': node._trs.array[1] = parseFloat(value); return true;
        case 'width': node._contentSize.width = parseFloat(value); return true;
        case 'height': node._contentSize.height = parseFloat(value); return true;
        case 'scalex': node._trs.array[7] = parseFloat(value); return true;
        case 'scaley': node._trs.array[8] = parseFloat(value); return true;
        case 'rotation':
            node._trs.array[5] = parseFloat(value) * Math.PI / 180;
            node._eulerAngles.z = parseFloat(value);
            return true;
        case 'anchorx': node._anchorPoint.x = parseFloat(value); return true;
        case 'anchory': node._anchorPoint.y = parseFloat(value); return true;
        case 'opacity': node._opacity = parseInt(value); return true;
        default: return false;
    }
}

function run(args) {
    if (args.length < 4) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli set <场景.fire|预制体.prefab> <节点路径> <属性名|组件.属性> <值>' }));
        return;
    }
    
    const filePath = args[0];
    const nodePath = args[1];
    const propPath = args[2];
    const value = args[3];
    
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
        
        // 检查是否是组件属性（格式: 组件.属性）
        const parts = propPath.split('.');
        
        if (parts.length === 2) {
            // 组件属性
            const comp = findComponent(node, parts[0]);
            if (!comp) {
                console.log(JSON.stringify({ error: `组件不存在: ${parts[0]}` }));
                return;
            }
            
            if (comp[parts[1]] === undefined) {
                console.log(JSON.stringify({ error: `属性不存在: ${parts[1]}` }));
                return;
            }
            
            comp[parts[1]] = value;
        } else {
            // 节点属性
            if (!setNodeProp(node, propPath, value)) {
                console.log(JSON.stringify({ error: `属性不存在: ${propPath}` }));
                return;
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
