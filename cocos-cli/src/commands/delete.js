/**
 * delete 命令 - 删除节点  
 */

const { loadScene, saveScene, collectNodeAndChildren, rebuildReferences, refreshEditor, loadScriptMap, buildTree } = require('../lib/fire-utils');

function run(args) {
    if (args.length < 2) {
        console.log(JSON.stringify({ error: '用法: cocos2.4 delete <场景文件路径> <节点索引>' }));
        return;
    }
    
    const scenePath = args[0];
    const nodeRef = args[1];
    
    // 节点必须使用数字索引
    if (!/^\d+$/.test(nodeRef)) {
        console.log(JSON.stringify({ error: '节点索引必须是数字，请先用 tree 命令查看节点索引' }));
        return;
    }
    
    try {
        const data = loadScene(scenePath);
        
        const nodeIndex = parseInt(nodeRef);
        
        if (!data[nodeIndex]) {
            console.log(JSON.stringify({ error: `无效的节点索引: ${nodeRef}` }));
            return;
        }
        
        if (nodeIndex <= 1) {
            console.log(JSON.stringify({ error: '不能删除根节点' }));
            return;
        }
        
        const node = data[nodeIndex];
        
        // 收集所有需要删除的索引（节点 + 子节点 + 组件）
        const indicesToDelete = collectNodeAndChildren(data, nodeIndex);
        
        // 从父节点的 _children 中移除引用
        if (node._parent) {
            const parentIndex = node._parent.__id__;
            const parent = data[parentIndex];
            if (parent && parent._children) {
                parent._children = parent._children.filter(c => c.__id__ !== nodeIndex);
            }
        }
        
        // 重建引用（更新所有 __id__）
        rebuildReferences(data, indicesToDelete);
        
        // 真正删除元素（从大到小排序，避免索引错乱）
        const sortedIndices = Array.from(indicesToDelete).sort((a, b) => b - a);
        for (const idx of sortedIndices) {
            data.splice(idx, 1);
        }
        
        // 保存场景
        saveScene(scenePath, data);
        
        // 触发编辑器刷新
        refreshEditor(scenePath);
        
        // 返回删除后的节点树
        const scriptMap = loadScriptMap(scenePath);
        console.log(buildTree(data, scriptMap, 1));
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };