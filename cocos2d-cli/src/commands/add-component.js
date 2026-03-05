/**
 * add-component 命令 - 给已存在的节点添加组件
 */

const { loadScene, saveScene, buildMaps, findNodeIndex, refreshEditor } = require('../lib/fire-utils');
const { outputError, outputSuccess, generateId } = require('../lib/utils');
const { createComponent } = require('../lib/components');
const fs = require('fs');
const path = require('path');

// 加载脚本映射
function loadScriptMap(projectPath) {
    const mapPath = path.join(projectPath, 'data', 'script_map.json');
    try {
        if (fs.existsSync(mapPath)) {
            return JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
        }
    } catch (e) {}
    return {};
}

// 创建自定义脚本组件
function createScriptComponent(scriptUuid, nodeId, scriptMap) {
    const scriptInfo = scriptMap[scriptUuid];
    const typeName = scriptInfo ? scriptInfo.name : scriptUuid;
    
    return {
        "__type__": typeName,
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_id": generateId()
    };
}

function run(args) {
    if (args.length < 3) {
        outputError('用法: cocos2d-cli add-component <场景文件路径> <节点路径> <组件类型>');
        return;
    }
    
    const scenePath = args[0];
    const nodeRef = args[1];
    const componentType = args[2];
    
    try {
        const data = loadScene(scenePath);
        const { indexMap } = buildMaps(data);
        
        const nodeIndex = findNodeIndex(data, indexMap, nodeRef);
        
        if (nodeIndex === null || !data[nodeIndex]) {
            outputError(`找不到节点: ${nodeRef}`);
            return;
        }
        
        const node = data[nodeIndex];
        
        // 检查是否已有该类型组件
        const ccType = 'cc.' + componentType.charAt(0).toUpperCase() + componentType.slice(1);
        const existingComp = node._components?.find(comp => {
            const compData = data[comp.__id__];
            if (!compData) return false;
            const compType = compData.__type__;
            return compType === componentType || compType === ccType;
        });
        
        if (existingComp) {
            outputError(`节点 "${node._name}" 已有 ${componentType} 组件`);
            return;
        }
        
        const compIndex = data.length;
        let componentData;
        
        // 尝试使用内置组件
        componentData = createComponent(componentType, nodeIndex);
        
        if (!componentData) {
            // 自定义脚本组件
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
        
        if (!node._components) node._components = [];
        node._components.push({ "__id__": compIndex });
        
        saveScene(scenePath, data);
        refreshEditor(scenePath);
        
        outputSuccess({
            componentIndex: compIndex,
            componentType: componentData.__type__,
            nodeIndex,
            nodeName: node._name
        });
    } catch (err) {
        outputError(err.message);
    }
}

module.exports = { run };
