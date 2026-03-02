/**
 * delete 命令 - 删除节点
 */

const { loadScene, saveScene, buildMaps, collectNodeAndChildren, rebuildReferences, findNodeIndex, refreshEditor } = require('../lib/fire-utils');

function run(args) {
    if (args.length < 2) {
        console.log(JSON.stringify({ error: '用法: cocos2.4 delete <场景文件路径> <节点索引|名称>' }));
        return;
    }
    
    const scenePath = args[0];
    const nodeRef = args[1];
    
    try {
        const data = loadScene(scenePath);
        const { indexMap } = buildMaps(data);
        
        // 查找节点
        const nodeIndex = findNodeIndex(data, indexMap, nodeRef);
        
        if (nodeIndex === null || !data[nodeIndex]) {
            console.log(JSON.stringify({ error: `找不到节点: ${nodeRef}` }));
            return;
        }
        
        if (nodeIndex <= 1) {
            console.log(JSON.stringify({ error: '不能删除根节点' }));
            return;
        }
        
        const node = data[nodeIndex];
        const nodeName = node._name;
        
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
        refreshEditor();
        
        console.log(JSON.stringify({
            success: true,
            message: `节点 "${nodeName}" 已删除`,
            deletedCount: indicesToDelete.size
        }, null, 2));
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };