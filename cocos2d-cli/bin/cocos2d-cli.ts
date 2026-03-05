#!/usr/bin/env node

import * as path from 'path';

const commands: Record<string, string> = {
    tree: '../src/commands/tree',
    get: '../src/commands/get',
    set: '../src/commands/set',
    add: '../src/commands/add',
    'add-component': '../src/commands/add-component',
    'remove': '../src/commands/remove',
    build: '../src/commands/build',
    'create-prefab': '../src/commands/prefab-create',
    'create-scene': '../src/commands/create-scene'
};

function showHelp(): void {
    console.log(`
 Cocos Creator CLI - 场景/预制体操作工具集

 用法:
   cocos2d-cli <command> [options]

 命令:
   tree <场景.fire | 预制体.prefab>           查看节点树（获取索引）
   get <场景.fire | 预制体.prefab> <索引>     获取节点属性
   set <场景.fire | 预制体.prefab> <索引> [选项]  修改节点属性
   add <场景.fire | 预制体.prefab> <父索引> <名称>  添加节点
   add-component <文件> <节点索引> <类型>     给节点添加组件
   remove <文件> <索引> [--component|--node]  删除节点或组件（自动检测类型）
   build <项目目录>                           构建组件映射
   create-prefab [JSON文件] <输出.prefab>     创建预制体（不传JSON则创建默认）
   create-scene <JSON文件> <输出.fire>        从JSON文件创建场景

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

 JSON 格式 (create-prefab / create-scene):
   {
     "name": "节点名称",
     "width": 400,
     "height": 300,
     "x": 0,
     "y": 0,
     "color": "#336699",
     "opacity": 255,
     "components": [
       "sprite",
       { "type": "widget", "top": 0, "left": 0, "right": 0, "bottom": 0 },
       { "type": "label", "string": "Hello", "fontSize": 32 }
     ],
     "children": [...]
   }

   节点属性: name, width, height, x, y, color, opacity, anchorX, anchorY, rotation, scaleX, scaleY, active

   组件写法:
     简写: "sprite" 或 "label"
     完整: { "type": "sprite", "sizeMode": 1 }
     完整: { "type": "label", "string": "文本", "fontSize": 32, "color": "#fff" }

   组件类型:
     sprite   - 精灵（默认白色方块，节点设置什么颜色就显示什么颜色）
     label    - 文本，支持 string, fontSize, color(兼容)
     button   - 按钮，通常配合 sprite 使用才能看见
     widget   - 对齐，支持 top, bottom, left, right
     layout   - 布局，自动排列子节点
     canvas   - 画布，根节点使用
     camera   - 相机
     particle - 粒子效果

   注意:
     - color 写在节点或 label 组件均可
     - button 需要配合 sprite 才能看见按钮外观

 示例:
   cocos2d-cli tree assets/main.fire
   cocos2d-cli get assets/main.fire 5
   cocos2d-cli set assets/main.fire 8 --x=100 --y=200 --color=#ff0000
   cocos2d-cli add assets/main.fire 5 NewSprite --type=sprite --x=100

   # 从 JSON 文件创建场景
   cocos2d-cli create-scene scene.json assets/scene.fire

   # 从 JSON 文件创建预制体
   cocos2d-cli create-prefab panel.json assets/panel.prefab

   # 创建默认预制体（不传JSON）
   cocos2d-cli create-prefab assets/NewNode.prefab
 `);
}

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
}

const commandName = args[0];
const commandPath = commands[commandName];

if (!commandPath) {
    console.error(`未知命令: ${commandName}`);
    console.error('运行 cocos2d-cli --help 查看可用命令');
    process.exit(1);
}

try {
    const command = require(commandPath);
    command.run(args.slice(1));
    process.exit(0);
} catch (err) {
    console.error(`命令执行失败: ${(err as Error).message}`);
    process.exit(1);
}
