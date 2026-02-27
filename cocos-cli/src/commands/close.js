/**
 * close 命令 - 关闭会话并保存
 */

const fs = require('fs');
const { validateSession, getSessionPath } = require('../lib/session');

function run(args) {
    // 解析参数
    const sessionId = args.find(a => a.startsWith('--session='))?.split('=')[1];
    
    if (!sessionId) {
        console.log(JSON.stringify({ error: '用法: cocos-cli close --session=<会话ID>' }));
        return;
    }
    
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

module.exports = { run };
