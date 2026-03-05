"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("../lib/utils");
const node_utils_1 = require("../lib/node-utils");
const components_1 = require("../lib/components");
const templates_1 = require("../lib/templates");
function createSceneData(nodeDefs, sceneName) {
    const data = (0, templates_1.createScene)(sceneName);
    const canvasIndex = 2;
    const nodes = Array.isArray(nodeDefs) ? nodeDefs : [nodeDefs];
    for (const nodeDef of nodes) {
        addUserNode(data, nodeDef, canvasIndex);
    }
    return data;
}
function addUserNode(data, def, parentIndex) {
    const nodeIndex = data.length;
    const node = (0, node_utils_1.createNodeData)(def.name || 'Node', parentIndex, def);
    data.push(node);
    if (def.components) {
        for (const compDef of def.components) {
            const parsed = (0, components_1.parseComponent)(compDef);
            if (parsed) {
                const comp = (0, components_1.createComponent)(parsed.type, nodeIndex);
                if (comp) {
                    (0, components_1.applyComponentProps)(comp, parsed.props, node);
                    data.push(comp);
                    node._components.push({ "__id__": data.length - 1 });
                }
            }
        }
    }
    data[parentIndex]._children.push({ "__id__": nodeIndex });
    if (def.children && def.children.length > 0) {
        for (const childDef of def.children) {
            addUserNode(data, childDef, nodeIndex);
        }
    }
}
function run(args) {
    if (args.length < 2) {
        (0, utils_1.outputError)('用法: cocos2d-cli create-scene <JSON文件路径> <输出路径.fire>');
        return;
    }
    const jsonPath = args[0];
    const outputPath = args[1];
    const sceneName = path.basename(outputPath, '.fire');
    if (!fs.existsSync(jsonPath)) {
        (0, utils_1.outputError)(`JSON 文件不存在: ${jsonPath}`);
        return;
    }
    try {
        const input = fs.readFileSync(jsonPath, 'utf8');
        const cleanInput = input.replace(/^\uFEFF/, '').trim();
        const nodeDef = JSON.parse(cleanInput);
        const sceneData = createSceneData(nodeDef, sceneName);
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, JSON.stringify(sceneData, null, 2), 'utf8');
        let nodeCount = 0, compCount = 0;
        for (const item of sceneData) {
            if (item.__type__ === 'cc.Node')
                nodeCount++;
            else if (item.__type__?.startsWith('cc.') && !['cc.Scene', 'cc.SceneAsset'].includes(item.__type__)) {
                compCount++;
            }
        }
        (0, utils_1.outputSuccess)({
            path: outputPath,
            nodes: nodeCount,
            components: compCount
        });
    }
    catch (err) {
        (0, utils_1.outputError)(err.message);
    }
}
exports.default = { run };
//# sourceMappingURL=create-scene.js.map