/**
 * get 命令 - 获取节点信息
 */

const { validateSession, findNodeIndex } = require('../lib/session');

function run(args) {
    if (args.length < 1) {
        console.log(JSON.stringify({ error: '用法: cocos-cli get <节点索引|名称> --session=<会话ID>' }));
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
    
    // 查找节点
    const idx = findNodeIndex(session.data, session.indexMap, nodeRef);
    
    if (idx === null || idx < 0 || idx >= session.data.length) {
        console.log(JSON.stringify({ error: `无效的节点索引: ${nodeRef}` }));
        return;
    }
    
    const node = session.data[idx];
    if (!node) {
        console.log(JSON.stringify({ error: `节点不存在: ${nodeRef}` }));
        return;
    }
    
    // 返回节点信息
    const info = session.indexMap[idx] || {};
    console.log(JSON.stringify({
        success: true,
        index: idx,
        ...info,
        node: {
            active: node._active,
            position: node._trs?.array?.slice(0, 2) || [0, 0],
            size: node._contentSize || { width: 0, height: 0 },
            children: node._children?.map(c => c.__id__) || [],
            components: node._components?.map(c => c.__id__) || []
        }
    }, null, 2));
}

module.exports = { run };
