import * as fs from 'fs';
import * as path from 'path';
import { loadScene, saveScene, buildMaps, findNodeIndex, refreshEditor } from '../lib/fire-utils';
import { outputError, outputSuccess, generateId } from '../lib/utils';
import { createComponent } from '../lib/components';

function loadScriptMap(projectPath: string): Record<string, { name: string }> {
    const mapPath = path.join(projectPath, 'data', 'script_map.json');
    try {
        if (fs.existsSync(mapPath)) {
            return JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
        }
    } catch (e) {}
    return {};
}

function createScriptComponent(scriptUuid: string | null, nodeId: number, scriptMap: Record<string, { name: string }>): Record<string, unknown> {
    const scriptInfo = scriptUuid ? scriptMap[scriptUuid] : undefined;
    const typeName = scriptInfo ? scriptInfo.name : scriptUuid || '';
    
    return {
        "__type__": typeName,
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_id": generateId()
    };
}

export function run(args: string[]): void {
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
        
        const node = data[nodeIndex] as { _components?: { __id__: number }[]; _name: string };
        
        const ccType = 'cc.' + componentType.charAt(0).toUpperCase() + componentType.slice(1);
        const existingComp = node._components?.find(comp => {
            const compData = data[comp.__id__];
            if (!compData) return false;
            const compType = (compData as { __type__: string }).__type__;
            return compType === componentType || compType === ccType;
        });
        
        if (existingComp) {
            outputError(`节点 "${node._name}" 已有 ${componentType} 组件`);
            return;
        }
        
        const compIndex = data.length;
        let componentData;
        
        componentData = createComponent(componentType, nodeIndex);
        
        if (!componentData) {
            const projectPath = path.dirname(scenePath);
            const scriptMap = loadScriptMap(projectPath);
            
            let scriptUuid: string | null = null;
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
        
        if (!node._components) (node as { _components: { __id__: number }[] })._components = [];
        node._components.push({ "__id__": compIndex });
        
        saveScene(scenePath, data);
        refreshEditor(scenePath);
        
        outputSuccess({
            componentIndex: compIndex,
            componentType: (componentData as { __type__: string }).__type__,
            nodeIndex,
            nodeName: node._name
        });
    } catch (err) {
        outputError((err as Error).message);
    }
}

export default { run };
