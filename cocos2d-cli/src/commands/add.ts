import * as fs from 'fs';
import * as path from 'path';
import { loadScene, saveScene, buildMaps, refreshEditor, isPrefab, generateFileId } from '../lib/fire-utils';
import { parseOptions, outputError, outputSuccess } from '../lib/utils';
import { createNodeData } from '../lib/node-utils';
import { createComponent } from '../lib/components';

function getRootPrefabInfoIndex(data: unknown[]): number {
    for (let i = data.length - 1; i >= 0; i--) {
        if ((data[i] as { __type__: string }).__type__ === 'cc.PrefabInfo') {
            const rootRef = (data[i] as { root?: { __id__: number } }).root?.__id__;
            if (rootRef === 1) return i;
        }
    }
    return data.length - 1;
}

function getSubtreeEndIndex(data: unknown[], nodeIndex: number): number {
    const node = data[nodeIndex] as { _children?: { __id__: number }[]; _components?: { __id__: number }[]; _prefab?: { __id__: number } } | undefined;
    if (!node) return nodeIndex;
    
    let lastIndex = nodeIndex;
    
    if (node._children) {
        for (const childRef of node._children) {
            const childEnd = getSubtreeEndIndex(data, childRef.__id__);
            lastIndex = Math.max(lastIndex, childEnd);
        }
    }
    
    if (node._components) {
        for (const compRef of node._components) {
            lastIndex = Math.max(lastIndex, compRef.__id__);
        }
    }
    
    if (node._prefab && nodeIndex !== 1) {
        lastIndex = Math.max(lastIndex, node._prefab.__id__);
    }
    
    return lastIndex;
}

function rebuildReferencesForInsert(data: unknown[], insertIndex: number, count: number): Record<number, number> {
    const indexMap: Record<number, number> = {};
    
    for (let oldIndex = 0; oldIndex < data.length; oldIndex++) {
        if (oldIndex < insertIndex) {
            indexMap[oldIndex] = oldIndex;
        } else {
            indexMap[oldIndex] = oldIndex + count;
        }
    }
    
    function updateRef(obj: unknown): void {
        if (!obj || typeof obj !== 'object') return;
        
        const o = obj as { __id__?: number };
        if (o.__id__ !== undefined) {
            const oldId = o.__id__;
            if (indexMap[oldId] !== undefined) {
                o.__id__ = indexMap[oldId];
            }
        } else {
            const o2 = obj as Record<string, unknown>;
            for (const key of Object.keys(o2)) {
                updateRef(o2[key]);
            }
        }
    }
    
    for (const item of data) {
        updateRef(item);
    }
    
    return indexMap;
}

