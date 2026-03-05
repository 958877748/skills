import * as fs from 'fs';
import * as path from 'path';
import { SceneData, MapResult } from './types';

export function isPrefab(data: SceneData): boolean {
    return data[0]?.__type__ === 'cc.Prefab';
}

export function loadScene(scenePath: string): SceneData {
    if (!fs.existsSync(scenePath)) {
        throw new Error(`文件不存在: ${scenePath}`);
    }
    
    const content = fs.readFileSync(scenePath, 'utf8');
    return JSON.parse(content);
}

export function saveScene(scenePath: string, data: SceneData): void {
    fs.writeFileSync(scenePath, JSON.stringify(data, null, 2), 'utf8');
}

export function buildMaps(data: SceneData): MapResult {
    const idMap: Record<number, number> = {};
    const indexMap: Record<number, { _id: string | null; name: string; path: string; type: string }> = {};
    const prefab = isPrefab(data);
    
    function traverse(nodeIndex: number, parentPath: string = ''): void {
        const node = data[nodeIndex];
        if (!node) return;
        
        if (!node.__type__?.startsWith('cc.Node') && node.__type__ !== 'cc.Scene') {
            return;
        }
        
        const nodeId = node._id;
        if (nodeId) {
            idMap[nodeId as unknown as number] = nodeIndex;
        }
        
        const nodeName = node._name || '(unnamed)';
        const nodePath = parentPath ? `${parentPath}/${nodeName}` : nodeName;
        
        indexMap[nodeIndex] = {
            _id: nodeId || null,
            name: nodeName,
            path: nodePath,
            type: node.__type__ || ''
        };
        
        if (node._children) {
            node._children.forEach(childRef => {
                traverse(childRef.__id__, nodePath);
            });
        }
    }
    
    traverse(1);
    
    return { idMap, indexMap, prefab };
}

export function findNodeIndex(data: SceneData, indexMap: Record<number, { _id: string | null; name: string; path: string; type: string }>, nodeRef: string): number | null {
    if (/^\d+$/.test(nodeRef)) {
        return parseInt(nodeRef);
    }
    
    for (const [idx, info] of Object.entries(indexMap)) {
        if (info.name === nodeRef || info.path === nodeRef || info.path.endsWith('/' + nodeRef)) {
            return parseInt(idx);
        }
    }
    
    return null;
}

export function rebuildReferences(data: SceneData, deletedIndices: Set<number>): Record<number, number> {
    const indexMap: Record<number, number> = {};
    let newIndex = 0;
    for (let oldIndex = 0; oldIndex < data.length; oldIndex++) {
        if (!deletedIndices.has(oldIndex)) {
            indexMap[oldIndex] = newIndex;
            newIndex++;
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

export async function checkPluginStatus(): Promise<unknown> {
    const http = require('http');
    
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 7455,
            path: '/status',
            method: 'GET'
        }, (res: { on: (event: string, callback: (chunk: string) => void) => void }) => {
            let data = '';
            res.on('data', (chunk: string) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(null);
                }
            });
        });
        
        req.on('error', () => resolve(null));
        req.setTimeout(3000, () => { req.destroy(); resolve(null); });
        req.end();
    });
}

export function refreshEditor(scenePath: string): void {
    if (!scenePath) return;
    
    const http = require('http');
    
    const assetsPath = path.dirname(scenePath);
    const projectPath = path.dirname(assetsPath);
    const relativePath = path.relative(projectPath, scenePath).replace(/\\/g, '/');
    const targetSceneUrl = 'db://' + relativePath.replace(/^assets\//, 'assets/');
    
    const getCurrentScene = (): Promise<string | null> => {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: 7455,
                path: '/current-scene',
                method: 'GET'
            }, (res: { on: (event: string, callback: (chunk: string) => void) => void }) => {
                let data = '';
                res.on('data', (chunk: string) => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data).sceneUrl || null);
                    } catch (e) {
                        resolve(null);
                    }
                });
            });
            req.on('error', () => resolve(null));
            req.setTimeout(3000, () => { req.destroy(); resolve(null); });
            req.end();
        });
    };
    
    const sendRefreshRequest = (sceneUrl: string | null): void => {
        const postData = sceneUrl ? JSON.stringify({ sceneUrl }) : '';
        const req = http.request({
            hostname: 'localhost',
            port: 7455,
            path: '/refresh',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, () => {});
        req.on('error', () => {});
        if (postData) req.write(postData);
        req.end();
    };
    
    getCurrentScene().then(currentSceneUrl => {
        sendRefreshRequest(currentSceneUrl === targetSceneUrl ? targetSceneUrl : null);
    });
}

export function installPlugin(scenePath: string): boolean {
    try {
        const assetsPath = path.dirname(scenePath);
        const projectPath = path.dirname(assetsPath);
        const packagesPath = path.join(projectPath, 'packages');
        const pluginPath = path.join(packagesPath, 'cocos2d-cli-helper');
        
        if (fs.existsSync(pluginPath)) return true;
        
        if (!fs.existsSync(packagesPath)) {
            fs.mkdirSync(packagesPath, { recursive: true });
        }
        
        const cliPluginPath = path.join(__dirname, '..', '..', 'editor-plugin', 'cocos2d-cli-helper');
        
        if (!fs.existsSync(cliPluginPath)) return false;
        
        fs.cpSync(cliPluginPath, pluginPath, { recursive: true });
        return true;
    } catch (e) {
        return false;
    }
}

export function loadScriptMap(scenePath: string): Record<string, unknown> {
    const projectPath = path.dirname(path.dirname(scenePath));
    const mapPath = path.join(projectPath, 'data', 'script_map.json');
    try {
        if (fs.existsSync(mapPath)) {
            return JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
        }
    } catch (e) {}
    return {};
}

export function generateFileId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function getPrefabRootIndex(data: SceneData): number | null {
    if (!isPrefab(data)) return null;
    return 1;
}
