import * as path from 'path';
import { takeScreenshot } from '../lib/screenshot-core.js';

export async function run(args: string[]): Promise<void> {
    const jsonFilePath = args[0];
    
    if (!jsonFilePath) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli screenshot <json文件> [--width <宽度>] [--height <高度>] [--output <输出目录>] [--debug-bounds] [--wait <毫秒>]' }));
        return;
    }
    
    // 解析选项
    let width = 750;
    let height = 1334;
    let outputDir = process.cwd();
    let debugBounds = false;
    let waitTime = 3000;
    
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--width' && args[i + 1]) {
            width = parseInt(args[i + 1]);
            i++;
        } else if (arg === '--height' && args[i + 1]) {
            height = parseInt(args[i + 1]);
            i++;
        } else if ((arg === '--output' || arg === '-o') && args[i + 1]) {
            outputDir = args[i + 1];
            i++;
        } else if (arg === '--debug-bounds') {
            debugBounds = true;
        } else if (arg === '--wait' && args[i + 1]) {
            waitTime = parseInt(args[i + 1]);
            i++;
        }
    }
    
    try {
        const { screenshotPath, logs } = await takeScreenshot({
            jsonPath: jsonFilePath,
            viewport: { width, height },
            outputDir,
            fullPage: true,
            debugBounds,
            timeout: 30000,
            waitTime
        });
        const filename = path.basename(screenshotPath);
        console.log(JSON.stringify({ success: true, filename }));
    } catch (err: any) {
        console.log(JSON.stringify({ error: err.message }));
    }
}
