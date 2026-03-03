/**
 * add-component 命令 - 给已存在的节点添加组件
 */

const { loadScene, saveScene, buildMaps, findNodeIndex, refreshEditor } = require('../lib/fire-utils');
const { Components, generateId } = require('../lib/components');
const fs = require('fs');
const path = require('path');

// 加载脚本映射
function loadScriptMap(projectPath) {
    const mapPath = path.join(projectPath, 'data', 'script_map.json');
    try {
        if (fs.existsSync(mapPath)) {
            return JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
        }
    } catch (e) {
        // 忽略错误
    }
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
        console.log(JSON.stringify({ 
            error: '用法: cocos2.4 add-component <场景文件路径> <节点路径> <组件类型>' 
        }));
        return;
    }
    
    const scenePath = args[0];
    const nodeRef = args[1];
    const componentType = args[2];
    
    try {
        const data = loadScene(scenePath);
        const { indexMap } = buildMaps(data);
        
        // 查找节点
        const nodeIndex = findNodeIndex(data, indexMap, nodeRef);
        
        if (nodeIndex === null || !data[nodeIndex]) {
            console.log(JSON.stringify({ error: `找不到节点: ${nodeRef}` }));
            return;
        }
        
        const node = data[nodeIndex];
        
        // 检查是否已有该类型组件
        const existingComp = node._components?.find(comp => {
            const compData = data[comp.__id__];
            if (!compData) return false;
            const compType = compData.__type__;
            return compType === componentType || compType === 'cc.' + componentType.charAt(0).toUpperCase() + componentType.slice(1);
        });
        
        if (existingComp) {
            console.log(JSON.stringify({ 
                error: `节点 "${node._name}" 已有 ${componentType} 组件`,
                nodeIndex,
                nodeName: node._name
            }));
            return;
        }
        
        // 加载脚本映射（从场景文件所在项目的 data 目录）
        const projectPath = path.dirname(scenePath);
        const scriptMap = loadScriptMap(projectPath);
        
        // 创建组件
        let componentData;
        const compIndex = data.length;
        
        // 检查是否是内置组件
        const builtInTypes = ['sprite', 'label', 'button', 'layout', 'widget', 'camera', 'canvas', 'particleSystem'];
        
        if (builtInTypes.includes(componentType.toLowerCase())) {
            // 内置组件
            const typeKey = componentType.toLowerCase();
            componentData = Components[typeKey]?.(nodeIndex);
            
            if (!componentData) {
                console.log(JSON.stringify({ error: `不支持的组件类型: ${componentType}` }));
                return;
            }
        } else {
            // 自定义脚本组件 - 查找脚本UUID
            let scriptUuid = null;
            
            // 在 scriptMap 中查找
            for (const [uuid, info] of Object.entries(scriptMap)) {
                if (info.name === componentType) {
                    scriptUuid = uuid;
                    break;
                }
            }
            
            // 如果没找到，尝试直接使用 componentType 作为类型名
            if (!scriptUuid) {
                // 检查是否是有效的 UUID 格式
                const uuidRegex = /^[a-f0-9-]{36}$/i;
                if (uuidRegex.test(componentType)) {
                    scriptUuid = componentType;
                }
            }
            
            componentData = createScriptComponent(scriptUuid || componentType, nodeIndex, scriptMap);
        }
        
        // 添加组件到数组
        data.push(componentData);
        
        // 更新节点的 _components
        if (!node._components) node._components = [];
        node._components.push({ "__id__": compIndex });
        
        // 保存场景
        saveScene(scenePath, data);
        
        // 触发编辑器刷新（传入场景路径以重新打开场景）
        refreshEditor(scenePath);
        
        console.log(JSON.stringify({
            success: true,
            componentIndex: compIndex,
            componentType: componentData.__type__,
            nodeIndex,
            nodeName: node._name,
            message: `组件 "${componentData.__type__}" 已添加到节点 "${node._name}"`
        }, null, 2));
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };