#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const { takeScreenshot } = require('./main');

program
    .name('pws')
    .description('Playwright Screenshot - Render JSON data and take screenshot')
    .version('1.0.0')
    .argument('<json>', 'JSON file path to render')
    .option('-o, --output <path>', 'Output directory for screenshots', '.')
    .option('-w, --width <number>', 'Viewport width', '750')
    .option('-h, --height <number>', 'Viewport height', '1334')
    .option('--full-page', 'Take full page screenshot', true)
    .option('--no-full-page', 'Take viewport-only screenshot')
    .option('--timeout <ms>', 'Page load timeout in milliseconds', '30000')
    .option('--wait <ms>', 'Wait time before screenshot in milliseconds', '1000')
    .action(async (jsonFile, options) => {
        const jsonPath = path.resolve(jsonFile);
        const output = path.resolve(options.output);
        
        const config = {
            jsonPath: jsonPath,
            outputDir: output,
            viewport: {
                width: parseInt(options.width, 10),
                height: parseInt(options.height, 10)
            },
            fullPage: options.fullPage,
            timeout: parseInt(options.timeout, 10),
            waitTime: parseInt(options.wait, 10)
        };
        
        try {
            await takeScreenshot(config);
        } catch (error) {
            console.error('Failed to take screenshot:', error.message);
            process.exit(1);
        }
    });

program.parse();