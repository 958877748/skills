/**
 * add 命令 - 添加节点
 */

const { loadScene, saveScene, buildMaps, reorderArrayToMatchChildren, findNodeIndex, refreshEditor } = require('../lib/fire-utils');
const { Components, createNodeData } = require('../lib/components');

function run(args) {
    if (args.length < 3) {
        console.log(JSON.stringify({ error: '用法: cocos2.4 add <场景文件路径> <父节点> <节点名称> [选项]' }));
        return;
    }
    
    const scenePath = args[0];
    const parentRef = args[1];
    const nodeName = args[2];
    
    // 解析选项
    const options = {};
    args.slice(3).forEach(arg => {
        if (arg.startsWith('--')) {
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
    
    try {
        const data = loadScene(scenePath);
        const { indexMap } = buildMaps(data);
        
        // 查找父节点
        const parentIndex = findNodeIndex(data, indexMap, parentRef);
        
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
        const newData = reorderArrayToMatchChildren(data);
        
        // 重建映射以找到新节点的新位置
        const newMaps = buildMaps(newData);
        
        // 找到新节点的位置
        let actualNewIndex = -1;
        for (const [idx, info] of Object.entries(newMaps.indexMap)) {
            if (info.name === nodeName && info.path === (indexMap[parentIndex]?.path || '') + '/' + nodeName) {
                actualNewIndex = parseInt(idx);
                break;
            }
        }
        
        // 保存场景
        saveScene(scenePath, newData);
        
        // 触发编辑器刷新
        refreshEditor();
        
        console.log(JSON.stringify({
            success: true,
            index: actualNewIndex,
            _id: newNode._id,
            name: nodeName,
            parentIndex,
            message: `节点 "${nodeName}" 已添加到 ${parentNode._name}`
        }, null, 2));
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };