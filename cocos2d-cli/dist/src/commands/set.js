"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const fire_utils_1 = require("../lib/fire-utils");
const utils_1 = require("../lib/utils");
const node_utils_1 = require("../lib/node-utils");
function run(args) {
    if (args.length < 2) {
        (0, utils_1.outputError)('用法: cocos2d-cli set <场景.fire | 预制体.prefab> <节点索引|名称> [选项]');
        return;
    }
    const scenePath = args[0];
    const nodeRef = args[1];
    const options = (0, utils_1.parseOptions)(args, 2);
    try {
        const data = (0, fire_utils_1.loadScene)(scenePath);
        const { indexMap } = (0, fire_utils_1.buildMaps)(data);
        const nodeIndex = (0, fire_utils_1.findNodeIndex)(data, indexMap, nodeRef);
        if (nodeIndex === null || !data[nodeIndex]) {
            (0, utils_1.outputError)(`找不到节点: ${nodeRef}`);
            return;
        }
        const node = data[nodeIndex];
        (0, node_utils_1.setNodeProperties)(node, options);
        if (options.string !== undefined || options.fontSize !== undefined || options.lineHeight !== undefined) {
            const labelComp = (node._components || []).map(ref => data[ref.__id__]).find(c => c && c.__type__ === 'cc.Label');
            if (!labelComp) {
                (0, utils_1.outputError)(`节点 ${node._name} 没有 cc.Label 组件，无法设置文字属性`);
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
        (0, fire_utils_1.saveScene)(scenePath, data);
        (0, fire_utils_1.refreshEditor)(scenePath);
        (0, utils_1.outputJson)((0, node_utils_1.getNodeState)(data, node, nodeIndex));
    }
    catch (err) {
        (0, utils_1.outputError)(err.message);
    }
}
exports.default = { run };
//# sourceMappingURL=set.js.map