/**
 * remove-component 命令 - 删除节点上的组件
 */

const { loadScene, saveScene } = require('../lib/fire-utils');

function run(args) {
    if (args.length < 2) {
        console.log('用法: cocos2.4 remove-component <场景文件路径> <组件索引>');
        return;
    }
    
    const scenePath = args[0];
    const compIndex = parseInt(args[1]);
    
    if (isNaN(compIndex)) {
        console.log('错误: 组件索引必须是数字');
        return;
    }
    
    try {
        const data = loadScene(scenePath);
        
        // 检查组件数据是否存在
        const compData = data[compIndex];
        if (!compData) {
            console.log(`错误: 组件索引 ${compIndex} 不存在`);
            return;
        }
        
        const compType = compData.__type__;
        const nodeId = compData.node?.__id__;
        
        if (nodeId === undefined) {
            console.log(`错误: 组件 ${compIndex} 没有关联的节点`);
            return;
        }
        
        const node = data[nodeId];
        if (!node) {
            console.log(`错误: 组件关联的节点 ${nodeId} 不存在`);
            return;
        }
        
        // 从节点的 _components 中移除引用
        if (node._components) {
            node._components = node._components.filter(c => c.__id__ !== compIndex);
        }
        
        // 从数组中删除组件（设为 null，保持索引）
        data[compIndex] = null;
        
        // 保存场景
        saveScene(scenePath, data);
        
        console.log(`已删除组件: ${compType} (索引: ${compIndex})`);
        console.log(`从节点: ${node._name || '(unnamed)'} (索引: ${nodeId})`);
    } catch (err) {
        console.log(`错误: ${err.message}`);
    }
}

module.exports = { run };
