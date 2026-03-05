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
const utils_2 = require("../lib/utils");
const node_utils_1 = require("../lib/node-utils");
const components_1 = require("../lib/components");
const templates_1 = require("../lib/templates");
const fire_utils_1 = require("../lib/fire-utils");
function createPrefabData(nodeDef) {
    const data = (0, templates_1.createPrefab)(nodeDef.name || 'Node');
    const root = data[1];
    applyNodeDefToNode(root, nodeDef, null);
    if (nodeDef.children && nodeDef.children.length > 0) {
        for (const childDef of nodeDef.children) {
            addChildNode(data, childDef, 1);
        }
    }
    return data;
}
function applyNodeDefToNode(node, def, parentId) {
    const n = node;
    if (def.name)
        n._name = def.name;
    if (def.active !== undefined)
        n._active = def.active;
    if (def.opacity !== undefined)
        n._opacity = def.opacity;
    if (def.width !== undefined)
        n._contentSize.width = def.width;
    if (def.height !== undefined)
        n._contentSize.height = def.height;
    if (def.x !== undefined)
        n._trs.array[0] = def.x;
    if (def.y !== undefined)
        n._trs.array[1] = def.y;
    if (def.rotation !== undefined) {
        n._trs.array[5] = def.rotation * Math.PI / 180;
        n._eulerAngles.z = def.rotation;
    }
    if (def.scaleX !== undefined)
        n._trs.array[7] = def.scaleX;
    if (def.scaleY !== undefined)
        n._trs.array[8] = def.scaleY;
    if (def.anchorX !== undefined)
        n._anchorPoint.x = def.anchorX;
    if (def.anchorY !== undefined)
        n._anchorPoint.y = def.anchorY;
    if (def.color) {
        const parsed = (0, utils_2.parseColor)(def.color);
        if (parsed) {
            n._color = { "__type__": "cc.Color", ...parsed };
        }
    }
    if (parentId !== null) {
        n._parent = { "__id__": parentId };
    }
}
function addChildNode(data, def, parentIndex) {
    const nodeIndex = data.length;
    const node = (0, node_utils_1.createNodeData)(def.name || 'Node', parentIndex, def);
    node._prefab = null;
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
    const prefabInfo = {
        "__type__": "cc.PrefabInfo",
        "root": { "__id__": 1 },
        "asset": { "__id__": 0 },
        "fileId": (0, fire_utils_1.generateFileId)(),
        "sync": false
    };
    data.push(prefabInfo);
    node._prefab = { "__id__": data.length - 1 };
    data[parentIndex]._children.push({ "__id__": nodeIndex });
    if (def.children && def.children.length > 0) {
        for (const childDef of def.children) {
            addChildNode(data, childDef, nodeIndex);
        }
    }
}
function run(args) {
    if (args.length < 1) {
        (0, utils_1.outputError)('用法: cocos2d-cli create-prefab [JSON文件路径] <输出路径.prefab>');
        return;
    }
    let jsonPath = null;
    let outputPath;
    if (args.length === 1) {
        outputPath = args[0];
    }
    else {
        jsonPath = args[0];
        outputPath = args[1];
    }
    if (!jsonPath) {
        const prefabName = path.basename(outputPath, '.prefab');
        try {
            if (fs.existsSync(outputPath)) {
                (0, utils_1.outputError)(`文件已存在: ${outputPath}`);
                return;
            }
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const data = (0, templates_1.createPrefab)(prefabName);
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
            (0, utils_1.outputSuccess)({
                path: outputPath,
                rootName: prefabName,
                nodes: 1,
                components: 0
            });
            return;
        }
        catch (err) {
            (0, utils_1.outputError)(err.message);
            return;
        }
    }
    if (!fs.existsSync(jsonPath)) {
        (0, utils_1.outputError)(`JSON 文件不存在: ${jsonPath}`);
        return;
    }
    try {
        const input = fs.readFileSync(jsonPath, 'utf8');
        const cleanInput = input.replace(/^\uFEFF/, '').trim();
        const nodeDef = JSON.parse(cleanInput);
        const rootNode = Array.isArray(nodeDef) ? nodeDef[0] : nodeDef;
        const prefabData = createPrefabData(rootNode);
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, JSON.stringify(prefabData, null, 2), 'utf8');
        let nodeCount = 0, compCount = 0;
        for (const item of prefabData) {
            if (item.__type__ === 'cc.Node')
                nodeCount++;
            else if (item.__type__?.startsWith('cc.') && !['cc.Prefab', 'cc.PrefabInfo'].includes(item.__type__)) {
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
//# sourceMappingURL=prefab-create.js.map