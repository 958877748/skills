/**
 * build 命令 - 构建组件映射
 */

const fs = require('fs');
const path = require('path');

function run(args) {
    if (args.length < 1) {
        console.log(JSON.stringify({ error: '用法: cocos-cli build <项目目录>' }));
        return;
    }
    
    const projectDir = args[0];
    const importsDir = path.join(projectDir, 'library', 'imports');
    const outputFile = path.join(__dirname, '../../data/script_map.json');
    
    if (!fs.existsSync(importsDir)) {
        console.log(JSON.stringify({ error: `imports 目录不存在: ${importsDir}` }));
        return;
    }
    
    const scriptMap = {};
    let processedCount = 0;
    
    function scanDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                scanDirectory(fullPath);
            } else if (item.endsWith('.js')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    
                    // 查找 cc._RF.push 调用
                    const match = content.match(/cc\._RF\.push\(module,\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/);
                    
                    if (match) {
                        const hash = match[1];
                        const className = match[2];
                        
                        // 只存储脚本相关的哈希（不以 'cc.' 开头的）
                        if (!className.startsWith('cc.')) {
                            scriptMap[hash] = className;
                            processedCount++;
                        }
                    }
                } catch (err) {
                    // 忽略读取错误
                }
            }
        }
    }
    
    scanDirectory(importsDir);
    
    // 确保输出目录存在
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 写入输出文件
    fs.writeFileSync(outputFile, JSON.stringify(scriptMap, null, 2), 'utf8');
    
    console.log(JSON.stringify({
        success: true,
        count: Object.keys(scriptMap).length,
        outputFile,
        message: `构建完成，共 ${Object.keys(scriptMap).length} 个脚本映射`
    }, null, 2));
}

module.exports = { run };
