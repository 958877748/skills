import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as http from 'http';

/**
 * 加载场景/预制体文件
 */
export function loadScene(filePath: string): any[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
}

/**
 * 保存场景/预制体文件
 */
export function saveScene(filePath: string, data: any[]): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 检查是否为预制体
 */
export function isPrefab(data: any[]): boolean {
    return data[0]?.__type__ === 'cc.Prefab';
}

/**
 * 生成 UUID
 */
export function generateUUID(): string {
    return crypto.randomUUID();
}

/**
 * 生成 FileId（用于 PrefabInfo）
 * 22位base64风格字符串，与Cocos Creator兼容
 */
export function generateFileId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 创建预制体 Meta 文件
 */
export function createPrefabMeta(uuid: string): Record<string, any> {
    return {
        ver: '1.0.0',
        uuid: uuid,
        optimizationPolicy: 0,
        asyncLoadAssets: false,
        readonly: false
    };
}

/**
 * 创建场景 Meta 文件
 */
export function createSceneMeta(uuid: string): Record<string, any> {
    return {
        ver: '1.0.0',
        uuid: uuid
    };
}

/**
 * 保存 Meta 文件
 */
export function saveMetaFile(filePath: string, meta: Record<string, any>): void {
    fs.writeFileSync(filePath + '.meta', JSON.stringify(meta, null, 2), 'utf-8');
}

/**
 * 加载 Meta 文件
 */
export function loadMetaFile(filePath: string): Record<string, any> | null {
    const metaPath = filePath + '.meta';
    if (!fs.existsSync(metaPath)) return null;
    const content = fs.readFileSync(metaPath, 'utf-8');
    return JSON.parse(content);
}

/**
 * 加载脚本映射
 */
export function loadScriptMap(filePath: string): Record<string, string> {
    const mapPath = path.join(path.dirname(filePath), '..', 'script_map.json');
    if (!fs.existsSync(mapPath)) return {};
    const content = fs.readFileSync(mapPath, 'utf-8');
    return JSON.parse(content);
}

/**
 * 构建索引映射
 */
export function buildMaps(data: any[]): { nodeMap: Map<number, any>; compMap: Map<number, any> } {
    const nodeMap = new Map<number, any>();
    const compMap = new Map<number, any>();
    
    data.forEach((item, index) => {
        if (!item) return;
        if (item.__type__ === 'cc.Node') {
            nodeMap.set(index, item);
        } else if (item.__type__?.includes('cc.')) {
            compMap.set(index, item);
        }
    });
    
    return { nodeMap, compMap };
}

/**
 * 查找节点索引
 */
export function findNodeIndex(data: any[], path: string): number {
    // 简化实现
    return -1;
}

/**
 * 重建引用
 */
export function rebuildReferences(data: any[]): void {
    // 简化实现
}

/**
 * 刷新编辑器
 */
export function refreshEditor(scenePath: string): void {
    // 简化实现
}

/**
 * 安装插件
 */
export function installPlugin(): void {
    // 简化实现
}

/**
 * 检查插件状态
 */
export function checkPluginStatus(): Promise<boolean> {
    return Promise.resolve(false);
}

/**
 * 获取预制体根索引
 */
export function getPrefabRootIndex(data: any[]): number {
    return 1;
}
