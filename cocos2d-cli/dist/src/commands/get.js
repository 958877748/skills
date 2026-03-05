"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const fire_utils_1 = require("../lib/fire-utils");
const node_utils_1 = require("../lib/node-utils");
function run(args) {
    if (args.length < 2) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli get <场景.fire | 预制体.prefab> <节点索引|名称>' }));
        return;
    }
    const scenePath = args[0];
    const nodeRef = args[1];
    try {
        const data = (0, fire_utils_1.loadScene)(scenePath);
        const { indexMap } = (0, fire_utils_1.buildMaps)(data);
        const idx = (0, fire_utils_1.findNodeIndex)(data, indexMap, nodeRef);
        if (idx === null || idx < 0 || idx >= data.length) {
            console.log(JSON.stringify({ error: `无效的节点索引: ${nodeRef}` }));
            return;
        }
        const node = data[idx];
        if (!node) {
            console.log(JSON.stringify({ error: `节点不存在: ${nodeRef}` }));
            return;
        }
        console.log(JSON.stringify((0, node_utils_1.getNodeState)(data, node, idx)));
    }
    catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}
exports.default = { run };
//# sourceMappingURL=get.js.map