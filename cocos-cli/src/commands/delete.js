/**
 * delete 命令 - 删除节点
 */

const { validateSession, saveSession, buildMaps, collectNodeAndChildren, rebuildReferences, findNodeIndex } = require('../lib/session');

function run(args) {
    if (args.length < 1) {
        console.log(JSON.stringify({ error: '用法: cocos-cli delete <节点索引|名称> --session=<会话ID>' }));
        return;
    }
    
    const nodeRef = args[0];
    const sessionId = args.find(a => a.startsWith('--session='))?.split('=')[1];
    
    if (!sessionId) {
        console.log(JSON.stringify({ error: '缺少 --session 参数' }));
        return;
    }
    
    const validation = validateSession(sessionId);
    
    if (!validation.valid) {
        console.log(JSON.stringify({ error: validation.error }));
        return;
    }
    
    const session = validation.session;
    const sessionPath = validation.sessionPath;
    const data = session.data;
    
    // 查找节点
    const nodeIndex = findNodeIndex(data, session.indexMap, nodeRef);
    
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
    
    // 重建映射
    const maps = buildMaps(data);
    session.idMap = maps.idMap;
    session.indexMap = maps.indexMap;
    
    // 保存会话
    saveSession(sessionPath, session);
    
    console.log(JSON.stringify({
        success: true,
        message: `节点 "${nodeName}" 已删除`,
        deletedCount: indicesToDelete.size
    }, null, 2));
}

module.exports = { run };
