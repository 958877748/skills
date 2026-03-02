/**
 * get 命令 - 获取节点信息
 */

const { loadScene, buildMaps, findNodeIndex } = require('../lib/fire-utils');

function run(args) {
    if (args.length < 2) {
        console.log(JSON.stringify({ error: '用法: cocos2.4 get <场景文件路径> <节点索引|名称>' }));
        return;
    }
    
    const scenePath = args[0];
    const nodeRef = args[1];
    
    try {
        const data = loadScene(scenePath);
        const { indexMap } = buildMaps(data);
        
        // 查找节点
        const idx = findNodeIndex(data, indexMap, nodeRef);
        
        if (idx === null || idx < 0 || idx >= data.length) {
            console.log(JSON.stringify({ error: `无效的节点索引: ${nodeRef}` }));
            return;
        }
        
        const node = data[idx];
        if (!node) {
            console.log(JSON.stringify({ error: `节点不存在: ${nodeRef}` }));
            return;
        }
        
        // 返回节点信息
        const info = indexMap[idx] || {};
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
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };