---
name: cocos2d-cli
description: Cocos Creator 2.4.x 场景/预制体命令行工具，支持读写 .fire/.prefab、JSON 生成 UI、截图预览
---

# cocos2d-cli

Cocos Creator 2.4.x 场景/预制体命令行工具。

AI 通过此技能可以直接读写 `.fire` 和 `.prefab` 文件，支持从简化 JSON 或 HTML 生成场景/预制体，以及通过截图预览 UI 结构。

## 快速使用

```bash
# 1. 查看帮助
cd <项目目录>
node scripts/tree.js --help

# 2. 查看节点树
node scripts/tree.js assets/main.fire

# 3. 创建预制体
node scripts/create-prefab.js panel.json assets/Panel.prefab

# 4. 截图预览
node scripts/screenshot.js panel.json -o ./screenshots --width 750 --height 1334
```

## 命令全集

### tree - 查看节点树

```bash
node scripts/tree.js <场景.fire | 预制体.prefab>
```

输出 JSON 格式的节点树结构，包含节点名、子节点、组件列表。

**注意**：
- 默认 JSON 输出，AI 可直接解析
- 输出格式：`{"name":"Canvas","children":[...],"components":[...]}`
- 自定义脚本组件依赖 `build` 命令生成的映射

### get - 获取属性（开发中）

```bash
node scripts/get.js <文件> <节点路径> [属性名|组件类型]
```

- 不传第三个参数：返回全部基础属性
- 第三个参数是组件类型：返回该组件全部属性
- 第三个参数是属性名：返回单个属性

节点路径格式：`Canvas`、`Canvas/MidNode`、`Canvas/GameScene/NodeA`

### set - 修改节点属性（开发中）

```bash
node scripts/set.js <文件> <节点路径> <属性名> <值>
```

支持属性：`name`, `active`, `x`, `y`, `width`, `height`, `anchorX`, `anchorY`, `opacity`, `scaleX`, `scaleY`, `rotation`

### set-component - 修改组件属性（开发中）

```bash
node scripts/set-component.js <文件> <节点路径> <组件类型> <属性名> <值>
```

示例：
```bash
node scripts/set-component.js assets/main.fire Canvas/Label Label string "Hello"
```

### add - 添加节点（开发中）

```bash
node scripts/add.js <文件> <父节点路径> <节点名称> [选项]
```

选项：`--x=`, `--y=`, `--width=`, `--height=`, `--scaleX=`, `--scaleY=`, `--rotation=`, `--active=`, `--type=sprite|label|button`, `--string=`, `--fontSize=`

### remove / add-component / remove-component（开发中）

```bash
node scripts/remove.js <文件> <节点路径>
node scripts/add-component.js <文件> <节点路径> <类型>
node scripts/remove-component.js <文件> <节点路径> <类型>
```

### build - 构建组件映射

```bash
node scripts/build.js <Cocos项目目录>
```

扫描 `library/imports`，构建脚本哈希到类名的映射。在读取自定义脚本组件前需要先执行。

### create-prefab - 创建预制体（✅ 已实现）

```bash
# 从 JSON 创建
node scripts/create-prefab.js <json文件路径> <输出.prefab>

# 从 HTML 创建
node scripts/create-prefab.js <html文件路径> <输出.prefab>
```

### create-scene - 创建场景（开发中）

```bash
node scripts/create-scene.js [JSON文件路径] <输出.fire>
```

不传 JSON 时创建默认场景（含 Canvas + Main Camera）。

### screenshot - JSON 渲染截图（✅ 已实现）

```bash
node scripts/screenshot.js <json文件> [选项]
```

选项：
| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-o, --output <目录>` | 输出目录 | 当前目录 |
| `--width <数值>` | 视口宽度 | 750 |
| `--height <数值>` | 视口高度 | 1334 |
| `--full-page` | 全页截图 | 启用 |
| `--no-full-page` | 仅视口截图 | - |
| `--debug-bounds` | 叠加节点边界和名称 | - |
| `--timeout <毫秒>` | 截图超时 | 30000 |
| `--wait <毫秒>` | 渲染后等待 | 1000 |

**注意**：依赖 Playwright。首次使用需安装：`npx playwright install chromium`

## JSON 格式参考

### 基本结构

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
    { "type": "label", "string": "Hello", "fontSize": 28 }
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

### 支持的节点字段

`name`, `x`, `y`, `width`, `height`, `anchorX`, `anchorY`, `scaleX`, `scaleY`, `rotation`, `opacity`, `active`, `color`（十六进制）, `components`, `children`

### 支持的组件类型

| 组件名 | 关键配置 |
|--------|----------|
| `canvas` | - |
| `sprite` | - |
| `label` | `string`, `fontSize`, `lineHeight`, `horizontalAlign` (`left/center/right`), `verticalAlign`, `color` |
| `button` | - |
| `widget` | `isAlignLeft/Right/Top/Bottom`, `left/right/top/bottom` |
| `richText` | `string`, `fontSize`, `lineHeight`, `maxWidth`, `horizontalAlign` |
| `camera` | - |

## 坐标与布局说明

Cocos Creator 默认锚点在节点中心（`anchorX=0.5`, `anchorY=0.5`），`x/y` 是相对父节点中心点的偏移。

左对齐推荐：
```json
{ "anchorX": 0, "horizontalAlign": "left" }
```

右对齐推荐：
```json
{ "anchorX": 1, "horizontalAlign": "right" }
```

## 节点路径格式

```
Canvas                          # 根节点
Canvas/MidNode                  # 二级节点
Canvas/GameScene/NodeA          # 三级节点
```

## 项目根目录自动检测

执行任何操作前，工具会自动从文件路径向上查找 Cocos 项目根目录：

1. 从 `.fire` / `.prefab` 文件所在目录开始向上查找
2. 找到同时包含 `assets/` 和 `settings/project.json` 的目录，即为项目根
3. 找到后用于定位 `data/script_map.json`、`library/imports/` 等项目级文件

所以传文件路径时，给相对路径或绝对路径都可以——工具会自动找到项目根。

```bash
# 以下两种写法都能正确找到项目根
node scripts/tree.js assets/main.fire
node scripts/tree.js C:/Projects/MyGame/assets/ui/panel.prefab
```

## 环境要求

- Node.js >= 18
- 项目需为 Cocos Creator 2.4.x
- screenshot 命令依赖 Playwright：`npx playwright install chromium`

## 注意事项

1. AI 执行命令时，工作目录必须是 Cocos 项目根目录（包含 `assets/` 和 `settings/` 的目录）
2. JSON 输入必须是文件路径，不支持传 JSON 字符串
3. `screenshot -o` 指定的是输出**目录**，不是图片文件名
4. `set-component` 是否可修改取决于组件类是否实现 `setProp`
5. `build` 需要在有 `library/imports` 的 Cocos 项目目录中运行
6. 创建 prefab/scene 会自动写入对应的 `.meta` 文件
