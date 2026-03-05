import { loadScene, loadScriptMap, isPrefab } from '../lib/fire-utils';
import { buildTree } from '../lib/node-utils';

export function run(args: string[]): void {
    const filePath = args[0];
    
    if (!filePath) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli tree <场景.fire | 预制体.prefab>' }));
        return;
    }
    
    try {
        const data = loadScene(filePath);
        const scriptMap = loadScriptMap(filePath);
        const prefab = isPrefab(data);
        
        if (prefab) {
            console.log(`[Prefab] ${(data[1] as { _name?: string })._name || 'Root'}\n`);
        } else {
            console.log(`[Scene]\n`);
        }
        
        console.log(buildTree(data, scriptMap, 1));
    } catch (err) {
        console.log(JSON.stringify({ error: (err as Error).message }));
    }
}

export default { run };
