"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const fire_utils_1 = require("../lib/fire-utils");
const node_utils_1 = require("../lib/node-utils");
function run(args) {
    const filePath = args[0];
    if (!filePath) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli tree <场景.fire | 预制体.prefab>' }));
        return;
    }
    try {
        const data = (0, fire_utils_1.loadScene)(filePath);
        const scriptMap = (0, fire_utils_1.loadScriptMap)(filePath);
        const prefab = (0, fire_utils_1.isPrefab)(data);
        if (prefab) {
            console.log(`[Prefab] ${data[1]._name || 'Root'}\n`);
        }
        else {
            console.log(`[Scene]\n`);
        }
        console.log((0, node_utils_1.buildTree)(data, scriptMap, 1));
    }
    catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}
exports.default = { run };
//# sourceMappingURL=tree.js.map