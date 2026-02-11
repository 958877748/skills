---
name: cocos-creator-cli
description: Command-line tools for AI to read and manipulate Cocos Creator 2.4.x project scenes. Use when working with .fire scene files, reading node trees, getting/setting node properties, adding/deleting nodes, or batch scene operations.
---

# Cocos Creator CLI

用于 AI 控制 Cocos Creator 2.4.x 项目的命令行工具集。

## 安装

将 `cocos-cli/` 目录放置在项目中的任意位置，确保有 Node.js 环境。

## 工具概览

| 工具 | 功能 | 推荐场景 |
|------|------|----------|
| `scene_session.js` | 会话模式操作 | **批量操作（推荐）** |
| `fire_reader.js` | 查看节点树 | 快速查看结构 |
| `get_node_property.js` | 获取属性 | 单次查询 |
| `add_node.js` | 添加节点 | 单次添加 |
| `delete_node.js` | 删除节点 | 单次删除 |
| `build_script_map.js` | 构建组件映射 | 首次使用前 |

## 推荐工作流程（会话模式）

会话模式解决索引变化问题，适合 AI 批量操作：

```
1. open  → 打开会话，获取 sessionId 和 sceneUuid
2. 操作  → tree/add/get/delete（带 sessionId 和 uuid）
3. close → 保存场景，关闭会话
```

### 打开会话

```bash
node cocos-cli/scene_session.js open <场景文件路径>
```

返回示例：
```json
{"sessionId": "a0e9c696", "sceneUuid": "xxx", "nodeCount": 10}
```

### 查看节点树

```bash
node cocos-cli/scene_session.js tree --session=<sessionId> --uuid=<sceneUuid>
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

### 添加节点

```bash
# 基本添加
node cocos-cli/scene_session.js add <父节点路径> <节点名称> --session=<id> --uuid=<uuid>

# 带组件和属性
node cocos-cli/scene_session.js add Canvas Sprite --session=<id> --uuid=<uuid> --type=sprite --x=100 --y=200 --at=1
```

选项：
| 选项 | 说明 |
|------|------|
| `--type=sprite/label` | 添加组件类型 |
| `--x=N --y=N` | 节点坐标 |
| `--width=N --height=N` | 节点大小 |
| `--at=N` | 插入位置（0=第一个子节点） |
| `--active=false` | 设为不激活 |

### 获取节点信息

```bash
# 按索引
node cocos-cli/scene_session.js get 5 --session=<id> --uuid=<uuid>

# 按路径
node cocos-cli/scene_session.js get Canvas/Tilemap --session=<id> --uuid=<uuid>

# 获取组件
node cocos-cli/scene_session.js get Canvas/Tilemap Tilemap --session=<id> --uuid=<uuid>
```

### 删除节点

```bash
node cocos-cli/scene_session.js delete <节点路径> --session=<id> --uuid=<uuid>
```

### 关闭会话

```bash
node cocos-cli/scene_session.js close --session=<id> --uuid=<uuid>
```

## 单次操作（非会话模式）

### 查看场景结构

```bash
node cocos-cli/fire_reader.js <场景文件路径>
```

### 获取节点属性

```bash
# 按索引
node cocos-cli/get_node_property.js <场景路径> 5

# 按路径
node cocos-cli/get_node_property.js <场景路径> Canvas/Tilemap

# 获取组件
node cocos-cli/get_node_property.js <场景路径> Canvas/Tilemap Tilemap
```

### 添加节点

```bash
node cocos-cli/add_node.js <场景路径> <父节点> <节点名> [--type=sprite/label] [--x=N] [--y=N]
```

### 删除节点

```bash
node cocos-cli/delete_node.js <场景路径> <节点索引或路径>
```

## 首次使用

如果场景包含自定义组件，需要先构建组件映射：

```bash
node cocos-cli/build_script_map.js <cocos项目路径>
```

这会生成 `script_map.json`，用于将组件 hash ID 映射到类名。

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

1. **会话模式优先**：批量操作务必使用 `scene_session.js`，避免索引错乱
2. **并发保护**：同一场景的新会话会使旧会话失效
3. **版本兼容**：仅支持 Cocos Creator 2.4.x
4. **资源引用**：自动转换为 `db://assets/xxx` 格式
