import { SceneData, MapResult } from './types';
export declare function isPrefab(data: SceneData): boolean;
export declare function loadScene(scenePath: string): SceneData;
export declare function saveScene(scenePath: string, data: SceneData): void;
export declare function buildMaps(data: SceneData): MapResult;
export declare function findNodeIndex(data: SceneData, indexMap: Record<number, {
    _id: string | null;
    name: string;
    path: string;
    type: string;
}>, nodeRef: string): number | null;
export declare function rebuildReferences(data: SceneData, deletedIndices: Set<number>): Record<number, number>;
export declare function checkPluginStatus(): Promise<unknown>;
export declare function refreshEditor(scenePath: string): void;
export declare function installPlugin(scenePath: string): boolean;
export declare function loadScriptMap(scenePath: string): Record<string, unknown>;
export declare function generateFileId(): string;
export declare function getPrefabRootIndex(data: SceneData): number | null;
//# sourceMappingURL=fire-utils.d.ts.map