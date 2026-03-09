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
    'set-component': '../src/commands/set-component',
    add: '../src/commands/add',
    'add-component': '../src/commands/add-component',
    'remove-component': '../src/commands/remove-component',
    'remove': '../src/commands/remove',
    build: '../src/commands/build',
    'create-prefab': '../src/commands/prefab-create',
    'create-scene': '../src/commands/create-scene',
    'screenshot': '../src/commands/screenshot'
};

// 帮助信息
function showHelp() {
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
  create-prefab [JSON文件路径] <输出.prefab>    创建预制体（不传JSON则创建默认）
  create-scene [JSON文件路径] <输出.fire>       创建场景（不传JSON则创建默认）
  screenshot <json文件> [选项]                  渲染JSON并截图

节点路径格式:
  Canvas                    - 根节点下的 Canvas
  Canvas/MidNode            - Canvas 下的 MidNode
  Canvas/GameScene/NodeA    - 多层嵌套路径

set 支持的节点属性:
  name          节点名称
  active        激活状态 (true/false)
  x             X 坐标
  y             Y 坐标
  width         宽度
  height        高度
  anchorX       锚点 X (0-1)
  anchorY       锚点 Y (0-1)
  opacity       透明度 (0-255)
  scaleX        X 缩放
  scaleY        Y 缩放
  rotation      旋转角度

set-component 示例:
  cocos2d-cli set-component xxx.fire Canvas/Label Label string "Hello"
  cocos2d-cli set-component xxx.fire Canvas/Label Label fontSize 32
  cocos2d-cli set-component xxx.fire Canvas/Sprite Sprite sizeMode 0

add 支持的选项:
  --x=<数值>             设置 X 坐标
  --y=<数值>             设置 Y 坐标
  --width=<数值>         设置宽度
  --height=<数值>        设置高度
  --scaleX=<数值>        设置 X 缩放
  --scaleY=<数值>        设置 Y 缩放
  --rotation=<角度>      设置旋转角度
  --active=true/false    设置激活状态
  --type=sprite/label/button  添加节点时指定组件类型
  --string=<文字>        Label 文字内容 (配合 --type=label)
  --fontSize=<数值>      Label 字体大小 (配合 --type=label)

JSON 格式:
  详见 SKILL.md 完整文档。简要示例：
  {
    "name": "Node",
    "width": 400, "height": 300,
    "x": 0, "y": 0,
    "anchorX": 0, "color": "#336699",
    "components": [
      { "type": "label", "string": "Hello", "horizontalAlign": "left" },
      { "type": "richText", "string": "<color=#3cb034>绿色</color>" }
    ],
    "children": [...]
  }

  提示：配合 anchorX + horizontalAlign 实现靠左/靠右布局（见 SKILL.md）

示例:
  cocos2d-cli tree assets/main.fire
  cocos2d-cli get assets/main.fire Canvas/MidNode
  cocos2d-cli get assets/main.fire Canvas/MidNode x
  cocos2d-cli get assets/main.fire Canvas/MidNode Label
  cocos2d-cli set assets/main.fire Canvas/MidNode x 100
  cocos2d-cli set assets/main.fire Canvas/MidNode width 200
  cocos2d-cli set-component assets/main.fire Canvas/Label Label string "Hello World"
  cocos2d-cli add assets/main.fire Canvas NewSprite --type=sprite --x=100
  cocos2d-cli add-component assets/main.fire Canvas/MidNode label
  cocos2d-cli remove-component assets/main.fire Canvas/MidNode label
  cocos2d-cli remove assets/main.fire Canvas/MidNode

  # 从 JSON 文件创建场景
  cocos2d-cli create-scene scene.json assets/scene.fire

  # 从 JSON 文件创建预制体
  cocos2d-cli create-prefab panel.json assets/panel.prefab

  # 创建默认预制体（不传JSON）
  cocos2d-cli create-prefab assets/NewNode.prefab

  # 截图
  cocos2d-cli screenshot data.json
  cocos2d-cli screenshot data.json -o ./screenshots --width 1080 --height 1920
`);
}

// 解析参数
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h' || args[0] === 'help') {
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

// 加载并执行命令
try {
    const command = require(commandPath);
    command.run(args.slice(1));
} catch (err) {
    console.error(`命令执行失败: ${err.message}`);
    process.exit(1);
}
