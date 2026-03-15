import { loadScene, loadScriptMap, isPrefab } from '../lib/fire-utils.js';
import { buildTree } from '../lib/node-utils.js';

export function run(args: string[]): void {
    const filePath = args[0];
    
    if (!filePath) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli tree <场景.fire | 预制体.prefab>' }));
        return;
    }
    
    try {
        const data = loadScene(filePath);
        if (!data || data.length === 0) {
            console.log(JSON.stringify({ error: '文件为空或格式错误' }));
            return;
        }
        const scriptMap = loadScriptMap(filePath);
        const prefab = isPrefab(data);
        const startIndex = prefab ? 0 : 1;
        const tree = buildTree(data, scriptMap, startIndex);
        console.log(tree ? tree.trim() : '{}');
    } catch (err: any) {
        console.log(JSON.stringify({ error: err.message }));
    }
}
