/**
 * tree 命令 - 查看节点树
 */

const { validateSession } = require('../lib/session');

function run(args) {
    const sessionId = args.find(a => a.startsWith('--session='))?.split('=')[1];
    
    if (!sessionId) {
        console.log(JSON.stringify({ error: '用法: cocos-cli tree --session=<会话ID>' }));
        return;
    }
    
    const validation = validateSession(sessionId);
    
    if (!validation.valid) {
        console.log(JSON.stringify({ error: validation.error }));
        return;
    }
    
    const session = validation.session;
    const data = session.data;
    
    // 构建树形结构输出
    function buildTree(nodeIndex, prefix = '', isLast = true, isRoot = true) {
        const node = data[nodeIndex];
        if (!node) return '';
        
        const nodeName = isRoot ? 'Root' : (node._name || '(unnamed)');
        const active = node._active !== false ? '●' : '○';
        const connector = isRoot ? '' : (isLast ? '└── ' : '├── ');
        
        let result = prefix + (isRoot ? '' : active + ' ') + nodeName + ' #' + nodeIndex;
        
        // 添加组件信息
        if (node._components && node._components.length > 0) {
            const comps = node._components.map(c => {
                const comp = data[c.__id__];
                return comp ? comp.__type__.replace('cc.', '') : '?';
            }).join(', ');
            result += ` (${comps})`;
        }
        
        result += '\n';
        
        // 处理子节点
        if (node._children && node._children.length > 0) {
            node._children.forEach((childRef, idx) => {
                const childIsLast = idx === node._children.length - 1;
                const childPrefix = prefix + (isRoot ? '' : (isLast ? '    ' : '│   '));
                result += buildTree(childRef.__id__, childPrefix, childIsLast, false);
            });
        }
        
        return result;
    }
    
    const treeStr = buildTree(1);
    console.log(JSON.stringify({
        success: true,
        tree: treeStr
    }, null, 2));
}

module.exports = { run };