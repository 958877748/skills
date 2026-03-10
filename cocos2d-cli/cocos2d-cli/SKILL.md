---
name: cocos2d-cli 
description: Cocos Creator 2.4.x CLI 工具使用规范，用于从 JSON 描述生成场景/预制体、截图预览，以及对场景/预制体中的节点和组件进行增删改查
---

# cocos2d-cli

Cocos Creator CLI 工具，支持通过 JSON 描述生成预制体/场景，以及截图预览。

## When to use

- 需要将 UI 设计稿还原为 Cocos Creator 白盒预制体时
- 需要快速预览 JSON 描述的 UI 效果而不打开编辑器时
- 需要对现有场景/预制体进行批量查询或修改时

## Instructions

### 1. 核心工作流

JSON 描述 → `screenshot` 预览 → 迭代调整 → `create-prefab` 生成

```bash
# 预览 JSON 效果
npx cocos2d-cli screenshot panel.json --output ./screenshots --width 750 --height 1334

# 生成预制体
npx cocos2d-cli create-prefab panel.json assets/Panel.prefab
```

### 2. JSON 节点描述格式

```json
{
  "name": "节点名称",
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
    { "type": "label", "string": "文本", "fontSize": 32, "horizontalAlign": "left" },
    { "type": "richText", "string": "普通<color=#ff0000>红色</color>文字", "fontSize": 28 }
  ],
  "children": []
}
```

#### 节点属性说明

| 属性 | 类型 | 说明 |
|------|------|------|
| name | string | 节点名称，显示在编辑器层级中 |
| x, y | number | 相对于父节点中心的偏移（见坐标系说明） |
| width, height | number | 节点宽高 |
| anchorX, anchorY | number (0-1) | 锚点，默认 0.5 表示中心 |
| color | string (#RRGGBB) | 节点颜色，影响 Sprite 填充/Label 文字色 |
| opacity | number (0-255) | 透明度 |
| rotation | number | 旋转角度（度） |
| scaleX, scaleY | number | 缩放 |
| active | boolean | 是否激活 |
| components | array | 组件列表（见组件说明） |
| children | array | 子节点列表（递归） |

### 3. 坐标系说明（Cocos 中心锚点）

**Cocos 默认锚点在节点中心**（anchorX=0.5, anchorY=0.5），x/y 是相对父节点中心的偏移。

**计算示例**：父节点宽 660，子节点宽 150，要靠左留 30px 边距
```
x = -(660/2) + 30 + (150/2) = -225
```

**靠左/靠右布局推荐写法**（使用 anchorX + horizontalAlign）：

```json
// 靠左对齐文字：节点锚点设为左边，文字对齐设为 left
{
  "anchorX": 0,
  "x": -330,
  "width": 300,
  "components": [
    { "type": "label", "string": "打款人", "horizontalAlign": "left" }
  ]
}

// 靠右对齐文字：节点锚点设为右边，文字对齐设为 right
{
  "anchorX": 1,
  "x": 330,
  "width": 300,
  "components": [
    { "type": "label", "string": "¥40.00", "horizontalAlign": "right" }
  ]
}
```

这样做的好处：锚点控制节点定位基准，horizontalAlign 控制文字在节点内的排列，语义清晰，不需要心算偏移量。

### 4. 组件类型说明

#### sprite
精灵，显示为纯色方块（颜色由节点 color 控制）
```json
"sprite"
// 或
{ "type": "sprite", "sizeMode": 0 }
```

#### label
文本组件
```json
{
  "type": "label",
  "string": "文本内容",
  "fontSize": 28,
  "lineHeight": 40,
  "horizontalAlign": "left",    // left / center / right，默认 center
  "verticalAlign": "center",      // top / center / bottom，默认 center
  "color": "#ffffff"              // 兼容写法，效果等同于节点 color
}
```

**注意**：label 的文字颜色实际由节点 color 控制，组件内的 color 是兼容写法。

#### richText
富文本，支持 BBCode 局部样式
```json
{
  "type": "richText",
  "string": "发起<color=#3cb034>准备40元打款</color>的申请<br/>请及时审批！",
  "fontSize": 28,
  "lineHeight": 40,
  "maxWidth": 600,
  "horizontalAlign": "left"       // left / center / right
}
```

**支持的 BBCode 标签**：
- `<color=#RRGGBB>文字</color>` — 局部变色
- `<size=30>文字</size>` — 局部字体大小
- `<b>文字</b>` — 加粗
- `<i>文字</i>` — 斜体
- `<u>文字</u>` — 下划线
- `<br/>` — 换行

**重要**：richText 的节点 color 和 BBCode color 不要混用，运行时以 BBCode 为准。

#### widget
对齐组件
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

#### button
按钮组件（通常配合 sprite 使用）
```json
"button"
```

### 5. CLI 命令参考

```bash
# 预览 JSON 效果（截图）
npx cocos2d-cli screenshot <json文件> [选项]
  -o, --output <目录>     输出目录，默认当前目录
  --width <数值>          视口宽度，默认 750
  --height <数值>         视口高度，默认 1334
  --debug-bounds          叠加节点边界框和名称
  --wait <毫秒>           截图前等待时间，默认 1000

# 生成预制体
npx cocos2d-cli create-prefab [JSON文件] <输出.prefab>

# 生成场景
npx cocos2d-cli create-scene [JSON文件] <输出.fire>

# 查看节点树
npx cocos2d-cli tree <场景或预制体文件>

# 获取节点属性
npx cocos2d-cli get <文件> <节点路径> [属性名|组件类型]

# 设置节点属性
npx cocos2d-cli set <文件> <节点路径> <属性名> <值>

# 添加组件
npx cocos2d-cli add-component <文件> <节点路径> <类型>
```

### 6. 注意事项

1. **JSON 参数必须是文件路径**，不支持直接传递 JSON 字符串
2. **颜色说明**：节点 color 控制 Sprite 填充色和 Label 文字色；Label 组件内的 color 是兼容写法，实际同步到节点
3. **richText 颜色**：使用 BBCode `<color=#xxx>` 设置局部颜色，不要依赖节点 color
4. **坐标计算**：默认锚点在中心，复杂布局建议使用 `anchorX=0`（靠左）或 `anchorX=1`（靠右）配合 `horizontalAlign`
5. **截图工具依赖**：需要安装 Playwright 和 Chromium
