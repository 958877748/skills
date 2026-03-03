/**
 * remove 命令 - 删除节点或组件
 */

const { loadScene, saveScene, collectNodeAndChildren, rebuildReferences, refreshEditor, loadScriptMap, buildTree } = require('../lib/fire-utils');

function run(args) {
    if (args.length < 2) {
        console.log(JSON.stringify({ error: '用法: cocos2.4 remove <场景文件路径> <索引>' }));
        return;
    }
    
    const scenePath = args[0];
    
    // 索引必须是数字
    if (!/^\d+$/.test(args[1])) {
        console.log(JSON.stringify({ error: '索引必须是数字，请先用 tree 命令查看节点索引' }));
        return;
    }
    
    const index = parseInt(args[1]);
    
    try {
        let data = loadScene(scenePath);
        const scriptMap = loadScriptMap(scenePath);
        
        // 检查索引是否存在
        if (!data[index]) {
            console.log(JSON.stringify({ error: `索引 ${index} 不存在` }));
            return;
        }
        
        const item = data[index];
        const itemType = item.__type__;
        
        // 判断是节点还是组件
        const isNode = itemType === 'cc.Node' || itemType === 'cc.Scene' || item._name !== undefined;
        const isComponent = item.node !== undefined;
        
        if (isNode && index <= 1) {
            console.log(JSON.stringify({ error: '不能删除根节点' }));
            return;
        }
        
        if (isComponent) {
            // 删除组件
            const nodeId = item.node.__id__;
            const node = data[nodeId];
            
            if (node && node._components) {
                node._components = node._components.filter(c => c.__id__ !== index);
            }
            
            // 真正从数组中删除组件并重建引用
            const indicesToDelete = new Set([index]);
            rebuildReferences(data, indicesToDelete);
            data.splice(index, 1);
            
        } else {
            // 删除节点
            // 收集所有需要删除的索引
            const indicesToDelete = collectNodeAndChildren(data, index);
            
            // 从父节点的 _children 中移除引用
            if (item._parent) {
                const parentIndex = item._parent.__id__;
                const parent = data[parentIndex];
                if (parent && parent._children) {
                    parent._children = parent._children.filter(c => c.__id__ !== index);
                }
            }
            
            // 重建引用
            rebuildReferences(data, indicesToDelete);
            
            // 删除元素
            const sortedIndices = Array.from(indicesToDelete).sort((a, b) => b - a);
            for (const idx of sortedIndices) {
                data.splice(idx, 1);
            }
        }
        
        // 保存场景
        saveScene(scenePath, data);
        
        // 触发编辑器刷新
        refreshEditor(scenePath);
        
        // 重新加载并显示最新树
        data = loadScene(scenePath);
        console.log(buildTree(data, scriptMap, 1));
        
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };
