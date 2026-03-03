#!/usr/bin/env node
/**
 * Cocos Creator CLI
 * Command-line tools for AI to read and manipulate Cocos Creator 2.4.x project scenes
 */

const path = require('path');

// 命令映射
const commands = {
    tree: '../src/commands/tree',
    get: '../src/commands/get',
    set: '../src/commands/set',
    add: '../src/commands/add',
    'add-component': '../src/commands/add-component',
    'remove': '../src/commands/remove',
    delete: '../src/commands/delete',
    build: '../src/commands/build'
};

// 帮助信息
function showHelp() {
    console.log(`
Cocos Creator CLI - 场景操作工具集

用法:
  cocos2.4 <command> [options]

命令:
  tree <场景文件路径>                    查看节点树
  get <场景文件路径> <节点>              获取节点信息
  set <场景文件路径> <节点> [选项]       修改节点属性
  add <场景文件路径> <父节点> <名称>     添加节点
  add-component <场景文件路径> <节点> <类型>  给节点添加组件
  remove <场景路径> <索引>               删除节点或组件
  delete <场景文件路径> <节点>           删除节点
  build <项目目录>                       构建组件映射

选项:
  --name=<名称>          修改节点名称
  --active=true/false    修改激活状态
  --x=<数值>             修改 X 坐标
  --y=<数值>             修改 Y 坐标
  --width=<数值>         修改宽度
  --height=<数值>        修改高度
  --anchorX=<0-1>        修改锚点 X
  --anchorY=<0-1>        修改锚点 Y
  --opacity=<0-255>      修改透明度
  --color=<#RRGGBB>      修改颜色
  --rotation=<角度>      修改旋转角度
  --scaleX=<数值>        修改 X 缩放
  --scaleY=<数值>        修改 Y 缩放
  --type=sprite/label    添加节点时指定组件类型
  --at=<位置>            添加节点时指定插入位置

示例:
  cocos2.4 tree assets/main.fire
  cocos2.4 get assets/main.fire Canvas
  cocos2.4 set assets/main.fire Canvas/Player --x=100 --y=200
  cocos2.4 add assets/main.fire Canvas NewSprite --type=sprite --x=100
  cocos2.4 add-component assets/main.fire Canvas/Player sprite
  cocos2.4 delete assets/main.fire OldNode
  cocos2.4 build ./my-project

版本: 1.0.2
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