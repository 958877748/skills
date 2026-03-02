/**
 * tree 命令 - 查看节点树
 */

const { loadScene, buildMaps } = require('../lib/fire-utils');
const fs = require('fs');
const path = require('path');

// 加载脚本映射
function loadScriptMap(scenePath) {
    const projectPath = path.dirname(path.dirname(scenePath));
    const mapPath = path.join(projectPath, 'data', 'script_map.json');
    try {
        if (fs.existsSync(mapPath)) {
            return JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
        }
    } catch (e) {}
    return {};
}

function run(args) {
    const scenePath = args[0];
    
    if (!scenePath) {
        console.log(JSON.stringify({ error: '用法: cocos2.4 tree <场景文件路径>' }));
        return;
    }
    
    try {
        const data = loadScene(scenePath);
        const { indexMap } = buildMaps(data);
        const scriptMap = loadScriptMap(scenePath);
        const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
        
        // 构建树形结构输出
        function buildTree(nodeIndex, prefix = '', isLast = true, isRoot = true) {
            const node = data[nodeIndex];
            if (!node) return '';
            
            const nodeName = isRoot ? 'Root' : (node._name || '(unnamed)');
            const active = node._active !== false ? '●' : '○';
            const connector = isRoot ? '' : (isLast ? '└── ' : '├── ');
            
            let result = prefix + (isRoot ? '' : active + ' ') + nodeName + ' #' + nodeIndex;
            
            // 添加组件信息
            if (node._components && node._components.length > 0) {
                const comps = node._components.map(c => {
                    const comp = data[c.__id__];
                    if (!comp) return `? #${c.__id__}`;
                    const typeName = comp.__type__;
                    let displayName;
                    // 如果是 UUID，尝试从 scriptMap 查找类名
                    if (uuidRegex.test(typeName)) {
                        const scriptInfo = scriptMap[typeName];
                        if (scriptInfo && scriptInfo.name) {
                            displayName = scriptInfo.name;
                        } else {
                            displayName = '⚠️MissingScript';
                        }
                    } else if (typeName === 'MissingScript') {
                        displayName = '⚠️MissingScript';
                    } else {
                        displayName = typeName.replace('cc.', '');
                    }
                    return `${displayName} #${c.__id__}`;
                }).join(', ');
                result += ` (${comps})`;
            }
            
            result += '\n';
            
            // 处理子节点
            if (node._children && node._children.length > 0) {
                node._children.forEach((childRef, idx) => {
                    const childIsLast = idx === node._children.length - 1;
                    const childPrefix = prefix + (isRoot ? '' : (isLast ? '    ' : '│   '));
                    result += buildTree(childRef.__id__, childPrefix, childIsLast, false);
                });
            }
            
            return result;
        }
        
        const treeStr = buildTree(1);
        console.log(treeStr);
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

module.exports = { run };
