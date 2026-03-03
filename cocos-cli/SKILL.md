---
name: cocos-creator-cli
description: Command-line tools for AI to read and manipulate Cocos Creator 2.4.x project scenes. Use when working with .fire scene files, reading node trees, getting/setting node properties, adding/deleting nodes, or batch scene operations.
---

# Cocos Creator CLI

用于 AI 控制 Cocos Creator 2.4.x 项目的命令行工具集。

## 安装

将 `cocos-cli/` 目录放置在项目中的任意位置，确保有 Node.js 环境。

## 工具概览

| 工具 | 功能 |
|------|------|
| `tree` | 查看节点树 |
| `get` | 获取节点属性 |
| `set` | 修改节点属性 |
| `add` | 添加节点 |
| `add-component` | 给节点添加组件 |
| `delete` | 删除节点 |
| `build` | 构建组件映射 |

## 命令使用

### 查看场景结构

```bash
node bin/cocos-cli.js tree <场景文件路径>
```

输出格式：
```
Root #1
└── ● Canvas #2 (Canvas#13, Widget#14)
    ├── ● Main Camera #3 (Camera#4)
    └── ● GameScene #9 (GameScene#12)
```

符号说明：
- `●` = 节点激活
- `○` = 节点未激活
- `#数字` = 节点/组件索引

### 获取节点信息

```bash
# 按索引
node bin/cocos-cli.js get <场景路径> 5

# 按路径
node bin/cocos-cli.js get <场景路径> Canvas/Tilemap

# 获取组件
node bin/cocos-cli.js get <场景路径> Canvas/Tilemap
```

### 修改节点属性

```bash
node bin/cocos-cli.js set <场景路径> <节点路径> [选项]
```

示例：
```bash
# 修改位置
node bin/cocos-cli.js set assets/main.fire Canvas/Player --x=100 --y=200

# 修改名称和激活状态
node bin/cocos-cli.js set assets/main.fire 5 --name=NewName --active=false

# 修改大小、颜色、透明度
node bin/cocos-cli.js set assets/main.fire Sprite --width=100 --height=50 --color=#FF0000 --opacity=128

# 修改旋转和缩放
node bin/cocos-cli.js set assets/main.fire Player --rotation=45 --scaleX=2 --scaleY=2
```

选项：
| 选项 | 说明 | 示例 |
|------|------|------|
| `--name=<名称>` | 修改节点名称 | `--name=Player` |
| `--active=true/false` | 修改激活状态 | `--active=false` |
| `--x=<数值>` | 修改 X 坐标 | `--x=100` |
| `--y=<数值>` | 修改 Y 坐标 | `--y=200` |
| `--width=<数值>` | 修改宽度 | `--width=100` |
| `--height=<数值>` | 修改高度 | `--height=50` |
| `--anchorX=<0-1>` | 修改锚点 X | `--anchorX=0.5` |
| `--anchorY=<0-1>` | 修改锚点 Y | `--anchorY=0.5` |
| `--opacity=<0-255>` | 修改透明度 | `--opacity=128` |
| `--color=<#RRGGBB>` | 修改颜色 | `--color=#FF0000` |
| `--rotation=<角度>` | 修改旋转角度 | `--rotation=45` |
| `--scaleX=<数值>` | 修改 X 缩放 | `--scaleX=2` |
| `--scaleY=<数值>` | 修改 Y 缩放 | `--scaleY=2` |

### 添加节点

```bash
# 基本添加
node bin/cocos-cli.js add <场景路径> <父节点路径> <节点名称>

# 带组件和属性
node bin/cocos-cli.js add assets/main.fire Canvas Sprite --type=sprite --x=100 --y=200 --at=1
```

选项：
| 选项 | 说明 |
|------|------|
| `--type=sprite/label` | 添加组件类型 |
| `--x=N --y=N` | 节点坐标 |
| `--width=N --height=N` | 节点大小 |
| `--at=N` | 插入位置（0=第一个子节点） |
| `--active=false` | 设为不激活 |

### 添加组件

```bash
node bin/cocos-cli.js add-component <场景路径> <节点路径> <组件类型>
```

示例：
```bash
node bin/cocos-cli.js add-component assets/main.fire Canvas/Player sprite
node bin/cocos-cli.js add-component assets/main.fire Canvas/Title label
node bin/cocos-cli.js add-component assets/main.fire Canvas/Button button
```

支持的组件类型：
- 内置组件：`sprite`, `label`, `button`, `layout`, `widget`, `camera`, `canvas`, `particleSystem`
- 自定义脚本：直接使用脚本类名

### 删除节点

```bash
node bin/cocos-cli.js delete <场景路径> <节点索引或路径>
```

删除节点会同时删除其所有子节点和组件，并自动重建索引引用。

## 首次使用

如果场景包含自定义组件，需要先构建组件映射：

```bash
node bin/cocos-cli.js build <cocos项目路径>
```

这会生成 `data/script_map.json`，用于将组件 hash ID 映射到类名。

## 输出格式

### 节点属性

```json
{
  "node": {
    "active": true,
    "name": "Canvas",
    "position": { "x": 375, "y": 667 },
    "rotation": 0,
    "scale": { "x": 1, "y": 1 },
    "anchor": { "x": 0.5, "y": 0.5 },
    "size": { "width": 750, "height": 1334 },
    "color": "#FFFFFF",
    "opacity": 255,
    "group": "default"
  }
}
```

### 组件属性

```json
{
  "component": {
    "type": "GameScene",
    "enabled": true,
    "startScene": 100,
    "prefabInfo": "db://assets/prefab/info.prefab"
  }
}
```

## 注意事项

1. **直接操作文件**：所有命令直接读取和保存场景文件，无需会话管理
2. **删除行为**：删除节点会真正移除数组元素并重建索引，与编辑器行为一致
3. **版本兼容**：仅支持 Cocos Creator 2.4.x
4. **资源引用**：自动转换为 `db://assets/xxx` 格式
5. **编辑器自动刷新**：需要安装 CLI Helper 插件到项目的 `packages/` 目录并在编辑器中启用，才能实现保存后自动刷新场景

## 工作流程示例

```bash
# 1. 查看节点树
node bin/cocos-cli.js tree assets/main.fire

# 2. 添加节点
node bin/cocos-cli.js add assets/main.fire Canvas NewSprite --type=sprite --x=100 --y=200

# 3. 修改属性
node bin/cocos-cli.js set assets/main.fire Canvas/NewSprite --x=200 --scaleX=2

# 4. 删除节点
node bin/cocos-cli.js delete assets/main.fire Canvas/OldNode

# 5. 在编辑器中调整节点顺序（如果需要）
```