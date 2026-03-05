/**
 * set 命令 - 修改节点属性
 */

const { loadScene, saveScene, buildMaps, findNodeIndex, refreshEditor } = require('../lib/fire-utils');
const { parseOptions, outputError, outputJson } = require('../lib/utils');
const { setNodeProperties, getNodeState } = require('../lib/node-utils');

function run(args) {
    if (args.length < 2) {
        outputError('用法: cocos2d-cli set <场景.fire | 预制体.prefab> <节点索引|名称> [选项]');
        return;
    }
    
    const scenePath = args[0];
    const nodeRef = args[1];
    const options = parseOptions(args, 2);
    
    try {
        const data = loadScene(scenePath);
        const { indexMap } = buildMaps(data);
        
        const nodeIndex = findNodeIndex(data, indexMap, nodeRef);
        
        if (nodeIndex === null || !data[nodeIndex]) {
            outputError(`找不到节点: ${nodeRef}`);
            return;
        }
        
        const node = data[nodeIndex];
        
        // 设置节点属性
        setNodeProperties(node, options);
        
        // 修改 Label 文字属性
        if (options.string !== undefined || options.fontSize !== undefined || options.lineHeight !== undefined) {
            const labelComp = (node._components || []).map(ref => data[ref.__id__]).find(c => c && c.__type__ === 'cc.Label');
            if (!labelComp) {
                outputError(`节点 ${node._name} 没有 cc.Label 组件，无法设置文字属性`);
                return;
            }
            if (options.string !== undefined) {
                labelComp._string = options.string;
                labelComp._N$string = options.string;
            }
            if (options.fontSize !== undefined) {
                labelComp._fontSize = parseInt(options.fontSize);
            }
            if (options.lineHeight !== undefined) {
                labelComp._lineHeight = parseInt(options.lineHeight);
            }
        }
        
        saveScene(scenePath, data);
        refreshEditor(scenePath);
        
        outputJson(getNodeState(data, node, nodeIndex));
    } catch (err) {
        outputError(err.message);
    }
}

module.exports = { run };