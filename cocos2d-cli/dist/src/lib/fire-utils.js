"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPrefab = isPrefab;
exports.loadScene = loadScene;
exports.saveScene = saveScene;
exports.buildMaps = buildMaps;
exports.findNodeIndex = findNodeIndex;
exports.rebuildReferences = rebuildReferences;
exports.checkPluginStatus = checkPluginStatus;
exports.refreshEditor = refreshEditor;
exports.installPlugin = installPlugin;
exports.loadScriptMap = loadScriptMap;
exports.generateFileId = generateFileId;
exports.getPrefabRootIndex = getPrefabRootIndex;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function isPrefab(data) {
    return data[0]?.__type__ === 'cc.Prefab';
}
function loadScene(scenePath) {
    if (!fs.existsSync(scenePath)) {
        throw new Error(`文件不存在: ${scenePath}`);
    }
    const content = fs.readFileSync(scenePath, 'utf8');
    return JSON.parse(content);
}
function saveScene(scenePath, data) {
    fs.writeFileSync(scenePath, JSON.stringify(data, null, 2), 'utf8');
}
function buildMaps(data) {
    const idMap = {};
    const indexMap = {};
    const prefab = isPrefab(data);
    function traverse(nodeIndex, parentPath = '') {
        const node = data[nodeIndex];
        if (!node)
            return;
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
            _id: nodeId || null,
            name: nodeName,
            path: nodePath,
            type: node.__type__ || ''
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
        if (!obj || typeof obj !== 'object')
            return;
        const o = obj;
        if (o.__id__ !== undefined) {
            const oldId = o.__id__;
            if (indexMap[oldId] !== undefined) {
                o.__id__ = indexMap[oldId];
            }
        }
        else {
            const o2 = obj;
            for (const key of Object.keys(o2)) {
                updateRef(o2[key]);
            }
        }
    }
    for (const item of data) {
        updateRef(item);
    }
    return indexMap;
}
async function checkPluginStatus() {
    const http = require('http');
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 7455,
            path: '/status',
            method: 'GET'
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch (e) {
                    resolve(null);
                }
            });
        });
        req.on('error', () => resolve(null));
        req.setTimeout(3000, () => { req.destroy(); resolve(null); });
        req.end();
    });
}
function refreshEditor(scenePath) {
    if (!scenePath)
        return;
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
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data).sceneUrl || null);
                    }
                    catch (e) {
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
        }, () => { });
        req.on('error', () => { });
        if (postData)
            req.write(postData);
        req.end();
    };
    getCurrentScene().then(currentSceneUrl => {
        sendRefreshRequest(currentSceneUrl === targetSceneUrl ? targetSceneUrl : null);
    });
}
function installPlugin(scenePath) {
    try {
        const assetsPath = path.dirname(scenePath);
        const projectPath = path.dirname(assetsPath);
        const packagesPath = path.join(projectPath, 'packages');
        const pluginPath = path.join(packagesPath, 'cocos2d-cli-helper');
        if (fs.existsSync(pluginPath))
            return true;
        if (!fs.existsSync(packagesPath)) {
            fs.mkdirSync(packagesPath, { recursive: true });
        }
        const cliPluginPath = path.join(__dirname, '..', '..', 'editor-plugin', 'cocos2d-cli-helper');
        if (!fs.existsSync(cliPluginPath))
            return false;
        fs.cpSync(cliPluginPath, pluginPath, { recursive: true });
        return true;
    }
    catch (e) {
        return false;
    }
}
function loadScriptMap(scenePath) {
    const projectPath = path.dirname(path.dirname(scenePath));
    const mapPath = path.join(projectPath, 'data', 'script_map.json');
    try {
        if (fs.existsSync(mapPath)) {
            return JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
        }
    }
    catch (e) { }
    return {};
}
function generateFileId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function getPrefabRootIndex(data) {
    if (!isPrefab(data))
        return null;
    return 1;
}
//# sourceMappingURL=fire-utils.js.map