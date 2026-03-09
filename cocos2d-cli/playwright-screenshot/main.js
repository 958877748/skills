// screenshot.js - 最终完整版
const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const url = require('url');
const os = require('os');

// 静态文件服务器
async function startServer(staticDir) {
    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            try {
                const parsedUrl = url.parse(req.url);
                let filePath = path.join(staticDir, parsedUrl.pathname);
                
                // 如果请求根路径，返回index.html
                if (parsedUrl.pathname === '/') {
                    filePath = path.join(staticDir, 'index.html');
                }
                
                const data = await fs.readFile(filePath);
                
                // 根据文件扩展名设置正确的Content-Type
                const ext = path.extname(filePath).toLowerCase();
                const contentTypes = {
                    '.html': 'text/html',
                    '.htm': 'text/html',
                    '.json': 'application/json',
                    '.js': 'application/javascript',
                    '.mjs': 'application/javascript',
                    '.css': 'text/css',
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.gif': 'image/gif',
                    '.svg': 'image/svg+xml',
                    '.ico': 'image/x-icon',
                    '.txt': 'text/plain',
                    '.xml': 'application/xml',
                    '.fire': 'application/octet-stream',
                    '.prefab': 'application/octet-stream',
                    '.anim': 'application/octet-stream'
                };
                
                res.writeHead(200, { 
                    'Content-Type': contentTypes[ext] || 'application/octet-stream',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(data);
                
            } catch (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404);
                    res.end();
                } else {
                    console.error(`❌ [服务器错误] ${req.url}:`, err.message);
                    res.writeHead(500);
                    res.end();
                }
            }
        });
        
        server.listen(0, '127.0.0.1', () => resolve(server));
    });
}

// 获取临时目录路径
function getTempDir() {
    return os.tmpdir();
}

async function main() {
    let server = null;
    let browser = null;
    const logs = [];
    
    try {
        const currentDir = process.cwd();
        const htmlFilePath = path.join(currentDir, 'index.html');
        const jsonFilePath = path.join(currentDir, 'data.json');
        const timestamp = Date.now();
        
        // 截图保存在当前目录
        const screenshotPath = path.join(currentDir, `screenshot-${timestamp}.png`);
        
        // 日志文件保存在临时目录
        const logPath = path.join(getTempDir(), `playwright-logs-${timestamp}.json`);

        console.log('🚀 Playwright 截图工具启动\n');

        // === 检查文件 ===
        console.log('=== 检查文件 ===');
        try {
            await fs.access(htmlFilePath);
            console.log(`✅ HTML文件: ${path.basename(htmlFilePath)}`);
        } catch (error) {
            console.error(`❌ 错误: 找不到 ${htmlFilePath}`);
            return;
        }
        
        try {
            await fs.access(jsonFilePath);
            console.log(`✅ JSON文件: ${path.basename(jsonFilePath)}`);
        } catch (error) {
            console.log(`⚠️ 警告: ${path.basename(jsonFilePath)} 不存在`);
        }

        // === 启动HTTP服务器 ===
        console.log('\n=== 启动HTTP服务器 ===');
        server = await startServer(currentDir);
        const serverUrl = `http://127.0.0.1:${server.address().port}`;
        console.log(`✅ 服务器: ${serverUrl}`);

        // === 启动浏览器 ===
        console.log('\n=== 启动浏览器 ===');
        browser = await chromium.launch({
            headless: true,
            channel: 'chrome'
        });
        console.log('✅ 浏览器已启动');

        // 创建新页面
        const page = await browser.newPage({
            viewport: { width: 750, height: 1334 }
        });

        // 监听浏览器控制台日志
        page.on('console', msg => {
            const text = msg.text();
            logs.push({ 
                timestamp: new Date().toISOString(), 
                type: msg.type(), 
                text 
            });
            
            if (msg.type() === 'error') {
                console.error(`❌ [浏览器] ${text}`);
            } else if (msg.type() === 'warning') {
                console.warn(`⚠️ [浏览器] ${text}`);
            } else {
                console.log(`📢 [浏览器] ${text}`);
            }
        });

        // 监听页面JavaScript错误
        page.on('pageerror', error => {
            logs.push({
                timestamp: new Date().toISOString(),
                type: 'pageerror',
                text: error.message
            });
            console.error('❌ [页面错误]', error.message);
        });

        // 监听请求失败
        page.on('requestfailed', request => {
            const failure = request.failure();
            const errorText = failure ? failure.errorText : '未知错误';
            logs.push({
                timestamp: new Date().toISOString(),
                type: 'requestfailed',
                url: request.url(),
                error: errorText
            });
            console.error(`❌ [请求失败] ${request.url()}`);
        });

        // === 加载页面 ===
        console.log('\n=== 加载页面 ===');
        await page.goto(`${serverUrl}/index.html`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        console.log('✅ 页面加载完成');

        // 等待渲染
        console.log('\n=== 等待渲染 ===');
        await page.waitForTimeout(1000);
        console.log('✅ 等待完成');

        // === 截图 ===
        console.log('\n=== 保存截图 ===');
        await page.screenshot({
            path: screenshotPath,
            fullPage: true
        });
        console.log(`✅ 截图已保存: ${path.basename(screenshotPath)}`);

        // === 保存日志 ===
        if (logs.length > 0) {
            const logData = {
                system: {
                    timestamp: new Date().toISOString(),
                    platform: os.platform(),
                    arch: os.arch(),
                    screenshot: path.basename(screenshotPath)
                },
                logs: logs,
                summary: {
                    total: logs.length,
                    errors: logs.filter(log => log.type === 'error' || log.type === 'pageerror' || log.type === 'requestfailed').length,
                    warnings: logs.filter(log => log.type === 'warning').length
                }
            };
            
            await fs.writeFile(logPath, JSON.stringify(logData, null, 2));
            console.log(`✅ 日志已保存: ${path.basename(logPath)}`);
        }

        // === 完成 ===
        console.log('\n=== 完成 ===');
        console.log(`📸 截图: ${screenshotPath}`);
        console.log(`📝 日志: ${logPath}`);
        console.log(`🗑️  临时目录: ${getTempDir()}`);

        // === 清理 ===
        await browser.close();
        server.close();
        console.log('\n✅ 所有操作完成！');

    } catch (error) {
        console.error('\n❌ 执行出错:', error);
        
        // 清理资源
        if (browser) await browser.close().catch(() => {});
        if (server) server.close();
    }
}

// 执行主函数
main().catch(console.error);