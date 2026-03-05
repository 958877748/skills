import { loadScene, buildMaps, findNodeIndex } from '../lib/fire-utils';
import { getNodeState } from '../lib/node-utils';

export function run(args: string[]): void {
    if (args.length < 2) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli get <场景.fire | 预制体.prefab> <节点索引|名称>' }));
        return;
    }
    
    const scenePath = args[0];
    const nodeRef = args[1];
    
    try {
        const data = loadScene(scenePath);
        const { indexMap } = buildMaps(data);
        
        const idx = findNodeIndex(data, indexMap, nodeRef);
        
        if (idx === null || idx < 0 || idx >= data.length) {
            console.log(JSON.stringify({ error: `无效的节点索引: ${nodeRef}` }));
            return;
        }
        
        const node = data[idx];
        if (!node) {
            console.log(JSON.stringify({ error: `节点不存在: ${nodeRef}` }));
            return;
        }

        console.log(JSON.stringify(getNodeState(data, node, idx)));

    } catch (err) {
        console.log(JSON.stringify({ error: (err as Error).message }));
    }
}

export default { run };
