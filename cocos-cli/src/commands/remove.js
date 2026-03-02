/**
 * remove 命令 - 删除节点或组件
 */

const { loadScene, saveScene, buildMaps, collectNodeAndChildren, rebuildReferences, refreshEditor, installPlugin } = require('../lib/fire-utils');
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

// 构建树形结构
function buildTree(data, scriptMap, nodeIndex, prefix = '', isLast = true, isRoot = true) {
    const node = data[nodeIndex];
    if (!node) return '';
    
    const nodeName = isRoot ? 'Root' : (node._name || '(unnamed)');
    const active = node._active !== false ? '●' : '○';
    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    
    let result = prefix + (isRoot ? '' : active + ' ') + nodeName + ' #' + nodeIndex;
    
    // 添加组件信息
    if (node._components && node._components.length > 0) {
        const comps = node._components.map(c => {
            const comp = data[c.__id__];
            if (!comp) return `? #${c.__id__}`;
            const typeName = comp.__type__;
            let displayName;
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
            result += buildTree(data, scriptMap, childRef.__id__, childPrefix, childIsLast, false);
        });
    }
    
    return result;
}

function run(args) {
    if (args.length < 2) {
        console.log('用法: cocos2.4 remove <场景文件路径> <索引>');
        return;
    }
    
    const scenePath = args[0];
    
    // 安装 CLI Helper 插件（如果不存在）
    installPlugin(scenePath);
    
    const index = parseInt(args[1]);
    
    if (isNaN(index)) {
        console.log('错误: 索引必须是数字');
        return;
    }
    
    try {
        let data = loadScene(scenePath);
        const scriptMap = loadScriptMap(scenePath);
        
        // 检查索引是否存在
        if (!data[index]) {
            console.log(`错误: 索引 ${index} 不存在`);
            return;
        }
        
        const item = data[index];
        const itemType = item.__type__;
        
        // 判断是节点还是组件
        const isNode = itemType === 'cc.Node' || itemType === 'cc.Scene' || item._name !== undefined;
        const isComponent = item.node !== undefined;
        
        if (isNode && index <= 1) {
            console.log('错误: 不能删除根节点');
            return;
        }
        
        if (isComponent) {
            // 删除组件
            const nodeId = item.node.__id__;
            const node = data[nodeId];
            
            if (node && node._components) {
                node._components = node._components.filter(c => c.__id__ !== index);
            }
            
            // 真正从数组中删除组件并重建引用
            const indicesToDelete = new Set([index]);
            rebuildReferences(data, indicesToDelete);
            data.splice(index, 1);
            
        } else {
            // 删除节点
            // 收集所有需要删除的索引
            const indicesToDelete = collectNodeAndChildren(data, index);
            
            // 从父节点的 _children 中移除引用
            if (item._parent) {
                const parentIndex = item._parent.__id__;
                const parent = data[parentIndex];
                if (parent && parent._children) {
                    parent._children = parent._children.filter(c => c.__id__ !== index);
                }
            }
            
            // 重建引用
            rebuildReferences(data, indicesToDelete);
            
            // 删除元素
            const sortedIndices = Array.from(indicesToDelete).sort((a, b) => b - a);
            for (const idx of sortedIndices) {
                data.splice(idx, 1);
            }
        }
        
        // 保存场景
        saveScene(scenePath, data);
        
        // 触发编辑器刷新
        refreshEditor(scenePath);
        
        // 重新加载并显示最新树
        data = loadScene(scenePath);
        console.log(buildTree(data, scriptMap, 1));
        
    } catch (err) {
        console.log(`错误: ${err.message}`);
    }
}

module.exports = { run };