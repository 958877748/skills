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
const fire_utils_1 = require("../lib/fire-utils");
const utils_1 = require("../lib/utils");
const components_1 = require("../lib/components");
function loadScriptMap(projectPath) {
    const mapPath = path.join(projectPath, 'data', 'script_map.json');
    try {
        if (fs.existsSync(mapPath)) {
            return JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
        }
    }
    catch (e) { }
    return {};
}
function createScriptComponent(scriptUuid, nodeId, scriptMap) {
    const scriptInfo = scriptUuid ? scriptMap[scriptUuid] : undefined;
    const typeName = scriptInfo ? scriptInfo.name : scriptUuid || '';
    return {
        "__type__": typeName,
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_id": (0, utils_1.generateId)()
    };
}
function run(args) {
    if (args.length < 3) {
        (0, utils_1.outputError)('用法: cocos2d-cli add-component <场景文件路径> <节点路径> <组件类型>');
        return;
    }
    const scenePath = args[0];
    const nodeRef = args[1];
    const componentType = args[2];
    try {
        const data = (0, fire_utils_1.loadScene)(scenePath);
        const { indexMap } = (0, fire_utils_1.buildMaps)(data);
        const nodeIndex = (0, fire_utils_1.findNodeIndex)(data, indexMap, nodeRef);
        if (nodeIndex === null || !data[nodeIndex]) {
            (0, utils_1.outputError)(`找不到节点: ${nodeRef}`);
            return;
        }
        const node = data[nodeIndex];
        const ccType = 'cc.' + componentType.charAt(0).toUpperCase() + componentType.slice(1);
        const existingComp = node._components?.find(comp => {
            const compData = data[comp.__id__];
            if (!compData)
                return false;
            const compType = compData.__type__;
            return compType === componentType || compType === ccType;
        });
        if (existingComp) {
            (0, utils_1.outputError)(`节点 "${node._name}" 已有 ${componentType} 组件`);
            return;
        }
        const compIndex = data.length;
        let componentData;
        componentData = (0, components_1.createComponent)(componentType, nodeIndex);
        if (!componentData) {
            const projectPath = path.dirname(scenePath);
            const scriptMap = loadScriptMap(projectPath);
            let scriptUuid = null;
            for (const [uuid, info] of Object.entries(scriptMap)) {
                if (info.name === componentType) {
                    scriptUuid = uuid;
                    break;
                }
            }
            const uuidRegex = /^[a-f0-9-]{36}$/i;
            if (!scriptUuid && uuidRegex.test(componentType)) {
                scriptUuid = componentType;
            }
            componentData = createScriptComponent(scriptUuid || componentType, nodeIndex, scriptMap);
        }
        data.push(componentData);
        if (!node._components)
            node._components = [];
        node._components.push({ "__id__": compIndex });
        (0, fire_utils_1.saveScene)(scenePath, data);
        (0, fire_utils_1.refreshEditor)(scenePath);
        (0, utils_1.outputSuccess)({
            componentIndex: compIndex,
            componentType: componentData.__type__,
            nodeIndex,
            nodeName: node._name
        });
    }
    catch (err) {
        (0, utils_1.outputError)(err.message);
    }
}
exports.default = { run };
//# sourceMappingURL=add-component.js.map