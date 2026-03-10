# cocos2d-cli

Cocos Creator 2.4.x 场景 / 预制体命令行工具。

它可以直接操作 `.fire` 和 `.prefab` 文件，也支持从简化 JSON 生成场景、预制体，以及通过截图方式快速预览 UI 结构。

适用场景：

- 批量修改 Cocos Creator 资源
- 通过脚本或 AI 自动生成 UI
- 在不打开编辑器的情况下预览 JSON 描述的界面

## 特性

- 查看场景 / 预制体节点树
- 查询节点属性和组件属性
- 修改节点属性
- 修改组件属性
- 添加 / 删除节点
- 添加 / 删除组件
- 从 JSON 创建预制体
- 从 JSON 创建场景
- 构建脚本组件映射
- 将 JSON 渲染为截图

## 环境要求

- Node.js >= 14
- Cocos Creator 2.4.x

> `screenshot` 命令依赖 `playwright`。

## 安装

全局安装：

```bash
npm install -g cocos2d-cli
```

或在项目中直接使用：

```bash
npx cocos2d-cli --help
```

## 快速开始

查看帮助：

```bash
cocos2d-cli --help
```

查看节点树：

```bash
cocos2d-cli tree assets/main.fire
cocos2d-cli tree assets/panel.prefab
```

从 JSON 预览并生成预制体：

```bash
cocos2d-cli screenshot panel.json -o ./screenshots --width 750 --height 1334
cocos2d-cli create-prefab panel.json assets/Panel.prefab
```

## 命令说明

### tree

查看场景或预制体的节点树。

```bash
cocos2d-cli tree <scene.fire | prefab.prefab>
```

示例：

```bash
cocos2d-cli tree assets/main.fire
```

### get

获取节点属性，或获取节点上某个组件的属性。

```bash
cocos2d-cli get <文件> <节点路径> [属性名 | 组件类型]
```

说明：

- 不传第三个参数：返回该节点全部基础属性
- 第三个参数是组件类型：返回该组件全部属性
- 第三个参数是属性名：返回该节点的单个属性

示例：

```bash
cocos2d-cli get assets/main.fire Canvas
cocos2d-cli get assets/main.fire Canvas/MidNode x
cocos2d-cli get assets/main.fire Canvas/Label Label
```

### set

修改节点属性。

```bash
cocos2d-cli set <文件> <节点路径> <属性名> <值>
```

当前支持的常用节点属性：

- `name`
- `active`
- `x`
- `y`
- `width`
- `height`
- `anchorX`
- `anchorY`
- `opacity`
- `scaleX`
- `scaleY`
- `rotation`

示例：

```bash
cocos2d-cli set assets/main.fire Canvas/MidNode x 100
cocos2d-cli set assets/main.fire Canvas/MidNode width 200
cocos2d-cli set assets/main.fire Canvas/MidNode active false
```

### set-component

修改节点上某个组件的属性。

```bash
cocos2d-cli set-component <文件> <节点路径> <组件类型> <属性名> <值>
```

示例：

```bash
cocos2d-cli set-component assets/main.fire Canvas/Label Label string "Hello"
cocos2d-cli set-component assets/main.fire Canvas/Label Label fontSize 32
cocos2d-cli set-component assets/main.fire Canvas/Sprite Sprite sizeMode 0
```

> 不同组件是否支持修改，取决于该组件类是否实现了 `setProp`。

### add

在指定父节点下添加新节点。

```bash
cocos2d-cli add <文件> <父节点路径> <节点名称> [选项]
```

支持选项：

- `--x=<数值>`
- `--y=<数值>`
- `--width=<数值>`
- `--height=<数值>`
- `--scaleX=<数值>`
- `--scaleY=<数值>`
- `--rotation=<角度>`
- `--active=true|false`
- `--type=sprite|label|button`
- `--string=<文本>`（配合 `--type=label`）
- `--fontSize=<数值>`（配合 `--type=label`）

示例：

```bash
cocos2d-cli add assets/main.fire Canvas NewSprite --type=sprite --x=100 --y=50 --width=120 --height=120
cocos2d-cli add assets/main.fire Canvas Title --type=label --string=Hello --fontSize=32
```

### remove

删除指定节点。

```bash
cocos2d-cli remove <文件> <节点路径>
```

示例：

```bash
cocos2d-cli remove assets/main.fire Canvas/MidNode
```

> 不能删除根节点。

### add-component

给节点添加组件。

```bash
cocos2d-cli add-component <文件> <节点路径> <组件类型>
```

当前命令中支持的组件类型：

- `canvas`
- `widget`
- `sprite`
- `label`
- `button`
- `camera`

示例：

```bash
cocos2d-cli add-component assets/main.fire Canvas/NewNode sprite
cocos2d-cli add-component assets/main.fire Canvas/Main Camera camera
```

### remove-component

删除节点上的组件。

```bash
cocos2d-cli remove-component <文件> <节点路径> <组件类型>
```

示例：

```bash
cocos2d-cli remove-component assets/main.fire Canvas/NewNode sprite
```

### create-prefab

创建预制体。

```bash
cocos2d-cli create-prefab [JSON文件路径] <输出路径.prefab>
```

行为说明：

- 只传输出路径：创建默认预制体
- 传入 JSON 文件：根据 JSON 创建预制体
- 会自动生成对应 `.meta` 文件

