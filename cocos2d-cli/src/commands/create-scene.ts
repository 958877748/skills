import * as fs from 'fs';
import * as path from 'path';
import { outputError, outputSuccess } from '../lib/utils';
import { createNodeData } from '../lib/node-utils';
import { parseComponent, createComponent, applyComponentProps } from '../lib/components';
import { createScene } from '../lib/templates';
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

function createSceneData(nodeDefs: NodeDef | NodeDef[], sceneName: string): SceneData {
    const data = createScene(sceneName) as SceneData;
    
    const canvasIndex = 2;
    
    const nodes = Array.isArray(nodeDefs) ? nodeDefs : [nodeDefs];
    
    for (const nodeDef of nodes) {
        addUserNode(data, nodeDef, canvasIndex);
    }

    return data;
}

function addUserNode(data: SceneData, def: NodeDef, parentIndex: number): void {
    const nodeIndex = data.length;
    const node = createNodeData(def.name || 'Node', parentIndex, def as Record<string, string>);
    
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
    
    (data[parentIndex] as { _children: { __id__: number }[] })._children.push({ "__id__": nodeIndex });
    
    if (def.children && def.children.length > 0) {
        for (const childDef of def.children) {
            addUserNode(data, childDef, nodeIndex);
        }
    }
}

export function run(args: string[]): void {
    if (args.length < 2) {
        outputError('用法: cocos2d-cli create-scene <JSON文件路径> <输出路径.fire>');
        return;
    }

    const jsonPath = args[0];
    const outputPath = args[1];
    const sceneName = path.basename(outputPath, '.fire');

    if (!fs.existsSync(jsonPath)) {
        outputError(`JSON 文件不存在: ${jsonPath}`);
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
            if (item.__type__ === 'cc.Node') nodeCount++;
            else if (item.__type__?.startsWith('cc.') && !['cc.Scene', 'cc.SceneAsset'].includes(item.__type__)) {
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
