'use strict';

const http = require('http');

let server = null;
let port = 7455;

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

                if (req.url === '/refresh' && req.method === 'POST') {
                    // 刷新资源数据库
                    Editor.assetdb.refresh('db://assets', (err) => {
                        if (err) {
                            res.end(JSON.stringify({ success: false, error: err.message }));
                        } else {
                            res.end(JSON.stringify({ success: true, message: 'Refreshed' }));
                        }
                    });
                } else {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ success: false, error: 'Not found' }));
                }
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