示例：

```bash
cocos2d-cli create-prefab assets/NewNode.prefab
cocos2d-cli create-prefab panel.json assets/Panel.prefab
```

### create-scene

创建场景。

```bash
cocos2d-cli create-scene [JSON文件路径] <输出路径.fire>
```

行为说明：

- 只传输出路径：创建默认场景
- 默认场景包含 `Canvas` 和 `Main Camera`
- 若能在上级目录找到 `settings/project.json`，会读取设计分辨率
- 会自动生成对应 `.meta` 文件

示例：

```bash
cocos2d-cli create-scene assets/Main.fire
cocos2d-cli create-scene scene.json assets/Scene.fire
```

### build

扫描 Cocos Creator 项目的 `library/imports`，构建脚本哈希到类名的映射文件，用于更好地识别自定义脚本组件。

```bash
cocos2d-cli build <项目目录>
```

示例：

```bash
cocos2d-cli build D:/my-cocos-project
```

输出文件默认写到：

```text
cocos2d-cli/data/script_map.json
```

### screenshot

将 JSON 渲染为页面并截图。

```bash
cocos2d-cli screenshot <json文件> [选项]
```

支持选项：

- `-o, --output <目录>` 输出目录，默认当前目录
- `--width <数值>` 视口宽度，默认 `750`
- `--height <数值>` 视口高度，默认 `1334`
- `--full-page` 全页截图（默认）
- `--no-full-page` 仅视口截图
- `--debug-bounds` 叠加节点边界和名称
- `--timeout <毫秒>` 默认 `30000`
- `--wait <毫秒>` 默认 `1000`

示例：

```bash
cocos2d-cli screenshot data.json
cocos2d-cli screenshot data.json -o ./screenshots
cocos2d-cli screenshot data.json --width 1080 --height 1920
cocos2d-cli screenshot data.json --debug-bounds
```

> `-o` / `--output` 是输出目录，不是输出图片文件名。

## 节点路径格式

节点路径使用 `/` 分隔：

```text
Canvas
Canvas/MidNode
Canvas/GameScene/NodeA
```

如果路径首段和根节点同名，工具会自动兼容。

## JSON 格式

### 基本示例

```json
{
  "name": "Panel",
  "width": 400,
  "height": 300,
  "x": 0,
  "y": 0,
  "anchorX": 0.5,
  "anchorY": 0.5,
  "color": "#336699",
  "opacity": 255,
  "components": [
    "sprite",
    { "type": "label", "string": "Hello", "fontSize": 28, "horizontalAlign": "center" }
  ],
  "children": [
    {
      "name": "Btn",
      "width": 200,
      "height": 60,
      "components": ["sprite", "button"]
    }
  ]
}
```

### 常用节点字段

- `name`
- `x`, `y`
- `width`, `height`
- `anchorX`, `anchorY`
- `scaleX`, `scaleY`
- `rotation`
- `opacity`
- `active`
- `color`
- `components`
- `children`

### JSON 中支持的组件类型

- `canvas`
- `widget`
- `sprite`
- `label`
- `button`
- `camera`
- `richText`

### 组件示例

`label`：

```json
{
  "type": "label",
  "string": "文本内容",
  "fontSize": 28,
  "lineHeight": 40,
  "horizontalAlign": "left",
  "verticalAlign": "center",
  "color": "#ffffff"
}
```

`richText`：

```json
{
  "type": "richText",
  "string": "普通<color=#ff0000>红色</color>文字<br/>第二行",
  "fontSize": 28,
  "lineHeight": 40,
  "maxWidth": 600,
  "horizontalAlign": "left"
}
```

`widget`：

```json
{
  "type": "widget",
  "isAlignLeft": true,
  "isAlignRight": true,
  "isAlignTop": true,
  "isAlignBottom": true,
  "left": 0,
  "right": 0,
  "top": 0,
  "bottom": 0
}
```

## 坐标与布局说明

Cocos 默认锚点在节点中心：

- `anchorX = 0.5`
- `anchorY = 0.5`

因此 `x / y` 通常是相对父节点中心点的偏移。

对于左对齐 / 右对齐文本，更推荐：

- `anchorX: 0` + `horizontalAlign: "left"`
- `anchorX: 1` + `horizontalAlign: "right"`

示例：

```json
{
  "name": "Amount",
  "anchorX": 1,
  "x": 330,
  "width": 300,
  "components": [
    { "type": "label", "string": "¥40.00", "horizontalAlign": "right" }
  ]
}
```

## 注意事项

1. JSON 输入必须是文件路径，不支持直接传 JSON 字符串
2. `screenshot` 的输出参数是目录，不是图片路径
3. `set-component` 是否可修改，取决于组件类是否实现 `setProp`
4. `create-scene` 不传 JSON 时，会创建默认场景（含 `Canvas` 和 `Main Camera`）
5. `create-prefab` / `create-scene` 会自动写入 `.meta` 文件
6. `build` 生成的脚本映射会写入项目内的 `data/script_map.json`

## 项目结构

```text
bin/cocos2d-cli.js     # CLI 入口
src/commands/          # 各命令实现
src/lib/               # 场景/节点/组件处理逻辑
data/script_map.json   # 脚本组件映射
```

## License

MIT
