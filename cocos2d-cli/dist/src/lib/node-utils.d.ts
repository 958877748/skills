import { SceneData, NodeData, NodeOptions, DeleteResult, NodeState } from './types';
export declare function createNodeData(name: string, parentId: number, options?: NodeOptions): NodeData;
export declare function setNodeProperty(node: NodeData, key: string, value: string): void;
export declare function setNodeProperties(node: NodeData, options: Record<string, string>): void;
export declare function getNodeState(data: SceneData, node: NodeData, nodeIndex: number): NodeState;
export declare function collectNodeAndChildren(data: SceneData, nodeIndex: number, collected?: Set<number>): Set<number>;
export declare function removeFromParent(data: SceneData, node: NodeData, nodeIndex: number): void;
export declare function deleteNode(data: SceneData, nodeIndex: number, rebuildReferencesFn: (data: SceneData, indices: Set<number>) => Record<number, number>): DeleteResult;
export declare function buildTree(data: SceneData, scriptMap: Record<string, unknown>, nodeIndex: number, prefix?: string, isLast?: boolean, isRoot?: boolean): string;
export declare function detectItemType(data: SceneData, index: number): 'node' | 'component' | null;
//# sourceMappingURL=node-utils.d.ts.map