export function run(args: string[]): void {
    if (args.length < 3) {
        outputError('用法: cocos2d-cli add <场景.fire | 预制体.prefab> <父节点索引> <节点名称> [选项]');
        return;
    }
    
    const filePath = args[0];
    const parentRef = args[1];
    const nodeName = args[2];
    
    const options = parseOptions(args, 3) as Record<string, string | number | boolean>;
    
    if (options.x) options.x = parseFloat(options.x as string) || 0;
    if (options.y) options.y = parseFloat(options.y as string) || 0;
    if (options.width) options.width = parseFloat(options.width as string) || 0;
    if (options.height) options.height = parseFloat(options.height as string) || 0;
    if (options.at !== undefined) options.at = parseInt(options.at as string);
    if (options.active !== undefined) options.active = options.active !== 'false';
    if (options.fontSize) options.fontSize = parseInt(options.fontSize as string) || 40;
    
    try {
        const data = loadScene(filePath);
        const { prefab } = buildMaps(data);
        
        if (!/^\d+$/.test(parentRef)) {
            outputError('父节点必须使用数字索引，请先用 tree 命令查看节点索引');
            return;
        }
        
        const parentIndex = parseInt(parentRef);
        
        if (parentIndex < 0 || parentIndex >= data.length || !data[parentIndex]) {
            outputError(`无效的节点索引: ${parentRef}`);
            return;
        }
        
        const parentNode = data[parentIndex] as { _children?: { __id__: number }[] };
        const isRootChild = prefab && parentIndex === 1;
        
        let insertIndex: number;
        
        if (!parentNode._children || parentNode._children.length === 0) {
            insertIndex = parentIndex + 1;
        } else {
            const targetPosition = (options.at as number) >= 0 ? options.at as number : parentNode._children.length;
            
            if (targetPosition === 0) {
                insertIndex = parentNode._children[0].__id__;
            } else if (targetPosition >= parentNode._children.length) {
                const lastChildRef = parentNode._children[parentNode._children.length - 1];
                insertIndex = getSubtreeEndIndex(data, lastChildRef.__id__) + 1;
            } else {
                insertIndex = parentNode._children[targetPosition].__id__;
            }
        }
        
        let newNodeIndex: number;
        
        if (prefab) {
            const rootPrefabInfoOldIdx = getRootPrefabInfoIndex(data);
            
            const nodeData = createNodeData(nodeName, parentIndex, options as Record<string, string>);
            
            let compData = null;
            if (options.type) {
                compData = createComponent(options.type as string, insertIndex);
                if (compData) {
                    if (options.type === 'label') {
                        if (options.fontSize) {
                            (compData as { _fontSize: number })._fontSize = options.fontSize as number;
                            (compData as { _lineHeight: number })._lineHeight = options.fontSize as number;
                        }
                        if (options.string) {
                            (compData as { _string: string })._string = options.string as string;
                            (compData as { _N$string: string })._N$string = options.string as string;
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
            
            const itemsToInsert = [nodeData];
            if (compData) itemsToInsert.push(compData);
            itemsToInsert.push(prefabInfo);
            
            if (isRootChild) {
                if (insertIndex > rootPrefabInfoOldIdx) {
                    insertIndex--;
                }
                data.splice(rootPrefabInfoOldIdx, 1);
            }
            
            for (let i = 0; i < itemsToInsert.length; i++) {
                data.splice(insertIndex + i, 0, itemsToInsert[i]);
            }
            
            rebuildReferencesForInsert(data, insertIndex, itemsToInsert.length);
            
            newNodeIndex = insertIndex;
            
            if (compData) {
                (compData as { node: { __id__: number } }).node = { __id__: newNodeIndex };
                (nodeData as { _components: { __id__: number }[] })._components.push({ __id__: newNodeIndex + 1 });
                (nodeData as { _prefab: { __id__: number } })._prefab = { __id__: newNodeIndex + 2 };
            } else {
                (nodeData as { _prefab: { __id__: number } })._prefab = { __id__: newNodeIndex + 1 };
            }
            
            if (isRootChild) {
                data.push(prefabInfo);
                (data[1] as { _prefab: { __id__: number } })._prefab = { __id__: data.length - 1 };
            }
            
        } else {
            const newNode = createNodeData(nodeName, parentIndex, options as Record<string, string>);
            
            const itemsToInsert = [newNode];
            
            let compData = null;
            if (options.type) {
                compData = createComponent(options.type as string, insertIndex);
                if (compData) {
                    if (options.type === 'label') {
                        if (options.fontSize) {
                            (compData as { _fontSize: number })._fontSize = options.fontSize as number;
                            (compData as { _lineHeight: number })._lineHeight = options.fontSize as number;
                        }
                        if (options.string) {
                            (compData as { _string: string })._string = options.string as string;
                            (compData as { _N$string: string })._N$string = options.string as string;
                        }
                    }
                }
                if (compData) itemsToInsert.push(compData);
            }
            
            for (let i = 0; i < itemsToInsert.length; i++) {
                data.splice(insertIndex + i, 0, itemsToInsert[i]);
            }
            
            rebuildReferencesForInsert(data, insertIndex, itemsToInsert.length);
            
            newNodeIndex = insertIndex;
            
            if (compData) {
                (compData as { node: { __id__: number } }).node = { __id__: newNodeIndex };
                (newNode as { _components: { __id__: number }[] })._components.push({ __id__: newNodeIndex + 1 });
            }
        }
        
        if (!parentNode._children) (parentNode as { _children: { __id__: number }[] })._children = [];
        const insertPosition = (options.at as number) >= 0 ? options.at as number : parentNode._children.length;
        parentNode._children.splice(insertPosition, 0, { __id__: newNodeIndex });
        
        saveScene(filePath, data);
        refreshEditor(filePath);
        
        outputSuccess({ 
            nodeIndex: newNodeIndex,
            name: nodeName,
            parent: parentRef,
            type: prefab ? 'prefab' : 'scene'
        });
        
    } catch (err) {
        outputError((err as Error).message);
    }
}

export default { run };
