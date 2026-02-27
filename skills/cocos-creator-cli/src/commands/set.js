/**
 * set 命令 - 修改节点属性
 */

const { validateSession, saveSession, findNodeIndex } = require('../lib/session');

// 解析颜色
function parseColor(colorStr) {
    if (!colorStr) return null;
    let color = colorStr;
    if (typeof color === 'string') {
        if (color.startsWith('#')) color = color.slice(1);
        if (color.length === 6) {
            const r = parseInt(color.slice(0, 2), 16);
            const g = parseInt(color.slice(2, 4), 16);
            const b = parseInt(color.slice(4, 6), 16);
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                return { "__type__": "cc.Color", r, g, b, a: 255 };
            }
        }
    }
    return null;
}

function run(args) {
    if (args.length < 1) {
        console.log(JSON.stringify({ error: '用法: cocos-cli set <节点索引|名称> --session=<会话ID> [选项]' }));
        return;
    }
    
    const nodeRef = args[0];
    const sessionId = args.find(a => a.startsWith('--session='))?.split('=')[1];
    
    if (!sessionId) {
        console.log(JSON.stringify({ error: '缺少 --session 参数' }));
        return;
    }
    
    // 解析选项
    const options = {};
    args.slice(1).forEach(arg => {
        if (arg.startsWith('--') && !arg.startsWith('--session')) {
            const [key, value] = arg.substring(2).split('=');
            options[key] = value;
        }
    });
    
    const validation = validateSession(sessionId);
    
    if (!validation.valid) {
        console.log(JSON.stringify({ error: validation.error }));
        return;
    }
    
    const session = validation.session;
    const sessionPath = validation.sessionPath;
    const data = session.data;
    
    // 查找节点
    const nodeIndex = findNodeIndex(data, session.indexMap, nodeRef);
    
    if (nodeIndex === null || !data[nodeIndex]) {
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
        if (session.indexMap[nodeIndex]) {
            session.indexMap[nodeIndex].name = options.name;
        }
    }
    
    // 修改激活状态
    if (options.active !== undefined) {
        const oldActive = node._active;
        node._active = options.active !== 'false';
        changes.active = { from: oldActive, to: node._active };
    }
    
    // 修改位置
    if (options.x !== undefined || options.y !== undefined) {
        if (!node._trs) {
            node._trs = { "__type__": "TypedArray", "ctor": "Float64Array", "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] };
        }
        const oldX = node._trs.array[0];
        const oldY = node._trs.array[1];
        if (options.x !== undefined) node._trs.array[0] = parseFloat(options.x);
        if (options.y !== undefined) node._trs.array[1] = parseFloat(options.y);
        changes.position = { from: [oldX, oldY], to: [node._trs.array[0], node._trs.array[1]] };
    }
    
    // 修改大小
    if (options.width !== undefined || options.height !== undefined) {
        if (!node._contentSize) {
            node._contentSize = { "__type__": "cc.Size", width: 0, height: 0 };
        }
        const oldW = node._contentSize.width;
        const oldH = node._contentSize.height;
        if (options.width !== undefined) node._contentSize.width = parseFloat(options.width);
        if (options.height !== undefined) node._contentSize.height = parseFloat(options.height);
        changes.size = { from: { width: oldW, height: oldH }, to: { width: node._contentSize.width, height: node._contentSize.height } };
    }
    
    // 修改锚点
    if (options.anchorX !== undefined || options.anchorY !== undefined) {
        if (!node._anchorPoint) {
            node._anchorPoint = { "__type__": "cc.Vec2", x: 0.5, y: 0.5 };
        }
        const oldX = node._anchorPoint.x;
        const oldY = node._anchorPoint.y;
        if (options.anchorX !== undefined) node._anchorPoint.x = parseFloat(options.anchorX);
        if (options.anchorY !== undefined) node._anchorPoint.y = parseFloat(options.anchorY);
        changes.anchor = { from: [oldX, oldY], to: [node._anchorPoint.x, node._anchorPoint.y] };
    }
    
    // 修改透明度
    if (options.opacity !== undefined) {
        const oldOpacity = node._opacity;
        node._opacity = Math.max(0, Math.min(255, parseInt(options.opacity)));
        changes.opacity = { from: oldOpacity, to: node._opacity };
    }
    
    // 修改颜色
    if (options.color !== undefined) {
        const color = parseColor(options.color);
        if (color) {
            node._color = color;
            changes.color = { to: options.color };
        }
    }
    
    // 修改旋转角度
    if (options.rotation !== undefined) {
        if (!node._eulerAngles) {
            node._eulerAngles = { "__type__": "cc.Vec3", x: 0, y: 0, z: 0 };
        }
        const oldRotation = node._eulerAngles.z;
        node._eulerAngles.z = parseFloat(options.rotation);
        changes.rotation = { from: oldRotation, to: node._eulerAngles.z };
    }
    
    // 修改缩放
    if (options.scaleX !== undefined || options.scaleY !== undefined) {
        if (!node._trs) {
            node._trs = { "__type__": "TypedArray", "ctor": "Float64Array", "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] };
        }
        const oldScaleX = node._trs.array[7];
        const oldScaleY = node._trs.array[8];
        if (options.scaleX !== undefined) node._trs.array[7] = parseFloat(options.scaleX);
        if (options.scaleY !== undefined) node._trs.array[8] = parseFloat(options.scaleY);
        changes.scale = { from: [oldScaleX, oldScaleY], to: [node._trs.array[7], node._trs.array[8]] };
    }
    
    // 保存会话
    saveSession(sessionPath, session);
    
    console.log(JSON.stringify({
        success: true,
        index: nodeIndex,
        name: node._name,
        changes
    }, null, 2));
}

module.exports = { run };
