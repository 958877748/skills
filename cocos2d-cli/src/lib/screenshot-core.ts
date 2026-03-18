import { chromium, Browser, Page, ConsoleMessage } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ScreenshotConfig {
    jsonPath: string;
    outputDir: string;
    viewport: { width: number; height: number };
    fullPage: boolean;
    debugBounds: boolean;
    timeout: number;
    waitTime: number;
}

interface LogEntry {
    timestamp: string;
    type: string;
    text: string;
    error?: string;
}

const DEFAULT_CONFIG: Partial<ScreenshotConfig> = {
    outputDir: process.cwd(),
    viewport: { width: 750, height: 1334 },
    fullPage: true,
    debugBounds: false,
    timeout: 30000,
    waitTime: 3000
};

// 获取内置资源目录
function getAssetsDir(): string {
    // 编译后在 dist/src/lib/screenshot-core.js，data 目录在 dist 同级
    // 从 dist/src/lib 向上三级到项目根目录，再进入 data/screenshot
    return path.join(__dirname, '..', '..', '..', 'data', 'screenshot');
}

// 创建临时工作目录
async function createTempWorkDir(): Promise<string> {
    const tempBase = process.env.TEMP || process.env.TMP || '/tmp';
    const timestamp = Date.now();
    const tempDir = path.join(tempBase, `cocos2d-screenshot-${timestamp}`);
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
}

// 复制内置资源到临时目录
async function copyBuiltInAssets(tempDir: string, logs: LogEntry[]): Promise<void> {
    const assetsDir = getAssetsDir();
    const assets = ['index.html', 'favicon.ico'];
    
    for (const asset of assets) {
        const src = path.join(assetsDir, asset);
        const dest = path.join(tempDir, asset);
        try {
            await fs.copyFile(src, dest);
        } catch (err: any) {
            logs.push({
                timestamp: new Date().toISOString(),
                type: 'warning',
                text: `Could not copy ${asset}: ${err.message}`
            });
        }
    }
}

// 静态文件服务器
async function startServer(staticDir: string, logs: LogEntry[]): Promise<http.Server> {
    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            try {
                const reqUrl = new URL(req.url || '/', `http://${req.headers.host}`);
                let filePath = path.join(staticDir, reqUrl.pathname);
                
                if (reqUrl.pathname === '/') {
                    filePath = path.join(staticDir, 'index.html');
                }
                
                const data = await fs.readFile(filePath);
                
                const ext = path.extname(filePath).toLowerCase();
                const contentTypes: Record<string, string> = {
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
                
            } catch (err: any) {
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
async function removeDir(dirPath: string, logs?: LogEntry[]): Promise<void> {
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
    } catch (err: any) {
        if (logs) {
            logs.push({
                timestamp: new Date().toISOString(),
                type: 'warning',
                text: `Could not remove temp dir: ${err.message}`
            });
        }
    }
}

async function launchBrowser(addLog: (type: string, text: string, extra?: Record<string, any>) => void) {
    try {
        addLog('info', 'Launching Playwright Chromium');
        const browser = await chromium.launch({
            headless: true,
        });
        addLog('info', 'Browser launched with Playwright Chromium');
        return browser;
    } catch (error: any) {
        const message = String(error?.message || error);

        if (!message.includes("Executable doesn't exist")) {
            throw error;
        }

        addLog('warn', 'Playwright Chromium not found, falling back to system Edge');

        const browser = await chromium.launch({
            channel: 'msedge',
            headless: true,
        });

        addLog('info', 'Browser launched with system Edge');
        return browser;
    }
}


/**
 * 截图核心函数
 */
export async function takeScreenshot(userConfig: Partial<ScreenshotConfig> = {}): Promise<{ screenshotPath: string; logs: LogEntry[] }> {
    const config = { ...DEFAULT_CONFIG, ...userConfig } as ScreenshotConfig;
    
    if (!config.jsonPath) {
        throw new Error('JSON file path is required');
    }
    
    let server: http.Server | null = null;
    let browser: Browser | null = null;
    let tempDir: string | null = null;
    const logs: LogEntry[] = [];
    let screenshotPath: string | null = null;
    let logDir: string | null = null;
    
    const addLog = (type: string, text: string, extra: Record<string, any> = {}) => {
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
        const address = server.address() as { port: number };
        const serverUrl = `http://127.0.0.1:${address.port}`;
        addLog('info', `Server: ${serverUrl}`);

        // 启动浏览器
        addLog('info', 'Launching Browser');
        browser = await launchBrowser(addLog);
        addLog('info', 'Browser launched');

        const page = await browser.newPage({
            viewport: config.viewport
        });

        // 监听浏览器控制台日志
        page.on('console', (msg: ConsoleMessage) => {
            const text = msg.text();
            addLog(msg.type(), text);
        });

        page.on('pageerror', (error: Error) => {
            addLog('pageerror', error.message);
        });

        page.on('requestfailed', (request: any) => {
            const failure = request.failure();
            const errorText = failure ? failure.errorText : 'Unknown error';
            addLog('requestfailed', request.url(), { error: errorText });
        });

        // 加载页面
        addLog('info', 'Loading Page');
        const baseUrl = `${serverUrl}/index.html`;
        const searchParams = new URLSearchParams();
        searchParams.set('width', config.viewport.width.toString());
        if (config.debugBounds) {
            searchParams.set('debugBounds', 'true');
        }
        const pageUrl = `${baseUrl}?${searchParams.toString()}`;
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

    } catch (error: any) {
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