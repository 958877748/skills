/**
 * 从编译后的 JS 文件中构建脚本哈希映射
 * 用于更新 fire_reader.js 中的脚本映射表
 * 
 * 用法：
 * node build_script_map.js
 */

const fs = require('fs');
const path = require('path');

const IMPORTS_DIR = path.join(__dirname, '../cocos/library/imports');
const OUTPUT_FILE = path.join(__dirname, 'script_map.json');

/**
 * 扫描 imports 目录，查找所有 JS 文件中的 _RF.push 调用
 */
function buildScriptMap() {
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
    
    console.log('扫描 imports 目录...');
    scanDirectory(IMPORTS_DIR);
    
    console.log(`找到 ${Object.keys(scriptMap).length} 个脚本哈希映射`);
    
    // 写入输出文件
    const output = JSON.stringify(scriptMap, null, 2);
    fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
    
    console.log(`映射表已保存到: ${OUTPUT_FILE}`);
    
    // 显示一些示例
    console.log('\n示例映射:');
    const entries = Object.entries(scriptMap).slice(0, 10);
    entries.forEach(([hash, className]) => {
        console.log(`  ${hash} -> ${className}`);
    });
    
    if (Object.keys(scriptMap).length > 10) {
        console.log(`  ... 还有 ${Object.keys(scriptMap).length - 10} 个`);
    }
    
    return scriptMap;
}

// 主程序
try {
    buildScriptMap();
} catch (err) {
    console.error('错误:', err.message);
    process.exit(1);
}
