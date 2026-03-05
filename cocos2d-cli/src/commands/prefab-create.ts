import * as fs from 'fs';
import * as path from 'path';
import { outputError, outputSuccess } from '../lib/utils';
import { parseColor } from '../lib/utils';
import { createNodeData } from '../lib/node-utils';
import { parseComponent, createComponent, applyComponentProps } from '../lib/components';
import { createPrefab } from '../lib/templates';
import { generateFileId } from '../lib/fire-utils';
import { SceneData } from '../lib/types';

interface NodeDef {
    name?: string;
    active?: boolean;
    opacity?: number;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    anchorX?: number;
    anchorY?: number;
    color?: string;
    components?: (string | Record<string, unknown>)[];
    children?: NodeDef[];
}

function createPrefabData(nodeDef: NodeDef): SceneData {
    const data = createPrefab(nodeDef.name || 'Node') as SceneData;
    
    const root = data[1];
    applyNodeDefToNode(root, nodeDef, null);
    
    if (nodeDef.children && nodeDef.children.length > 0) {
        for (const childDef of nodeDef.children) {
            addChildNode(data, childDef, 1);
        }
    }
    
    return data;
}

function applyNodeDefToNode(node: unknown, def: NodeDef, parentId: number | null): void {
    const n = node as Record<string, unknown>;
    if (def.name) n._name = def.name;
    if (def.active !== undefined) n._active = def.active;
    if (def.opacity !== undefined) n._opacity = def.opacity;
    if (def.width !== undefined) (n._contentSize as Record<string, number>).width = def.width;
    if (def.height !== undefined) (n._contentSize as Record<string, number>).height = def.height;
    if (def.x !== undefined) (n._trs as { array: number[] }).array[0] = def.x;
    if (def.y !== undefined) (n._trs as { array: number[] }).array[1] = def.y;
    if (def.rotation !== undefined) {
        (n._trs as { array: number[] }).array[5] = def.rotation * Math.PI / 180;
        (n._eulerAngles as Record<string, number>).z = def.rotation;
    }
    if (def.scaleX !== undefined) (n._trs as { array: number[] }).array[7] = def.scaleX;
    if (def.scaleY !== undefined) (n._trs as { array: number[] }).array[8] = def.scaleY;
    if (def.anchorX !== undefined) (n._anchorPoint as Record<string, number>).x = def.anchorX;
    if (def.anchorY !== undefined) (n._anchorPoint as Record<string, number>).y = def.anchorY;
    if (def.color) {
        const parsed = parseColor(def.color);
        if (parsed) {
            n._color = { "__type__": "cc.Color", ...parsed };
        }
    }
    if (parentId !== null) {
        (n as { _parent: { __id__: number } })._parent = { "__id__": parentId };
    }
}

function addChildNode(data: SceneData, def: NodeDef, parentIndex: number): void {
    const nodeIndex = data.length;
    const node = createNodeData(def.name || 'Node', parentIndex, def as Record<string, string>);
    
    (node as { _prefab: null })._prefab = null;
    
    data.push(node);
    
    if (def.components) {
        for (const compDef of def.components) {
            const parsed = parseComponent(compDef as string | Record<string, unknown>);
            if (parsed) {
                const comp = createComponent(parsed.type, nodeIndex);
                if (comp) {
                    applyComponentProps(comp, parsed.props, node);
                    data.push(comp as unknown as SceneData[number]);
                    (node as { _components: { __id__: number }[] })._components.push({ "__id__": data.length - 1 });
                }
            }
        }
    }
    
    const prefabInfo = {
        "__type__": "cc.PrefabInfo",
        "root": { "__id__": 1 },
        "asset": { "__id__": 0 },
        "fileId": generateFileId(),
        "sync": false
    };
    data.push(prefabInfo as unknown as SceneData[number]);
    (node as { _prefab: { __id__: number } })._prefab = { "__id__": data.length - 1 };
    
    (data[parentIndex] as { _children: { __id__: number }[] })._children.push({ "__id__": nodeIndex });
    
    if (def.children && def.children.length > 0) {
        for (const childDef of def.children) {
            addChildNode(data, childDef, nodeIndex);
        }
    }
}

export function run(args: string[]): void {
    if (args.length < 1) {
        outputError('用法: cocos2d-cli create-prefab [JSON文件路径] <输出路径.prefab>');
        return;
    }

    let jsonPath: string | null = null;
    let outputPath: string;

    if (args.length === 1) {
        outputPath = args[0];
    } else {
        jsonPath = args[0];
        outputPath = args[1];
    }

    if (!jsonPath) {
        const prefabName = path.basename(outputPath, '.prefab');
        
        try {
            if (fs.existsSync(outputPath)) {
                outputError(`文件已存在: ${outputPath}`);
                return;
            }
            
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const data = createPrefab(prefabName);
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
            
            outputSuccess({ 
                path: outputPath,
                rootName: prefabName,
                nodes: 1,
                components: 0
            });
            return;
        } catch (err) {
            outputError((err as Error).message);
            return;
        }
    }

    if (!fs.existsSync(jsonPath)) {
        outputError(`JSON 文件不存在: ${jsonPath}`);
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
            if (item.__type__ === 'cc.Node') nodeCount++;
            else if (item.__type__?.startsWith('cc.') && !['cc.Prefab', 'cc.PrefabInfo'].includes(item.__type__)) {
                compCount++;
            }
        }

        outputSuccess({
            path: outputPath,
            nodes: nodeCount,
            components: compCount
        });

    } catch (err) {
        outputError((err as Error).message);
    }
}

export default { run };
