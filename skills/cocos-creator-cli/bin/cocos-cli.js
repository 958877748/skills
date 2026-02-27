#!/usr/bin/env node
/**
 * Cocos Creator CLI
 * Command-line tools for AI to read and manipulate Cocos Creator 2.4.x project scenes
 */

const path = require('path');

// 命令映射
const commands = {
    open: '../src/commands/open',
    close: '../src/commands/close',
    tree: '../src/commands/tree',
    get: '../src/commands/get',
    set: '../src/commands/set',
    add: '../src/commands/add',
    delete: '../src/commands/delete',
    build: '../src/commands/build'
};

// 帮助信息
function showHelp() {
    console.log(`
Cocos Creator CLI - 场景操作工具集

用法:
  cocos-cli <command> [options]

命令:
  open <scene.fire>              打开会话
  close --session=<id>           关闭会话并保存
  tree --session=<id>            查看节点树
  get <node> --session=<id>      获取节点信息
  set <node> --session=<id>      修改节点属性
  add <parent> <name>            添加节点
  delete <node> --session=<id>   删除节点
  build <project-dir>            构建组件映射

会话模式:
  1. open  → 打开会话，获取 sessionId
  2. 操作  → tree/add/get/set/delete（带 sessionId）
  3. close → 保存场景，关闭会话

示例:
  cocos-cli open assets/main.fire
  cocos-cli tree --session=a0e9c696
  cocos-cli add Canvas Sprite --session=a0e9c696 --type=sprite --x=100
  cocos-cli set Canvas/Sprite --session=a0e9c696 --x=200 --opacity=128
  cocos-cli delete OldNode --session=a0e9c696
  cocos-cli close --session=a0e9c696

版本: 1.0.0
`);
}

// 解析参数
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
}

const commandName = args[0];
const commandPath = commands[commandName];

if (!commandPath) {
    console.error(`未知命令: ${commandName}`);
    console.error('运行 cocos-cli --help 查看可用命令');
    process.exit(1);
}

// 加载并执行命令
try {
    const command = require(commandPath);
    command.run(args.slice(1));
} catch (err) {
    console.error(`命令执行失败: ${err.message}`);
    process.exit(1);
}
