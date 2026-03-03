/**
 * prefab-create 命令 - 创建新预制体文件
 */

const { saveScene, createPrefab } = require('../lib/fire-utils');
const fs = require('fs');
const path = require('path');

function run(args) {
    if (args.length < 2) {
        console.log(JSON.stringify({ error: '用法: cocos2.4 prefab-create <预制体路径> <根节点名称>' }));
        return;
    }
    
    const prefabPath = args[0];
    const rootName = args[1] || 'RootNode';
    
    try {
        // 检查文件是否已存在
        if (fs.existsSync(prefabPath)) {
            console.log(JSON.stringify({ error: `文件已存在: ${prefabPath}` }));
            return;
        }
        
        // 确保目录存在
        const dir = path.dirname(prefabPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // 创建预制体数据
        const data = createPrefab(rootName);
        
        // 保存文件
        saveScene(prefabPath, data);
        
        console.log(JSON.stringify({ 
            success: true, 
            path: prefabPath,
            rootName: rootName,
            message: `预制体创建成功: ${rootName}`
        }));
        
    } catch (err) {
        console.log(JSON.stringify({ error: err.message }));
    }
}

module.exports = { run };
