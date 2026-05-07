/**
 * Playwright 截图核心
 * @module lib/screenshot-core
 */

import { chromium } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as http from 'http';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONFIG = {
    outputDir: process.cwd(),
    viewport: { width: 750, height: 1334 },
    fullPage: true,
    debugBounds: false,
    timeout: 30000,
    waitTime: 3000
};
function getAssetsDir() {
    return path.join(__dirname, '..', '..', '..', 'data', 'screenshot');
}
async function createTempWorkDir() {
    const tempBase = process.env.TEMP || process.env.TMP || '/tmp';
    const timestamp = Date.now();
    const tempDir = path.join(tempBase, `cocos2d-screenshot-${timestamp}`);
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
}
async function copyBuiltInAssets(tempDir, logs) {
    const assetsDir = getAssetsDir();
    const assets = ['index.html', 'favicon.ico'];
    for (const asset of assets) {
        const src = path.join(assetsDir, asset);
        const dest = path.join(tempDir, asset);
        try {
            await fs.copyFile(src, dest);
        }
        catch (err) {
            logs.push({
                timestamp: new Date().toISOString(),
                type: 'warning',
                text: `Could not copy ${asset}: ${err.message}`
            });
        }
    }
}
async function startServer(staticDir, logs) {
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
            }
            catch (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404);
                    res.end();
                }
                else {
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
async function removeDir(dirPath, logs) {
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
    }
    catch (err) {
        if (logs) {
            logs.push({
                timestamp: new Date().toISOString(),
                type: 'warning',
                text: `Could not remove temp dir: ${err.message}`
            });
        }
    }
}
async function launchBrowser(addLog) {
    try {
        addLog('info', 'Launching Playwright Chromium');
        const browser = await chromium.launch({
            headless: true,
        });
        addLog('info', 'Browser launched with Playwright Chromium');
        return browser;
    }
    catch (error) {
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
export async function takeScreenshot(userConfig = {}) {
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
        try {
            await fs.access(config.jsonPath);
        }
        catch (error) {
            throw new Error(`JSON file not found: ${config.jsonPath}`);
        }
        await fs.mkdir(config.outputDir, { recursive: true });
        tempDir = await createTempWorkDir();
        addLog('info', `Temp dir: ${tempDir}`);
        await copyBuiltInAssets(tempDir, logs);
        const destJsonPath = path.join(tempDir, 'data.json');
        await fs.copyFile(config.jsonPath, destJsonPath);
        addLog('info', `JSON: ${config.jsonPath}`);
        screenshotPath = path.join(config.outputDir, `screenshot-${timestamp}.png`);
        addLog('info', 'Starting Server');
        server = await startServer(tempDir, logs);
        const address = server.address();
        const serverUrl = `http://127.0.0.1:${address.port}`;
        addLog('info', `Server: ${serverUrl}`);
        addLog('info', 'Launching Browser');
        browser = await launchBrowser(addLog);
        addLog('info', 'Browser launched');
        const page = await browser.newPage({
            viewport: config.viewport
        });
        page.on('console', (msg) => {
            const text = msg.text();
            addLog(msg.type(), text);
        });
        page.on('pageerror', (error) => {
            addLog('pageerror', error.message);
        });
        page.on('requestfailed', (request) => {
            const failure = request.failure();
            const errorText = failure ? failure.errorText : 'Unknown error';
            addLog('requestfailed', request.url(), { error: errorText });
        });
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
        addLog('info', 'Waiting for Render');
        await page.waitForTimeout(config.waitTime);
        addLog('info', 'Wait complete');
        addLog('info', 'Taking Screenshot');
        await page.screenshot({
            path: screenshotPath,
            fullPage: config.fullPage
        });
        addLog('info', `Screenshot saved: ${screenshotPath}`);
        addLog('info', 'Done');
        return { screenshotPath, logs };
    }
    catch (error) {
        addLog('error', error.message);
        try {
            logDir = path.join(config.outputDir, `screenshot-logs-${Date.now()}`);
            await fs.mkdir(logDir, { recursive: true });
            await fs.writeFile(path.join(logDir, 'logs.json'), JSON.stringify({
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
            }, null, 2), 'utf8');
        }
        catch (_) { }
        error.logDir = logDir;
        throw error;
    }
    finally {
        if (browser)
            await browser.close().catch(() => { });
        if (server)
            server.close();
        if (tempDir)
            await removeDir(tempDir, logs);
    }
}
