/**
 * get 命令 - 获取节点或组件属性
 */

const path = require('path');
const fs = require('fs');
const { CCSceneAsset, CCPrefab } = require('../lib/cc');

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
    if (args.length < 2) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli get <场景.fire|预制体.prefab> <节点路径> [属性名|组件类型]' }));
        return;
    }
    
    const filePath = args[0];
    const nodePath = args[1];
    const propOrComp = args[2];
    
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
        
        // 没有指定属性或组件，返回节点所有属性
        if (!propOrComp) {
            const props = node.getProp ? node.getProp() : {};
            console.log(JSON.stringify(props, null, 2));
            return;
        }
        
        // 检查是否是组件类型
        const comp = findComponent(node, propOrComp);
        if (comp) {
            const props = comp.getProp ? comp.getProp() : {};
            console.log(JSON.stringify(props, null, 2));
            return;
        }
        
        // 返回节点的单个属性
        const nodeProps = node.getProp ? node.getProp() : {};
        if (nodeProps[propOrComp] !== undefined) {
            console.log(JSON.stringify({ [propOrComp]: nodeProps[propOrComp] }, null, 2));
        } else {
            console.log(JSON.stringify({ error: `属性不存在: ${propOrComp}` }));
        }
        
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };
