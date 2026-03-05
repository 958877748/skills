'use strict';

const http = require('http');
const { version } = require('./package.json');

let server = null;
let port = 7455;

// 解析 POST 请求体
function parseBody(req, callback) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            callback(JSON.parse(body || '{}'));
        } catch (e) {
            callback({});
        }
    });
}

module.exports = {
    load() {
        this.startServer();
    },

    unload() {
        this.stopServer();
    },

    startServer() {
        const tryStart = (currentPort, retries) => {
            if (retries <= 0) {
                console.log('[CLI Helper] 无法找到可用端口');
                return;
            }

            server = http.createServer((req, res) => {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Content-Type', 'application/json');

                // 状态检查接口
                if (req.url === '/status' && req.method === 'GET') {
                    res.end(JSON.stringify({
                        success: true,
                        version: version,
                        status: 'running',
                        port: port,
                        timestamp: new Date().toISOString()
                    }));
                    return;
                }

                // 获取当前场景接口
                if (req.url === '/current-scene' && req.method === 'GET') {
                    Editor.Ipc.sendToPanel('scene', 'scene:query-hierarchy', (err, sceneId, hierarchy) => {
                        if (err || !sceneId) {
                            res.end(JSON.stringify({
                                success: false,
                                error: err ? err.message : 'No scene opened',
                                sceneUrl: null,
                                sceneId: null
                            }));
                            return;
                        }
                        
                        // 将 sceneId (UUID) 转换为 URL
                        const sceneUrl = Editor.assetdb.uuidToUrl(sceneId);
                        res.end(JSON.stringify({
                            success: true,
                            sceneUrl: sceneUrl,
                            sceneId: sceneId
                        }));
                    });
                    return;
                }

                // 刷新接口
                if (req.url === '/refresh' && req.method === 'POST') {
                    parseBody(req, (body) => {
                        const sceneUrl = body.sceneUrl;
                        
                        // 刷新资源数据库
                        Editor.assetdb.refresh('db://assets', (err) => {
                            if (err) {
                                res.end(JSON.stringify({ success: false, error: err.message }));
                                return;
                            }
                            
                            // 如果指定了场景 URL，重新打开场景
                            if (sceneUrl) {
                                // 使用 urlToUuid 获取场景的 uuid
                                const uuid = Editor.assetdb.urlToUuid(sceneUrl);
                                if (!uuid) {
                                    res.end(JSON.stringify({ 
                                        success: true, 
                                        message: 'Refreshed but scene uuid not found',
                                        sceneUrl: sceneUrl
                                    }));
                                    return;
                                }
                                
                                // 延迟 10ms 再重新打开场景，给编辑器留出处理时间
                                setTimeout(() => {
                                    Editor.Ipc.sendToMain('scene:open-by-uuid', uuid);
                                }, 10);
                                
                                res.end(JSON.stringify({ 
                                    success: true, 
                                    message: 'Refreshed and scene reopened',
                                    sceneUrl: sceneUrl,
                                    uuid: uuid
                                }));
                            } else {
                                res.end(JSON.stringify({ success: true, message: 'Refreshed' }));
                            }
                        });
                    });
                    return;
                }

                // 404
                res.statusCode = 404;
                res.end(JSON.stringify({ success: false, error: 'Not found' }));
            });

            server.on('error', (e) => {
                if (e.code === 'EADDRINUSE') {
                    console.log(`[CLI Helper] 端口 ${currentPort} 被占用，尝试 ${currentPort + 1}`);
                    tryStart(currentPort + 1, retries - 1);
                } else {
                    console.log(`[CLI Helper] 服务器错误: ${e.message}`);
                }
            });

            server.listen(currentPort, () => {
                port = currentPort;
                console.log(`[CLI Helper] 服务器运行在 http://127.0.0.1:${currentPort}`);
                console.log(`[CLI Helper] 版本: ${version}`);
            });
        };

        tryStart(port, 10);
    },

    stopServer() {
        if (server) {
            server.close();
            server = null;
            console.log('[CLI Helper] 服务器已停止');
        }
    },

    messages: {
        refresh() {
            Editor.assetdb.refresh('db://assets');
        }
    }
};
