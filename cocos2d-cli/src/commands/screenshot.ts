import * as path from 'path';
import { takeScreenshot } from '../lib/screenshot-core.js';

export async function run(args: string[]): Promise<void> {
    const jsonFilePath = args[0];
    
    if (!jsonFilePath) {
        console.log(JSON.stringify({ error: '用法: cocos2d-cli screenshot <json文件> [--width <宽度>] [--height <高度>] [--output <输出路径>]' }));
        return;
    }
    
    // 解析选项
    let width = 750;
    let height = 1334;
    let outputPath = path.join(process.cwd(), `screenshot-${Date.now()}.png`);
    
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--width' && args[i + 1]) {
            width = parseInt(args[i + 1]);
            i++;
        } else if (arg === '--height' && args[i + 1]) {
            height = parseInt(args[i + 1]);
            i++;
        } else if (arg === '--output' && args[i + 1]) {
            outputPath = args[i + 1];
            i++;
        }
    }
    
    try {
        const { screenshotPath, logs } = await takeScreenshot({
            jsonPath: jsonFilePath,
            viewport: { width, height },
            outputDir: path.dirname(outputPath),
            fullPage: true,
            timeout: 30000,
            waitTime: 3000
        });
        console.log(JSON.stringify({ success: true, outputPath: screenshotPath }));
    } catch (err: any) {
        console.log(JSON.stringify({ error: err.message }));
    }
}
