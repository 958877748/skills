/**
 * Cocos Creator 场景会话管理工具
 * 
 * 提供会话模式操作场景，避免索引变化问题
 * 
 * 用法：
 * node scene_session.js open <场景文件路径>
 * node scene_session.js add <父节点> <节点名称> --session=<会话ID> [选项]
 * node scene_session.js delete <节点索引> --session=<会话ID>
 * node scene_session.js get <节点索引> --session=<会话ID>
 * node scene_session.js tree --session=<会话ID>
 * node scene_session.js close --session=<会话ID>
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 临时文件目录
const TEMP_DIR = '/tmp';

// 生成会话 ID（8字符，省 token）
function generateSessionId() {
    return crypto.randomBytes(4).toString('hex');
}

// 生成节点 _id（22字符，类似 Cocos Creator）
function generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 获取场景 UUID（从 .meta 文件）
function getSceneUuid(firePath) {
    const metaPath = firePath + '.meta';
    if (fs.existsSync(metaPath)) {
        try {
            const content = fs.readFileSync(metaPath, 'utf8');
            // 尝试 JSON 解析
            try {
                const meta = JSON.parse(content);
                return meta.uuid || null;
            } catch (e) {
                // JSON 解析失败，用正则提取
                const match = content.match(/"uuid"\s*:\s*"([^"]+)"/);
                return match ? match[1] : null;
            }
        } catch (e) {
            return null;
        }
    }
    return null;
}

// 获取会话文件路径（用 sessionId 命名）
function getSessionPath(sessionId) {
    return path.join(TEMP_DIR, `cocos_session_${sessionId}.json`);
}

// 检查会话是否有效
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

// 保存会话
function saveSession(sessionPath, session) {
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2), 'utf8');
}

// 构建 ID 和索引映射
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

// 创建默认节点数据
function createNodeData(name, parentId, options = {}) {
    return {
        "__type__": "cc.Node",
        "_name": name,
        "_objFlags": 0,
        "_parent": { "__id__": parentId },
        "_children": [],
        "_active": options.active !== false,
        "_components": [],
        "_prefab": null,
        "_opacity": 255,
        "_color": {
            "__type__": "cc.Color",
            "r": 255,
            "g": 255,
            "b": 255,
            "a": 255
        },
        "_contentSize": {
            "__type__": "cc.Size",
            "width": options.width || 0,
            "height": options.height || 0
        },
        "_anchorPoint": {
            "__type__": "cc.Vec2",
            "x": 0.5,
            "y": 0.5
        },
        "_trs": {
            "__type__": "TypedArray",
            "ctor": "Float64Array",
            "array": [
                options.x || 0,
                options.y || 0,
                0, 0, 0, 0, 1,
                1, 1, 1
            ]
        },
        "_eulerAngles": {
            "__type__": "cc.Vec3",
            "x": 0,
            "y": 0,
            "z": 0
        },
        "_skewX": 0,
        "_skewY": 0,
        "_is3DNode": false,
        "_groupIndex": 0,
        "groupIndex": 0,
        "_id": generateId()
    };
}

// 创建 Sprite 组件
function createSpriteComponent(nodeId) {
    return {
        "__type__": "cc.Sprite",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_materials": [{ "__uuid__": "eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432" }],
        "_srcBlendFactor": 770,
        "_dstBlendFactor": 771,
        "_spriteFrame": { "__uuid__": "8cdb44ac-a3f6-449f-b354-7cd48cf84061" },
        "_type": 0,
        "_sizeMode": 1,
        "_fillType": 0,
        "_fillCenter": { "__type__": "cc.Vec2", "x": 0, "y": 0 },
        "_fillStart": 0,
        "_fillRange": 0,
        "_isTrimmedMode": true,
        "_atlas": null,
        "_id": generateId()
    };
}

// 创建 Label 组件
function createLabelComponent(nodeId) {
    return {
        "__type__": "cc.Label",
        "_name": "",
        "_objFlags": 0,
        "node": { "__id__": nodeId },
        "_enabled": true,
        "_materials": [{ "__uuid__": "eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432" }],
        "_useOriginalSize": true,
        "_string": "",
        "_horizontalAlign": 1,
        "_verticalAlign": 1,
        "_actualFontSize": 40,
        "_fontSize": 40,
        "_fontFamily": "Arial",
        "_lineHeight": 40,
        "_overflow": 0,
        "_enableWrapText": true,
        "_font": null,
        "_isSystemFontUsed": true,
        "_spacingX": 0,
        "_isItalic": false,
        "_isBold": false,
        "_isUnderline": false,
        "_underlineHeight": 2,
        "_cacheMode": 0,
        "_id": generateId()
    };
}

// ============ 命令处理函数 ============

// 打开会话
function cmdOpen(firePath) {
    const absolutePath = path.isAbsolute(firePath) ? firePath : path.join(process.cwd(), firePath);
    
    if (!fs.existsSync(absolutePath)) {
        console.log(JSON.stringify({ error: `场景文件不存在: ${absolutePath}` }));
        return;
    }
    
    // 读取场景数据
    let data;
    try {
        data = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    } catch (e) {
        console.log(JSON.stringify({ error: '场景文件格式错误' }));
        return;
    }
    
    // 生成新会话
    const sessionId = generateSessionId();
    const sessionPath = getSessionPath(sessionId);
    
    // 构建映射
    const { idMap, indexMap } = buildMaps(data);
    
    // 创建会话
    const session = {
        sessionId,
        scenePath: absolutePath,
        createdAt: Date.now(),
        data,
        idMap,
        indexMap
    };
    
    // 保存会话
    saveSession(sessionPath, session);
    
    // 返回会话信息和节点树摘要
    const nodeCount = Object.keys(indexMap).length;
    console.log(JSON.stringify({
        sessionId,
        nodeCount,
        message: `会话已打开，共 ${nodeCount} 个节点`
    }, null, 2));
}

// 关闭会话
function cmdClose(sessionId) {
    const validation = validateSession(sessionId);
    
    if (!validation.valid) {
        console.log(JSON.stringify({ error: validation.error }));
        return;
    }
    
    const session = validation.session;
    const sessionPath = validation.sessionPath;
    
    // 保存场景文件
    fs.writeFileSync(session.scenePath, JSON.stringify(session.data, null, 2), 'utf8');
    
    // 删除会话文件
    fs.unlinkSync(sessionPath);
    
    console.log(JSON.stringify({
        success: true,
        message: `会话已关闭，场景已保存到 ${session.scenePath}`
    }, null, 2));
}

// 获取节点树
function cmdTree(sessionId) {
    const validation = validateSession(sessionId);
    
    if (!validation.valid) {
        console.log(JSON.stringify({ error: validation.error }));
        return;
    }
    
    const session = validation.session;
    const data = session.data;
    
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
                return comp ? comp.__type__.replace('cc.', '') : '?';
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
    console.log(JSON.stringify({
        success: true,
        tree: treeStr
    }, null, 2));
}

// 获取节点信息
function cmdGet(sessionId, nodeIndex) {
    const validation = validateSession(sessionId);
    
    if (!validation.valid) {
        console.log(JSON.stringify({ error: validation.error }));
        return;
    }
    
    const session = validation.session;
    const idx = parseInt(nodeIndex);
    
    if (isNaN(idx) || idx < 0 || idx >= session.data.length) {
        console.log(JSON.stringify({ error: `无效的节点索引: ${nodeIndex}` }));
        return;
    }
    
    const node = session.data[idx];
    if (!node) {
        console.log(JSON.stringify({ error: `节点不存在: ${nodeIndex}` }));
        return;
    }
    
    // 返回节点信息
    const info = session.indexMap[idx] || {};
    console.log(JSON.stringify({
        success: true,
        index: idx,
        ...info,
        node: {
            active: node._active,
            position: node._trs?.array?.slice(0, 2) || [0, 0],
            size: node._contentSize || { width: 0, height: 0 },
            children: node._children?.map(c => c.__id__) || [],
            components: node._components?.map(c => c.__id__) || []
        }
    }, null, 2));
}

// 添加节点
function cmdAdd(sessionId, parentRef, nodeName, options) {
    const validation = validateSession(sessionId);
    
    if (!validation.valid) {
        console.log(JSON.stringify({ error: validation.error }));
        return;
    }
    
    const session = validation.session;
    const sessionPath = validation.sessionPath;
    const data = session.data;
    
    // 查找父节点
    let parentIndex;
    if (/^\d+$/.test(parentRef)) {
        parentIndex = parseInt(parentRef);
    } else {
        // 按名称/路径查找
        for (const [idx, info] of Object.entries(session.indexMap)) {
            if (info.name === parentRef || info.path === parentRef || info.path.endsWith('/' + parentRef)) {
                parentIndex = parseInt(idx);
                break;
            }
        }
    }
    
    if (parentIndex === undefined || !data[parentIndex]) {
        console.log(JSON.stringify({ error: `找不到父节点: ${parentRef}` }));
        return;
    }
    
    const parentNode = data[parentIndex];
    
    // 添加新节点
    const newNodeIndex = data.length;
    const newNode = createNodeData(nodeName, parentIndex, options);
    data.push(newNode);
    
    // 添加组件
    let compIndex = null;
    if (options.type === 'sprite') {
        compIndex = data.length;
        data.push(createSpriteComponent(newNodeIndex));
        newNode._components.push({ "__id__": compIndex });
    } else if (options.type === 'label') {
        compIndex = data.length;
        data.push(createLabelComponent(newNodeIndex));
        newNode._components.push({ "__id__": compIndex });
    }
    
    // 更新父节点的 _children
    if (!parentNode._children) parentNode._children = [];
    
    if (options.at >= 0 && options.at < parentNode._children.length) {
        parentNode._children.splice(options.at, 0, { "__id__": newNodeIndex });
    } else {
        parentNode._children.push({ "__id__": newNodeIndex });
    }
    
    // 更新映射
    session.idMap[newNode._id] = newNodeIndex;
    session.indexMap[newNodeIndex] = {
        _id: newNode._id,
        name: nodeName,
        path: session.indexMap[parentIndex].path + '/' + nodeName,
        type: 'cc.Node'
    };
    
    // 保存会话
    saveSession(sessionPath, session);
    
    console.log(JSON.stringify({
        success: true,
        index: newNodeIndex,
        _id: newNode._id,
        name: nodeName,
        parentIndex,
        componentIndex: compIndex,
        message: `节点 "${nodeName}" 已添加到 ${parentNode._name}`
    }, null, 2));
}

// 删除节点
function cmdDelete(sessionId, nodeRef) {
    const validation = validateSession(sessionId);
    
    if (!validation.valid) {
        console.log(JSON.stringify({ error: validation.error }));
        return;
    }
    
    const session = validation.session;
    const sessionPath = validation.sessionPath;
    const data = session.data;
    
    // 查找节点
    let nodeIndex;
    if (/^\d+$/.test(nodeRef)) {
        nodeIndex = parseInt(nodeRef);
    } else {
        for (const [idx, info] of Object.entries(session.indexMap)) {
            if (info.name === nodeRef || info.path === nodeRef || info.path.endsWith('/' + nodeRef)) {
                nodeIndex = parseInt(idx);
                break;
            }
        }
    }
    
    if (nodeIndex === undefined || !data[nodeIndex]) {
        console.log(JSON.stringify({ error: `找不到节点: ${nodeRef}` }));
        return;
    }
    
    if (nodeIndex <= 1) {
        console.log(JSON.stringify({ error: '不能删除根节点' }));
        return;
    }
    
    const node = data[nodeIndex];
    const nodeName = node._name;
    
    // 从父节点移除引用
    if (node._parent) {
        const parentIndex = node._parent.__id__;
        const parent = data[parentIndex];
        if (parent && parent._children) {
            parent._children = parent._children.filter(c => c.__id__ !== nodeIndex);
        }
    }
    
    // 标记为已销毁
    node._objFlags = (node._objFlags || 0) | 1;
    node._parent = null;
    
    // 从映射中移除
    if (node._id) delete session.idMap[node._id];
    delete session.indexMap[nodeIndex];
    
    // 保存会话
    saveSession(sessionPath, session);
    
    console.log(JSON.stringify({
        success: true,
        message: `节点 "${nodeName}" (#${nodeIndex}) 已删除`
    }, null, 2));
}

// 修改节点属性
function cmdSet(sessionId, nodeRef, options) {
    const validation = validateSession(sessionId);
    
    if (!validation.valid) {
        console.log(JSON.stringify({ error: validation.error }));
        return;
    }
    
    const session = validation.session;
    const sessionPath = validation.sessionPath;
    const data = session.data;
    
    // 查找节点
    let nodeIndex;
    if (/^\d+$/.test(nodeRef)) {
        nodeIndex = parseInt(nodeRef);
    } else {
        for (const [idx, info] of Object.entries(session.indexMap)) {
            if (info.name === nodeRef || info.path === nodeRef || info.path.endsWith('/' + nodeRef)) {
                nodeIndex = parseInt(idx);
                break;
            }
        }
    }
    
    if (nodeIndex === undefined || !data[nodeIndex]) {
        console.log(JSON.stringify({ error: `找不到节点: ${nodeRef}` }));
        return;
    }
    
    const node = data[nodeIndex];
    const changes = {};
    
    // 修改名称
    if (options.name !== undefined) {
        const oldName = node._name;
        node._name = options.name;
        changes.name = { from: oldName, to: options.name };
        // 更新映射
        if (session.indexMap[nodeIndex]) {
            session.indexMap[nodeIndex].name = options.name;
        }
    }
    
    // 修改激活状态
    if (options.active !== undefined) {
        const oldActive = node._active;
        node._active = options.active;
        changes.active = { from: oldActive, to: options.active };
    }
    
    // 修改位置
    if (options.x !== undefined || options.y !== undefined) {
        if (!node._trs) {
            node._trs = {
                "__type__": "TypedArray",
                "ctor": "Float64Array",
                "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
            };
        }
        const oldX = node._trs.array[0];
        const oldY = node._trs.array[1];
        if (options.x !== undefined) node._trs.array[0] = options.x;
        if (options.y !== undefined) node._trs.array[1] = options.y;
        changes.position = {
            from: [oldX, oldY],
            to: [node._trs.array[0], node._trs.array[1]]
        };
    }
    
    // 修改大小
    if (options.width !== undefined || options.height !== undefined) {
        if (!node._contentSize) {
            node._contentSize = { "__type__": "cc.Size", width: 0, height: 0 };
        }
        const oldW = node._contentSize.width;
        const oldH = node._contentSize.height;
        if (options.width !== undefined) node._contentSize.width = options.width;
        if (options.height !== undefined) node._contentSize.height = options.height;
        changes.size = {
            from: { width: oldW, height: oldH },
            to: { width: node._contentSize.width, height: node._contentSize.height }
        };
    }
    
    // 修改锚点
    if (options.anchorX !== undefined || options.anchorY !== undefined) {
        if (!node._anchorPoint) {
            node._anchorPoint = { "__type__": "cc.Vec2", x: 0.5, y: 0.5 };
        }
        const oldX = node._anchorPoint.x;
        const oldY = node._anchorPoint.y;
        if (options.anchorX !== undefined) node._anchorPoint.x = options.anchorX;
        if (options.anchorY !== undefined) node._anchorPoint.y = options.anchorY;
        changes.anchor = {
            from: [oldX, oldY],
            to: [node._anchorPoint.x, node._anchorPoint.y]
        };
    }
    
    // 修改透明度
    if (options.opacity !== undefined) {
        const oldOpacity = node._opacity;
        node._opacity = Math.max(0, Math.min(255, options.opacity));
        changes.opacity = { from: oldOpacity, to: node._opacity };
    }
    
    // 修改颜色
    if (options.color !== undefined) {
        // 支持格式: #RRGGBB 或 RRGGBB 或 rgb(r,g,b)
        let color = options.color;
        if (typeof color === 'string') {
            if (color.startsWith('#')) color = color.slice(1);
            if (color.length === 6) {
                const r = parseInt(color.slice(0, 2), 16);
                const g = parseInt(color.slice(2, 4), 16);
                const b = parseInt(color.slice(4, 6), 16);
                if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                    const oldColor = node._color ? `#${node._color.r.toString(16).padStart(2,'0')}${node._color.g.toString(16).padStart(2,'0')}${node._color.b.toString(16).padStart(2,'0')}` : null;
                    node._color = { "__type__": "cc.Color", r, g, b, a: 255 };
                    changes.color = { from: oldColor, to: color };
                }
            }
        }
    }
    
    // 修改旋转角度
    if (options.rotation !== undefined) {
        if (!node._eulerAngles) {
            node._eulerAngles = { "__type__": "cc.Vec3", x: 0, y: 0, z: 0 };
        }
        const oldRotation = node._eulerAngles.z;
        node._eulerAngles.z = options.rotation;
        // 更新四元数（简化处理，仅绕 Z 轴旋转）
        const rad = options.rotation * Math.PI / 180;
        if (node._trs && node._trs.array) {
            node._trs.array[3] = 0; // qx
            node._trs.array[4] = 0; // qy
            node._trs.array[5] = Math.sin(rad / 2); // qz
            node._trs.array[6] = Math.cos(rad / 2); // qw
        }
        changes.rotation = { from: oldRotation, to: options.rotation };
    }
    
    // 修改缩放
    if (options.scaleX !== undefined || options.scaleY !== undefined) {
        if (!node._trs) {
            node._trs = {
                "__type__": "TypedArray",
                "ctor": "Float64Array",
                "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
            };
        }
        const oldScaleX = node._trs.array[7];
        const oldScaleY = node._trs.array[8];
        if (options.scaleX !== undefined) node._trs.array[7] = options.scaleX;
        if (options.scaleY !== undefined) node._trs.array[8] = options.scaleY;
        changes.scale = {
            from: [oldScaleX, oldScaleY],
            to: [node._trs.array[7], node._trs.array[8]]
        };
    }
    
    // 修改层级
    if (options.zIndex !== undefined) {
        const oldZIndex = node._localZOrder || 0;
        node._localZOrder = options.zIndex;
        changes.zIndex = { from: oldZIndex, to: options.zIndex };
    }
    
    // 保存会话
    saveSession(sessionPath, session);
    
    if (Object.keys(changes).length === 0) {
        console.log(JSON.stringify({
            success: true,
            message: `节点 "${node._name}" 未做任何修改`,
            node: node._name,
            index: nodeIndex
        }, null, 2));
    } else {
        console.log(JSON.stringify({
            success: true,
            message: `节点 "${node._name}" 已修改`,
            node: node._name,
            index: nodeIndex,
            changes
        }, null, 2));
    }
}

// 解析选项
function parseOptions(args) {
    const options = {
        type: 'empty',
        x: undefined,
        y: undefined,
        at: -1,
        session: null,
        uuid: null,
        // set 命令的选项
        name: undefined,
        active: undefined,
        width: undefined,
        height: undefined,
        anchorX: undefined,
        anchorY: undefined,
        opacity: undefined,
        color: undefined,
        rotation: undefined,
        scaleX: undefined,
        scaleY: undefined,
        zIndex: undefined
    };
    
    args.forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            switch (key) {
                case 'type': options.type = value; break;
                case 'x': options.x = parseFloat(value); break;
                case 'y': options.y = parseFloat(value); break;
                case 'at': options.at = parseInt(value); break;
                case 'session': options.session = value; break;
                case 'uuid': options.uuid = value; break;
                // set 命令选项
                case 'name': options.name = value; break;
                case 'active': options.active = value === 'true'; break;
                case 'width': options.width = parseFloat(value); break;
                case 'height': options.height = parseFloat(value); break;
                case 'anchorX': options.anchorX = parseFloat(value); break;
                case 'anchorY': options.anchorY = parseFloat(value); break;
                case 'opacity': options.opacity = parseInt(value); break;
                case 'color': options.color = value; break;
                case 'rotation': options.rotation = parseFloat(value); break;
                case 'scaleX': options.scaleX = parseFloat(value); break;
                case 'scaleY': options.scaleY = parseFloat(value); break;
                case 'zIndex': options.zIndex = parseInt(value); break;
            }
        }
    });
    
    return options;
}

// 主程序
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(JSON.stringify({
        usage: 'node scene_session.js <command> [args...] [options]',
        commands: {
            'open <场景路径>': '打开会话，返回 sessionId',
            'close --session=<ID>': '关闭会话并保存',
            'tree --session=<ID>': '显示节点树',
            'get <节点> --session=<ID>': '获取节点信息',
            'add <父节点> <名称> --session=<ID> [--type=sprite|label] [--x=N] [--y=N] [--at=N]': '添加节点',
            'set <节点> --session=<ID> [选项]': '修改节点属性',
            'delete <节点> --session=<ID>': '删除节点'
        },
        setOptions: {
            '--name=<名称>': '修改节点名称',
            '--active=true/false': '修改激活状态',
            '--x=<数值>': '修改 X 坐标',
            '--y=<数值>': '修改 Y 坐标',
            '--width=<数值>': '修改宽度',
            '--height=<数值>': '修改高度',
            '--anchorX=<0-1>': '修改锚点 X',
            '--anchorY=<0-1>': '修改锚点 Y',
            '--opacity=<0-255>': '修改透明度',
            '--color=<#RRGGBB>': '修改颜色',
            '--rotation=<角度>': '修改旋转角度',
            '--scaleX=<数值>': '修改 X 缩放',
            '--scaleY=<数值>': '修改 Y 缩放',
            '--zIndex=<数值>': '修改层级顺序'
        }
    }, null, 2));
    process.exit(0);
}

const command = args[0];
const options = parseOptions(args);

switch (command) {
    case 'open':
        if (args.length < 2) {
            console.log(JSON.stringify({ error: '用法: node scene_session.js open <场景路径>' }));
        } else {
            cmdOpen(args[1]);
        }
        break;
        
    case 'close':
        cmdClose(options.session);
        break;
        
    case 'tree':
        cmdTree(options.session);
        break;
        
    case 'get':
        if (args.length < 2) {
            console.log(JSON.stringify({ error: '用法: node scene_session.js get <节点> --session=<ID>' }));
        } else {
            cmdGet(options.session, args[1]);
        }
        break;
        
    case 'add':
        if (args.length < 3) {
            console.log(JSON.stringify({ error: '用法: node scene_session.js add <父节点> <名称> --session=<ID> [选项]' }));
        } else {
            cmdAdd(options.session, args[1], args[2], options);
        }
        break;
        
    case 'set':
        if (args.length < 2) {
            console.log(JSON.stringify({ error: '用法: node scene_session.js set <节点> --session=<ID> [选项]' }));
        } else {
            cmdSet(options.session, args[1], options);
        }
        break;
        
    case 'delete':
        if (args.length < 2) {
            console.log(JSON.stringify({ error: '用法: node scene_session.js delete <节点> --session=<ID>' }));
        } else {
            cmdDelete(options.session, args[1]);
        }
        break;
        
    default:
        console.log(JSON.stringify({ error: `未知命令: ${command}` }));
}
