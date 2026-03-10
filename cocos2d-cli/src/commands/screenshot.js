/**
 * screenshot 命令  
 * 渲染 JSON 数据并截图
 */

const path = require('path');
const { takeScreenshot } = require('../lib/screenshot-core');

function showHelp() {
    console.log(`
用法:
  cocos2d-cli screenshot <json文件> [选项]

选项:
  -o, --output <目录>     输出目录，默认当前目录
  --width <数值>          视口宽度，默认 750（不支持简写）
  --height <数值>         视口高度，默认 1334（不支持简写）
  --full-page             全页截图（默认）
  --no-full-page          仅视口截图
  --debug-bounds          叠加节点边界框和名称，方便定位布局问题
  --timeout <毫秒>        页面加载超时，默认 30000
  --wait <毫秒>           截图前等待时间，默认 1000

示例:
  cocos2d-cli screenshot data.json
  cocos2d-cli screenshot data.json -o ./screenshots
  cocos2d-cli screenshot data.json --width 1080 --height 1920
  cocos2d-cli screenshot data.json --debug-bounds
  cocos2d-cli screenshot data.json --no-full-page
`);
}

function parseArgs(args) {
    const options = {
        jsonPath: null,
        outputDir: '.',
        viewport: { width: 750, height: 1334 },
        fullPage: true,
        debugBounds: false,
        timeout: 30000,
        waitTime: 1000
    };

    let i = 0;
    while (i < args.length) {
        const arg = args[i];
        
        if (arg === '--help' || arg === '-h') {
            showHelp();
            process.exit(0);
        }
        
        if (arg === '-o' || arg === '--output') {
            options.outputDir = args[++i];
        } else if (arg === '--width') {
            options.viewport.width = parseInt(args[++i], 10);
        } else if (arg === '--height') {
            options.viewport.height = parseInt(args[++i], 10);
        } else if (arg === '--full-page') {
            options.fullPage = true;
        } else if (arg === '--no-full-page') {
            options.fullPage = false;
        } else if (arg === '--debug-bounds') {
            options.debugBounds = true;
        } else if (arg === '--timeout') {
            options.timeout = parseInt(args[++i], 10);
        } else if (arg === '--wait') {
            options.waitTime = parseInt(args[++i], 10);
        } else if (!arg.startsWith('-')) {
            options.jsonPath = arg;
        }
        
        i++;
    }

    return options;
}

async function run(args) {
    const options = parseArgs(args);

    if (!options.jsonPath) {
        console.error('错误: 请指定 JSON 文件路径');
        showHelp();
        process.exit(1);
    }

    options.jsonPath = path.resolve(options.jsonPath);
    options.outputDir = path.resolve(options.outputDir);

    try {
        await takeScreenshot(options);
        console.log('成功');
    } catch (error) {
        console.error('失败');
        if (error.logDir) {
            console.error(`日志目录: ${error.logDir}`);
        }
        process.exit(1);
    }
}

module.exports = { run };
