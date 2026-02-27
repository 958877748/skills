/**
 * 会话管理模块
 * 提供会话创建、验证、保存等功能
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// 临时文件目录
const TEMP_DIR = os.tmpdir();

/**
 * 生成会话 ID（8字符）
 */
function generateSessionId() {
    return crypto.randomBytes(4).toString('hex');
}

/**
 * 获取会话文件路径
 */
function getSessionPath(sessionId) {
    return path.join(TEMP_DIR, `cocos_session_${sessionId}.json`);
}

/**
 * 检查会话是否有效
 */
function validateSession(sessionId) {
    const sessionPath = getSessionPath(sessionId);
    if (!fs.existsSync(sessionPath)) {
        return { valid: false, error: '会话不存在，请先打开场景' };
    }
    
    try {
        const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        return { valid: true, session, sessionPath };
    } catch (e) {
        return { valid: false, error: '会话文件损坏' };
    }
}

/**
 * 保存会话
 */
function saveSession(sessionPath, session) {
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2), 'utf8');
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

module.exports = {
    generateSessionId,
    getSessionPath,
    validateSession,
    saveSession,
    buildMaps,
    reorderArrayToMatchChildren,
    collectNodeAndChildren,
    rebuildReferences,
    findNodeIndex
};
