/**
 * open 命令 - 打开会话
 */

const fs = require('fs');
const path = require('path');
const { generateSessionId, getSessionPath, saveSession, buildMaps } = require('../lib/session');

function run(args) {
    if (args.length < 1) {
        console.log(JSON.stringify({ error: '用法: cocos-cli open <场景文件路径>' }));
        return;
    }
    
    const firePath = args[0];
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
    
    // 返回会话信息
    const nodeCount = Object.keys(indexMap).length;
    console.log(JSON.stringify({
        sessionId,
        nodeCount,
        message: `会话已打开，共 ${nodeCount} 个节点`
    }, null, 2));
}

module.exports = { run };
