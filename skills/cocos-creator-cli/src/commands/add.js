/**
 * add 命令 - 添加节点
 */

const { validateSession, saveSession, buildMaps, reorderArrayToMatchChildren, findNodeIndex } = require('../lib/session');
const { Components, createNodeData } = require('../lib/components');

function run(args) {
    if (args.length < 2) {
        console.log(JSON.stringify({ error: '用法: cocos-cli add <父节点> <节点名称> --session=<会话ID> [选项]' }));
        return;
    }
    
    const parentRef = args[0];
    const nodeName = args[1];
    const sessionId = args.find(a => a.startsWith('--session='))?.split('=')[1];
    
    if (!sessionId) {
        console.log(JSON.stringify({ error: '缺少 --session 参数' }));
        return;
    }
    
    // 解析选项
    const options = {};
    args.slice(2).forEach(arg => {
        if (arg.startsWith('--') && !arg.startsWith('--session')) {
            const [key, value] = arg.substring(2).split('=');
            if (key === 'type') options.type = value;
            else if (key === 'x') options.x = parseFloat(value) || 0;
            else if (key === 'y') options.y = parseFloat(value) || 0;
            else if (key === 'width') options.width = parseFloat(value) || 0;
            else if (key === 'height') options.height = parseFloat(value) || 0;
            else if (key === 'at') options.at = parseInt(value);
            else if (key === 'active') options.active = value !== 'false';
        }
    });
    
    const validation = validateSession(sessionId);
    
    if (!validation.valid) {
        console.log(JSON.stringify({ error: validation.error }));
        return;
    }
    
    const session = validation.session;
    const sessionPath = validation.sessionPath;
    const data = session.data;
    
    // 查找父节点
    const parentIndex = findNodeIndex(data, session.indexMap, parentRef);
    
    if (parentIndex === null || !data[parentIndex]) {
        console.log(JSON.stringify({ error: `找不到父节点: ${parentRef}` }));
        return;
    }
    
    const parentNode = data[parentIndex];
    
    // 添加新节点
    const newNodeIndex = data.length;
    const newNode = createNodeData(nodeName, parentIndex, options);
    data.push(newNode);
    
    // 添加组件
    if (options.type) {
        const compData = Components[options.type]?.(newNodeIndex);
        if (compData) {
            data.push(compData);
            newNode._components.push({ "__id__": data.length - 1 });
        }
    }
    
    // 更新父节点的 _children
    if (!parentNode._children) parentNode._children = [];
    
    const insertPosition = options.at >= 0 ? options.at : parentNode._children.length;
    if (insertPosition < parentNode._children.length) {
        parentNode._children.splice(insertPosition, 0, { "__id__": newNodeIndex });
    } else {
        parentNode._children.push({ "__id__": newNodeIndex });
    }
    
    // 重新排列数组以匹配 _children 顺序
    session.data = reorderArrayToMatchChildren(data);
    
    // 重建映射
    const maps = buildMaps(session.data);
    session.idMap = maps.idMap;
    session.indexMap = maps.indexMap;
    
    // 找到新节点的位置
    let actualNewIndex = -1;
    for (const [idx, info] of Object.entries(session.indexMap)) {
        if (info.name === nodeName) {
            actualNewIndex = parseInt(idx);
            break;
        }
    }
    
    // 保存会话
    saveSession(sessionPath, session);
    
    console.log(JSON.stringify({
        success: true,
        index: actualNewIndex,
        _id: newNode._id,
        name: nodeName,
        parentIndex,
        message: `节点 "${nodeName}" 已添加到 ${parentNode._name}`
    }, null, 2));
}

module.exports = { run };
