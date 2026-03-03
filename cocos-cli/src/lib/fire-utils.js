/**
 * Fire 文件工具模块 
 * 提供直接读取和操作 .fire 场景文件的功能
 */

const fs = require('fs');
const path = require('path');

/**
 * 加载场景文件
 */
function loadScene(scenePath) {
    if (!fs.existsSync(scenePath)) {
        throw new Error(`场景文件不存在: ${scenePath}`);
    }
    
    const content = fs.readFileSync(scenePath, 'utf8');
    return JSON.parse(content);
}

/**
 * 保存场景文件
 */
function saveScene(scenePath, data) {
    fs.writeFileSync(scenePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 构建 ID 和索引映射
 */
function buildMaps(data) {
    const idMap = {};    // _id -> index
    const indexMap = {}; // index -> { _id, name, path }
    
    function traverse(nodeIndex, parentPath = '') {
        const node = data[nodeIndex];
        if (!node) return;
        
        const nodeId = node._id;
        if (nodeId) {
            idMap[nodeId] = nodeIndex;
        }
        
        const nodeName = node._name || '(unnamed)';
        const nodePath = parentPath ? `${parentPath}/${nodeName}` : nodeName;
        
        indexMap[nodeIndex] = {
            _id: nodeId,
            name: nodeName,
            path: nodePath,
            type: node.__type__
        };
        
        // 递归处理子节点
        if (node._children) {
            node._children.forEach(childRef => {
                traverse(childRef.__id__, nodePath);
            });
        }
    }
    
    // 从 Scene 开始遍历（索引 1）
    if (data[1]) {
        traverse(1);
    }
    
    return { idMap, indexMap };
}

/**
 * 查找节点索引
 */
function findNodeIndex(data, indexMap, nodeRef) {
    // 如果是数字，直接返回
    if (/^\d+$/.test(nodeRef)) {
        return parseInt(nodeRef);
    }
    
    // 按名称/路径查找
    for (const [idx, info] of Object.entries(indexMap)) {
        if (info.name === nodeRef || info.path === nodeRef || info.path.endsWith('/' + nodeRef)) {
            return parseInt(idx);
        }
    }
    
    return null;
}

/**
 * 递归收集节点及其所有子节点和组件的索引
 */
function collectNodeAndChildren(data, nodeIndex, collected = new Set()) {
    if (collected.has(nodeIndex)) return collected;
    
    const node = data[nodeIndex];
    if (!node) return collected;
    
    collected.add(nodeIndex);
    
    // 收集所有组件
    if (node._components) {
        for (const compRef of node._components) {
            collected.add(compRef.__id__);
        }
    }
    
    // 递归收集子节点
    if (node._children) {
        for (const childRef of node._children) {
            collectNodeAndChildren(data, childRef.__id__, collected);
        }
    }
    
    return collected;
}

/**
 * 重建所有 __id__ 引用（删除元素后索引变化）
 */
function rebuildReferences(data, deletedIndices) {
    const indexMap = {};
    let newIndex = 0;
    for (let oldIndex = 0; oldIndex < data.length; oldIndex++) {
        if (!deletedIndices.has(oldIndex)) {
            indexMap[oldIndex] = newIndex;
            newIndex++;
        }
    }
    
    function updateRef(obj) {
        if (!obj || typeof obj !== 'object') return;
        
        if (obj.__id__ !== undefined) {
            const oldId = obj.__id__;
            if (indexMap[oldId] !== undefined) {
                obj.__id__ = indexMap[oldId];
            }
        } else {
            for (const key of Object.keys(obj)) {
                updateRef(obj[key]);
            }
        }
    }
    
    for (const item of data) {
        updateRef(item);
    }
    
    return indexMap;
}

/**
 * 重新排列数组，使其与 _children 顺序一致（节点后跟组件）
 */
function reorderArrayToMatchChildren(data) {
    const newArray = [];
    const indexMap = {};
    
    newArray[0] = data[0];
    newArray[1] = data[1];
    indexMap[0] = 0;
    indexMap[1] = 1;
    
    const dataByIndex = {};
    for (let i = 0; i < data.length; i++) {
        if (data[i]) dataByIndex[i] = data[i];
    }
    
    function addNodeAndChildren(nodeIndex) {
        if (nodeIndex === null || nodeIndex === undefined) return;
        
        const node = data[nodeIndex];
        if (!node) return;
        
        const newIndex = newArray.length;
        indexMap[nodeIndex] = newIndex;
        newArray.push(node);
        
        if (node._components) {
            for (const compRef of node._components) {
                const compIndex = compRef.__id__;
                if (compIndex !== undefined && dataByIndex[compIndex]) {
                    const compNewIndex = newArray.length;
                    indexMap[compIndex] = compNewIndex;
                    newArray.push(dataByIndex[compIndex]);
                }
            }
        }
        
        if (node._children) {
            for (const childRef of node._children) {
                addNodeAndChildren(childRef.__id__);
            }
        }
    }
    
    const scene = data[1];
    if (scene && scene._children) {
        for (const childRef of scene._children) {
            addNodeAndChildren(childRef.__id__);
        }
    }
    
    function addRootComponents(nodeIndex) {
        const node = data[nodeIndex];
        if (!node || !node._components) return;
        
        for (const compRef of node._components) {
            const compIndex = compRef.__id__;
            if (compIndex !== undefined && dataByIndex[compIndex] && indexMap[compIndex] === undefined) {
                const compNewIndex = newArray.length;
                indexMap[compIndex] = compNewIndex;
                newArray.push(dataByIndex[compIndex]);
            }
        }
    }
    
    addRootComponents(1);
    addRootComponents(2);
    
    function updateRefs(obj) {
        if (!obj || typeof obj !== 'object') return;
        
        if (obj.__id__ !== undefined) {
            const oldId = obj.__id__;
            if (indexMap[oldId] !== undefined) {
                obj.__id__ = indexMap[oldId];
            }
        } else {
            for (const key of Object.keys(obj)) {
                updateRefs(obj[key]);
            }
        }
    }
    
    for (const item of newArray) {
        updateRefs(item);
    }
    
    return newArray;
}

/**
 * 检查 CLI Helper 插件状态
 * @returns {object|null} - 插件状态信息，未启动返回 null
 */
function checkPluginStatus() {
    const { execSync } = require('child_process');
    
    try {
        const result = execSync('curl.exe -s http://localhost:7455/status', { 
            timeout: 3000,
            windowsHide: true,
            encoding: 'utf8'
        });
        return JSON.parse(result);
    } catch (e) {
        return null;
    }
}

/**
 * 触发 Cocos Creator 编辑器刷新资源
 * 智能判断：如果修改的场景就是当前打开的场景，才重新打开；否则只刷新资源
 * 编辑器有可能没打开，调用失败不报错
 * @param {string} scenePath - 场景文件路径（必须）
 */
function refreshEditor(scenePath) {
    // 参数校验
    if (!scenePath) {
        console.log(JSON.stringify({ warning: 'refreshEditor: 未提供 scenePath 参数，编辑器不会自动刷新场景' }));
        return;
    }
    
    const path = require('path');
    const http = require('http');
    
    // 转换场景路径为 db:// 格式
    const assetsPath = path.dirname(scenePath);
    const projectPath = path.dirname(assetsPath);
    const relativePath = path.relative(projectPath, scenePath).replace(/\\/g, '/');
    const targetSceneUrl = 'db://' + relativePath.replace(/^assets\//, 'assets/');
    
    // 先查询当前打开的场景
    const getCurrentScene = () => {
        return new Promise((resolve) => {
            const options = {
                hostname: 'localhost',
                port: 7455,
                path: '/current-scene',
                method: 'GET'
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        resolve(result.sceneUrl || null);
                    } catch (e) {
                        resolve(null);
                    }
                });
            });
            
            req.on('error', () => resolve(null));
            req.setTimeout(3000, () => {
                req.destroy();
                resolve(null);
            });
            req.end();
        });
    };
    
    // 发送刷新请求
    const sendRefreshRequest = (sceneUrl) => {
        const postData = sceneUrl ? JSON.stringify({ sceneUrl }) : '';
        
        const options = {
            hostname: 'localhost',
            port: 7455,
            path: '/refresh',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            // 忽略响应
        });
        
        req.on('error', () => {
            // 插件未启动，静默处理
        });
        
        if (postData) {
            req.write(postData);
        }
        req.end();
    };
    
    // 执行刷新逻辑
    getCurrentScene().then(currentSceneUrl => {
        if (currentSceneUrl && currentSceneUrl === targetSceneUrl) {
            // 是当前打开的场景，重新打开
            sendRefreshRequest(targetSceneUrl);
        } else {
            // 不是当前场景，只刷新资源
            sendRefreshRequest(null);
        }
    });
}

