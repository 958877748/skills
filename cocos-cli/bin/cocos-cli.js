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
    build: '../src/commands/build',
    'prefab-create': '../src/commands/prefab-create',
    'create-scene': '../src/commands/create-scene'
};

// 帮助信息
function showHelp() {
    console.log(`
Cocos Creator CLI - 场景/预制体操作工具集

用法:
  cocos2.4 <command> [options]

命令:
  tree <场景.fire | 预制体.prefab>           查看节点树（获取索引）
  get <场景.fire | 预制体.prefab> <索引>     获取节点属性
  set <场景.fire | 预制体.prefab> <索引> [选项]  修改节点属性
  add <场景.fire | 预制体.prefab> <父索引> <名称>  添加节点
  add-component <文件> <节点索引> <类型>     给节点添加组件
  remove <文件> <索引>                       删除节点或组件
  delete <文件> <节点索引>                   删除节点
  build <项目目录>                           构建组件映射
  prefab-create <预制体路径> <根节点名称>    创建新预制体文件
  create-scene <输出路径.fire> [场景名称]    从 stdin 创建场景文件

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
  --string=<文字>        修改 Label 文字内容
  --fontSize=<数值>      修改 Label 字体大小
  --lineHeight=<数值>    修改 Label 行高
  --type=sprite/label/button  添加节点时指定组件类型
  --at=<索引>            添加节点时插入到子节点的指定位置（0=第一个）

create-scene 组件规则:
  渲染组件（每节点仅一个）: sprite, label, particle
  功能组件（可多个共存）: button, widget, layout, camera, canvas
  
  [错误] BtnConfirm (sprite, label)  -- 多个渲染组件
  [正确] BtnConfirm (button, widget)
           └─ BtnText (label)

create-scene 节点选项:
  #width=100    设置宽度
  #height=50    设置高度
  #x=10         设置 X 坐标
  #y=20         设置 Y 坐标

示例:
  cocos2.4 tree assets/main.fire
  cocos2.4 get assets/main.fire 5
  cocos2.4 set assets/main.fire 8 --x=100 --y=200 --color=#ff0000
  cocos2.4 add assets/main.fire 5 NewSprite --type=sprite --x=100
  cocos2.4 prefab-create assets/MyPanel.prefab Panel

  # 从树形结构创建场景
  echo "Canvas (canvas)
  ├─ TopBar (sprite, widget) #width=720 #height=80
  │   ├─ ScoreLabel (label)
  │   └─ GoldLabel (label)
  └─ GameArea" | cocos2.4 create-scene assets/game.fire

版本: 1.1.0
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