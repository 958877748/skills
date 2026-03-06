# cocos2d-cli

Cocos Creator 场景/预制体命令行操作工具，支持通过 CLI 或 AI 自动化创建和编辑游戏界面。

## 功能

- 创建场景和预制体
- 添加/删除节点和组件
- 修改节点和组件属性
- 查看节点树结构
- 从简化 JSON 创建复杂界面

## 安装

```bash
npm install -g cocos2d-cli
```

## 使用

```bash
cocos2d-cli help          # 查看帮助
cocos2d-cli --help        # 同上
```

### 创建预制体

### 创建预制体

```bash
# 创建空预制体
cocos2d-cli create-prefab ./MyPrefab.prefab

# 从 JSON 创建预制体
cocos2d-cli create-prefab ./ui.json ./MyPrefab.prefab
```

### 创建场景

```bash
# 创建默认场景（含 Canvas 和 Main Camera）
cocos2d-cli create-scene ./MyScene.fire

# 从 JSON 创建场景
cocos2d-cli create-scene ./ui.json ./MyScene.fire
```

### 节点操作

```bash
# 添加节点
cocos2d-cli add ./MyPrefab.prefab Root NewNode --type=sprite --width=100 --height=100

# 删除节点
cocos2d-cli remove ./MyPrefab.prefab Root/NewNode

# 查看节点树
cocos2d-cli tree ./MyPrefab.prefab
```

### 组件操作

```bash
# 添加组件
cocos2d-cli add-component ./MyPrefab.prefab Root label

# 删除组件
cocos2d-cli remove-component ./MyPrefab.prefab Root label
```

### 属性操作

```bash
# 获取属性
cocos2d-cli get ./MyPrefab.prefab Root width
cocos2d-cli get ./MyPrefab.prefab Root label.string

# 设置属性
cocos2d-cli set ./MyPrefab.prefab Root width 200
cocos2d-cli set ./MyPrefab.prefab Root label.string "Hello"
```

## 简化 JSON 格式

AI 可以通过简化 JSON 描述界面结构：

```json
{
  "name": "MyButton",
  "width": 200,
  "height": 60,
  "components": ["sprite", "button"],
  "children": [
    {
      "name": "Label",
      "components": [
        {
          "type": "label",
          "string": "Click Me",
          "fontSize": 24
        }
      ]
    }
  ]
}
```

### 支持的组件类型

- `canvas` - Canvas
- `widget` - Widget
- `sprite` - Sprite
- `label` - Label
- `button` - Button
- `camera` - Camera

### 节点属性

| 属性 | 说明 |
|------|------|
| `name` | 节点名称 |
| `active` | 是否激活 |
| `x`, `y` | 位置 |
| `width`, `height` | 尺寸 |
| `scaleX`, `scaleY` | 缩放 |
| `rotation` | 旋转角度 |
| `anchorX`, `anchorY` | 锚点 |
| `opacity` | 透明度 |
| `color` | 颜色 (十六进制如 "#ff0000") |

## 架构

```
输入                      内存模型                    输出
─────                     ────────                   ─────
简化JSON ──→ json-parser ──→ CCNode树 ─┬─→ CCSceneAsset ──→ .fire
编辑器文件 ──→ fromJSON ──→ CC对象树 ──┘─→ CCPrefab ──→ .prefab
```

## License

MIT