/**
 * 检测并安装 CLI Helper 插件到项目
 * @param {string} scenePath - 场景文件路径
 * @returns {boolean} - 是否已安装
 */
function installPlugin(scenePath) {
    try {
        const fs = require('fs');
        const path = require('path');
        
        // 获取项目路径
        const assetsPath = path.dirname(scenePath);
        const projectPath = path.dirname(assetsPath);
        const packagesPath = path.join(projectPath, 'packages');
        const pluginPath = path.join(packagesPath, 'cocos-cli-helper');
        
        // 如果插件已存在，直接返回
        if (fs.existsSync(pluginPath)) {
            return true;
        }
        
        // 创建 packages 目录
        if (!fs.existsSync(packagesPath)) {
            fs.mkdirSync(packagesPath, { recursive: true });
        }
        
        // 获取 CLI 自带的插件路径
        const cliPluginPath = path.join(__dirname, '..', '..', 'editor-plugin', 'cocos-cli-helper');
        
        if (!fs.existsSync(cliPluginPath)) {
            console.log('[CLI] 插件源文件不存在');
            return false;
        }
        
        // 复制插件
        fs.cpSync(cliPluginPath, pluginPath, { recursive: true });
        console.log('[CLI] CLI Helper 插件已安装到项目，请在编辑器中启用');
        return true;
    } catch (e) {
        console.log(`[CLI] 安装插件失败: ${e.message}`);
        return false;
    }
}

/**
 * 加载脚本映射（用于显示自定义脚本组件名称）
 */
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

/**
 * 构建节点树输出
 */
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
                displayName = (scriptInfo && scriptInfo.name) ? scriptInfo.name : '⚠️MissingScript';
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

module.exports = {
    loadScene,
    saveScene,
    buildMaps,
    findNodeIndex,
    collectNodeAndChildren,
    rebuildReferences,
    reorderArrayToMatchChildren,
    refreshEditor,
    installPlugin,
    checkPluginStatus,
    loadScriptMap,
    buildTree
};
