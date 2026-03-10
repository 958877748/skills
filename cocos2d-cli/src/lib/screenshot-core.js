/**
 * Screenshot Core Module  
 * 渲染 JSON 数据并使用 Playwright 截图
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const url = require('url');
const os = require('os');

// 默认配置
const DEFAULT_CONFIG = {
    jsonPath: null,
    outputDir: process.cwd(),
    viewport: { width: 750, height: 1334 },
    fullPage: true,
    debugBounds: false,
    timeout: 30000,
    waitTime: 1000
};

// 获取内置资源目录
function getAssetsDir() {
    return path.join(__dirname, 'screenshot');
}

// 创建临时工作目录
async function createTempWorkDir() {
    const tempBase = os.tmpdir();
    const timestamp = Date.now();
    const tempDir = path.join(tempBase, `cocos2d-screenshot-${timestamp}`);
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
}

// 复制内置资源到临时目录
async function copyBuiltInAssets(tempDir, logs) {
    const assetsDir = getAssetsDir();
    const assets = ['index.html', 'favicon.ico'];
    
    for (const asset of assets) {
        const src = path.join(assetsDir, asset);
        const dest = path.join(tempDir, asset);
        try {
            await fs.copyFile(src, dest);
        } catch (err) {
            logs.push({
                timestamp: new Date().toISOString(),
                type: 'warning',
                text: `Could not copy ${asset}: ${err.message}`
            });
        }
    }
}

// 静态文件服务器
async function startServer(staticDir, logs) {
    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            try {
                const parsedUrl = url.parse(req.url);
                let filePath = path.join(staticDir, parsedUrl.pathname);
                
                if (parsedUrl.pathname === '/') {
                    filePath = path.join(staticDir, 'index.html');
                }
                
                const data = await fs.readFile(filePath);
                
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
                    '.xml': 'application/xml'
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
                    logs.push({
                        timestamp: new Date().toISOString(),
                        type: 'server-error',
                        text: `${req.url}: ${err.message}`
                    });
                    res.writeHead(500);
                    res.end();
                }
            }
        });
        
        server.listen(0, '127.0.0.1', () => resolve(server));
    });
}

// 递归删除目录
async function removeDir(dirPath, logs) {
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
    } catch (err) {
        if (logs) {
            logs.push({
                timestamp: new Date().toISOString(),
                type: 'warning',
                text: `Could not remove temp dir: ${err.message}`
            });
        }
    }
}

/**
 * 截图核心函数
 * @param {Object} userConfig - 配置选项
 * @param {string} userConfig.jsonPath - JSON 文件路径
 * @param {string} userConfig.outputDir - 输出目录
 * @param {Object} userConfig.viewport - 视口大小 {width, height}
 * @param {boolean} userConfig.fullPage - 是否全页截图
 * @param {number} userConfig.timeout - 超时时间（毫秒）
 * @param {number} userConfig.waitTime - 等待时间（毫秒）
 * @returns {Promise<{screenshotPath: string, logs: Array}>}
 */
async function takeScreenshot(userConfig = {}) {
    const config = { ...DEFAULT_CONFIG, ...userConfig };
    
    if (!config.jsonPath) {
        throw new Error('JSON file path is required');
    }
    
    let server = null;
    let browser = null;
    let tempDir = null;
    const logs = [];
    let screenshotPath = null;
    let logDir = null;
    
    const addLog = (type, text, extra = {}) => {
        logs.push({
            timestamp: new Date().toISOString(),
            type,
            text,
            ...extra
        });
    };
    
    try {
        const timestamp = Date.now();
        
        // 检查 JSON 文件是否存在
        try {
            await fs.access(config.jsonPath);
        } catch (error) {
            throw new Error(`JSON file not found: ${config.jsonPath}`);
        }
        
        // 确保输出目录存在
        await fs.mkdir(config.outputDir, { recursive: true });
        
        // 创建临时工作目录
        tempDir = await createTempWorkDir();
        addLog('info', `Temp dir: ${tempDir}`);

        // 复制内置资源到临时目录
        await copyBuiltInAssets(tempDir, logs);
 
        // 复制用户的 JSON 文件到临时目录
        const destJsonPath = path.join(tempDir, 'data.json');
        await fs.copyFile(config.jsonPath, destJsonPath);
        addLog('info', `JSON: ${config.jsonPath}`);

        // 截图输出路径
        screenshotPath = path.join(config.outputDir, `screenshot-${timestamp}.png`);

        // 启动HTTP服务器
        addLog('info', 'Starting Server');
        server = await startServer(tempDir, logs);
        const serverUrl = `http://127.0.0.1:${server.address().port}`;
        addLog('info', `Server: ${serverUrl}`);

        // 启动浏览器
        addLog('info', 'Launching Browser');
        browser = await chromium.launch({
            headless: true,
            channel: 'chrome'
        });
        addLog('info', 'Browser launched');

        const page = await browser.newPage({
            viewport: config.viewport
        });

        // 监听浏览器控制台日志
        page.on('console', msg => {
            const text = msg.text();
            addLog(msg.type(), text);
        });

        page.on('pageerror', error => {
            addLog('pageerror', error.message);
        });

        page.on('requestfailed', request => {
            const failure = request.failure();
            const errorText = failure ? failure.errorText : 'Unknown error';
            addLog('requestfailed', request.url(), { error: errorText });
        });

        // 加载页面
        addLog('info', 'Loading Page');
        const pageUrl = config.debugBounds
            ? `${serverUrl}/index.html?debugBounds=true`
            : `${serverUrl}/index.html`;
        await page.goto(pageUrl, {
            waitUntil: 'networkidle',
            timeout: config.timeout
        });
        addLog('info', 'Page loaded');

        // 等待渲染
        addLog('info', 'Waiting for Render');
        await page.waitForTimeout(config.waitTime);
        addLog('info', 'Wait complete');

        // 截图
        addLog('info', 'Taking Screenshot');
        await page.screenshot({
            path: screenshotPath,
            fullPage: config.fullPage
        });
        addLog('info', `Screenshot saved: ${screenshotPath}`);
        addLog('info', 'Done');

        return { screenshotPath, logs };

    } catch (error) {
        addLog('error', error.message);
        try {
            logDir = path.join(config.outputDir, `screenshot-logs-${Date.now()}`);
            await fs.mkdir(logDir, { recursive: true });
            await fs.writeFile(
                path.join(logDir, 'logs.json'),
                JSON.stringify({
                    error: error.message,
                    jsonPath: config.jsonPath,
                    outputDir: config.outputDir,
                    viewport: config.viewport,
                    fullPage: config.fullPage,
                    debugBounds: config.debugBounds,
                    timeout: config.timeout,
                    waitTime: config.waitTime,
                    screenshotPath,
                    logs
                }, null, 2),
                'utf8'
            );
        } catch (_) {}
        error.logDir = logDir;
        throw error;
    } finally {
        // 清理资源
        if (browser) await browser.close().catch(() => {});
        if (server) server.close();
        if (tempDir) await removeDir(tempDir, logs);
    }
}

module.exports = { takeScreenshot };
