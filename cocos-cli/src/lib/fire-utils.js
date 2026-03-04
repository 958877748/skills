/**
 * Fire/Prefab 文件工具模块
 * 提供场景/预制体文件的读写和编辑器交互功能
 */

const fs = require('fs');
const path = require('path');

/**
 * 检测是否为预制体文件
 */
function isPrefab(data) {
    return data[0]?.__type__ === 'cc.Prefab';
}

/**
 * 加载场景/预制体文件
 */
function loadScene(scenePath) {
    if (!fs.existsSync(scenePath)) {
        throw new Error(`文件不存在: ${scenePath}`);
    }
    
    const content = fs.readFileSync(scenePath, 'utf8');
    return JSON.parse(content);
}

/**
 * 保存场景/预制体文件
 */
function saveScene(scenePath, data) {
    fs.writeFileSync(scenePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 构建 ID 和索引映射
 */
function buildMaps(data) {
    const idMap = {};
    const indexMap = {};
    const prefab = isPrefab(data);
    
    function traverse(nodeIndex, parentPath = '') {
        const node = data[nodeIndex];
        if (!node) return;
        
        if (!node.__type__?.startsWith('cc.Node') && node.__type__ !== 'cc.Scene') {
            return;
        }
        
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
        
        if (node._children) {
            node._children.forEach(childRef => {
                traverse(childRef.__id__, nodePath);
            });
        }
    }
    
    traverse(1);
    
    return { idMap, indexMap, prefab };
}

/**
 * 查找节点索引
 */
function findNodeIndex(data, indexMap, nodeRef) {
    if (/^\d+$/.test(nodeRef)) {
        return parseInt(nodeRef);
    }
    
    for (const [idx, info] of Object.entries(indexMap)) {
        if (info.name === nodeRef || info.path === nodeRef || info.path.endsWith('/' + nodeRef)) {
            return parseInt(idx);
        }
    }
    
    return null;
}

/**
 * 重建所有 __id__ 引用
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
 * 检查 CLI Helper 插件状态
 */
function checkPluginStatus() {
    const http = require('http');
    
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 7455,
            path: '/status',
            method: 'GET'
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(null);
                }
            });
        });
        
        req.on('error', () => resolve(null));
        req.setTimeout(3000, () => { req.destroy(); resolve(null); });
        req.end();
    });
}

/**
 * 触发编辑器刷新
 */
function refreshEditor(scenePath) {
    if (!scenePath) return;
    
    const http = require('http');
    
    const assetsPath = path.dirname(scenePath);
    const projectPath = path.dirname(assetsPath);
    const relativePath = path.relative(projectPath, scenePath).replace(/\\/g, '/');
    const targetSceneUrl = 'db://' + relativePath.replace(/^assets\//, 'assets/');
    
    const getCurrentScene = () => {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: 7455,
                path: '/current-scene',
                method: 'GET'
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data).sceneUrl || null);
                    } catch (e) {
                        resolve(null);
                    }
                });
            });
            req.on('error', () => resolve(null));
            req.setTimeout(3000, () => { req.destroy(); resolve(null); });
            req.end();
        });
    };
    
    const sendRefreshRequest = (sceneUrl) => {
        const postData = sceneUrl ? JSON.stringify({ sceneUrl }) : '';
        const req = http.request({
            hostname: 'localhost',
            port: 7455,
            path: '/refresh',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, () => {});
        req.on('error', () => {});
        if (postData) req.write(postData);
        req.end();
    };
    
    getCurrentScene().then(currentSceneUrl => {
        sendRefreshRequest(currentSceneUrl === targetSceneUrl ? targetSceneUrl : null);
    });
}

/**
 * 安装 CLI Helper 插件
 */
function installPlugin(scenePath) {
    try {
        const assetsPath = path.dirname(scenePath);
        const projectPath = path.dirname(assetsPath);
        const packagesPath = path.join(projectPath, 'packages');
        const pluginPath = path.join(packagesPath, 'cocos-cli-helper');
        
        if (fs.existsSync(pluginPath)) return true;
        
        if (!fs.existsSync(packagesPath)) {
            fs.mkdirSync(packagesPath, { recursive: true });
        }
        
        const cliPluginPath = path.join(__dirname, '..', '..', 'editor-plugin', 'cocos-cli-helper');
        
        if (!fs.existsSync(cliPluginPath)) return false;
        
        fs.cpSync(cliPluginPath, pluginPath, { recursive: true });
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 加载脚本映射
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
 * 生成 fileId（用于 PrefabInfo）
 */
function generateFileId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 获取预制体根节点索引
 */
function getPrefabRootIndex(data) {
    if (!isPrefab(data)) return null;
    return 1;
}

module.exports = {
    // 文件操作
    loadScene,
    saveScene,
    isPrefab,
    
    // 索引映射
    buildMaps,
    findNodeIndex,
    rebuildReferences,
    
    // 编辑器交互
    refreshEditor,
    installPlugin,
    checkPluginStatus,
    
    // 工具函数
    loadScriptMap,
    generateFileId,
    getPrefabRootIndex
};