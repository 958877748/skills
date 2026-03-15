#!/usr/bin/env node
/**       
 * Cocos Creator CLI
 * Command-line tools for AI to read and manipulate Cocos Creator 2.4.x project scenes
 */

import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 命令映射（编译后指向 dist 目录的 .js 文件）
const commands: Record<string, string> = {
    tree: '../src/commands/tree.js',
    get: '../src/commands/get.js',
    set: '../src/commands/set.js',
    'set-component': '../src/commands/set-component.js',
    add: '../src/commands/add.js',
    'add-component': '../src/commands/add-component.js',
    'remove-component': '../src/commands/remove-component.js',
    'remove': '../src/commands/remove.js',
    build: '../src/commands/build.js',
    'create-prefab': '../src/commands/prefab-create.js',
    'create-scene': '../src/commands/create-scene.js',
    'screenshot': '../src/commands/screenshot.js'
};

// 帮助信息
function showHelp(): void {
    console.log(`
Cocos Creator CLI - 场景/预制体操作工具集

用法:
  cocos2d-cli <command> [options]

命令:
  tree <场景.fire | 预制体.prefab>              查看节点树
  get <场景.fire | 预制体.prefab> <节点路径> [属性名|组件类型]  获取节点或组件属性
  set <场景.fire | 预制体.prefab> <节点路径> <属性名> <值>     修改节点属性
  set-component <文件> <节点路径> <组件类型> <属性名> <值>     修改组件属性
  add <场景.fire | 预制体.prefab> <父节点路径> <名称>          添加节点
  add-component <文件> <节点路径> <类型>        给节点添加组件
  remove-component <文件> <节点路径> <类型>     删除节点组件
  remove <文件> <节点路径>                      删除节点
  build <项目目录>                              构建组件映射
  create-prefab [JSON文件路径] <输出.prefab>    创建预制体
  create-scene [JSON文件路径] <输出.fire>       创建场景
  screenshot <json文件> [选项]                  渲染JSON并截图
`);
}

// 解析参数
const args: string[] = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h' || args[0] === 'help') {
    showHelp();
    process.exit(0);
}

const commandName: string = args[0];
const commandPath: string | undefined = commands[commandName];

if (!commandPath) {
    console.error(`未知命令: ${commandName}`);
    console.error('运行 cocos2d-cli --help 查看可用命令');
    process.exit(1);
}

// 加载并执行命令
async function main(): Promise<void> {
    try {
        const command = await import(commandPath!);
        await command.run(args.slice(1));
    } catch (err: any) {
        console.error(`命令执行失败: ${err.message}`);
        process.exit(1);
    }
}

main();
