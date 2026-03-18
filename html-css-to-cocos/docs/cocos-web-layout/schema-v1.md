# JSON Schema v1 Draft

## 1. 设计目标

v1 的 JSON Schema 目标不是复刻完整 HTML/CSS，而是提供一套：

- 足够接近网页布局语义
- 足够适合 AI 生成
- 足够容易映射到 Cocos 运行时
- 足够支撑常见游戏 UI 页面

JSON 是唯一中间表示。

---

## 2. 节点结构

每个 UI 节点使用统一结构描述：

```json
{
  "type": "view",
  "id": "root",
  "name": "Root",
  "style": {},
  "props": {},
  "children": []
}
```

---

## 3. 字段说明

### `type`
节点类型。

可选值：

- `view`
- `text`
- `image`

### `id`
可选。节点唯一标识。

### `name`
可选。调试名称或编辑器显示名称。

### `style`
可选。布局与视觉样式。

### `props`
可选。节点特有属性。

### `children`
可选。子节点数组。

约束：

- `view` 可以有 `children`
- `text` 在 v1 中不建议包含 `children`
- `image` 在 v1 中不允许包含 `children`

---

## 4. 节点类型

## `view`
通用容器节点。

### 示例
```json
{
  "type": "view",
  "style": {
    "display": "flex",
    "flexDirection": "column"
  },
  "children": []
}
```

## `text`
文本节点。

### `props`
- `text: string`

### 示例
```json
{
  "type": "text",
  "props": {
    "text": "Hello"
  },
  "style": {
    "fontSize": 24,
    "color": "#ffffff"
  }
}
```

## `image`
图片节点。

### `props`
- `src: string`

### 示例
```json
{
  "type": "image",
  "props": {
    "src": "ui/avatar.png"
  },
  "style": {
    "width": 80,
    "height": 80
  }
}
```

---

## 5. style 字段 v1

## 5.1 布局相关

### `display`
可选值：

- `flex`
- `none`

默认值：
- `view` 默认 `flex`
- `text` / `image` 不作为布局容器处理

说明：
- v1 不支持 `block`、`inline`、`grid`
- `display: none` 表示节点不参与布局且不渲染

### `flexDirection`
可选值：
- `row`
- `column`

默认值：
- `column`

### `justifyContent`
可选值：
- `flex-start`
- `center`
- `flex-end`
- `space-between`
- `space-around`
- `space-evenly`

默认值：
- `flex-start`

### `alignItems`
可选值：
- `flex-start`
- `center`
- `flex-end`
- `stretch`

默认值：
- `stretch`

### `alignSelf`
可选值：
- `auto`
- `flex-start`
- `center`
- `flex-end`
- `stretch`

默认值：
- `auto`

### `flexGrow`
数字，默认 `0`

### `flexShrink`
数字，默认 `1`

### `flexBasis`
可选值：
- 数字
- 百分比字符串，如 `"50%"`
- `"auto"`

默认值：
- `"auto"`

### `flexWrap`
可选值：
- `nowrap`
- `wrap`

默认值：
- `nowrap`

说明：
- v1 支持基础换行
- v1 不支持 `wrap-reverse`

### `gap`
可选值：
- 数字

默认值：
- `0`

说明：
- v1 使用统一 `gap`
- 暂不支持 `rowGap` 和 `columnGap`

---

## 5.2 尺寸相关

### `width / height`
可选值：
- 数字
- 百分比字符串，如 `"100%"`
- `"auto"`

### `minWidth / minHeight`
可选值：
- 数字
- 百分比字符串
- `"auto"`

### `maxWidth / maxHeight`
可选值：
- 数字
- 百分比字符串
- `"auto"`

说明：
- 数字表示逻辑像素
- 百分比相对父容器内容区
- `auto` 表示由布局或内容决定

---

## 5.3 盒模型

### `padding`
可选值：
- 数字
- `[top, right, bottom, left]`

默认值：
- `0`

### `margin`
可选值：
- 数字
- `[top, right, bottom, left]`

默认值：
- `0`

说明：
- v1 中 `padding` 和 `margin` 不支持更复杂的 2 值/3 值写法
- 统一只接受单值或四值数组，减少歧义

---

## 5.4 定位相关

### `position`
可选值：
- `relative`
- `absolute`

默认值：
- `relative`

### `left / right / top / bottom`
可选值：
- 数字
- 百分比字符串

说明：
- 仅在 `position: absolute` 时生效

### `zIndex`
数字，默认 `0`

---

## 5.5 视觉相关

### `backgroundColor`
颜色字符串，例如：
- `"#ff0000"`
- `"#ffffff"`

### `opacity`
数字，范围 `0 ~ 1`

默认值：
- `1`

### `borderRadius`
数字

说明：
- v1 只支持统一圆角，不支持分角圆角

---

## 5.6 文本相关

仅 `text` 节点生效。

### `fontSize`
数字

### `color`
颜色字符串

### `lineHeight`
数字

### `textAlign`
可选值：
- `left`
- `center`
- `right`

默认值：
- `left`

### `whiteSpace`
可选值：
- `normal`
- `nowrap`

默认值：
- `normal`

### `overflow`
可选值：
- `visible`
- `hidden`

默认值：
- `visible`

说明：
- v1 暂不支持省略号
- `whiteSpace: normal` 允许换行
- `whiteSpace: nowrap` 强制单行

---

## 5.7 图片相关

仅 `image` 节点生效。

### `objectFit`
可选值：
- `fill`
- `contain`
- `cover`
- `none`

默认值：
- `fill`

---

## 6. 尺寸值规则

### 数字
表示逻辑像素值。

例如：

```json
{ "width": 100 }
```

### 百分比字符串
相对父容器内容区计算。

例如：

```json
{ "width": "50%" }
```

### `"auto"`
表示由布局或内容决定。

例如：

```json
{ "width": "auto" }
```

---

## 7. 默认规则

### 通用默认值
- `position: relative`
- `margin: 0`
- `padding: 0`
- `zIndex: 0`
- `opacity: 1`

### `view` 默认值
- `display: flex`
- `flexDirection: column`
- `justifyContent: flex-start`
- `alignItems: stretch`
- `flexGrow: 0`
- `flexShrink: 1`
- `flexBasis: auto`
- `gap: 0`

### `text` 默认值
- 宽高为内容尺寸
- 参与父布局测量
- `whiteSpace: normal`
- `textAlign: left`

### `image` 默认值
- 若未指定宽高，优先使用资源原始尺寸
- 参与父布局测量
- `objectFit: fill`

---

## 8. 运行时约束

- v1 不支持完整 CSS 级联
- v1 不支持选择器匹配
- v1 不支持继承系统
- 运行时只读取节点最终的 `style`
- 如果存在 HTML/CSS 转换器，样式合并在转换阶段完成

---

## 9. 示例

## 示例 1：纵向页面
```json
{
  "type": "view",
  "id": "root",
  "style": {
    "width": "100%",
    "height": "100%",
    "padding": 16,
    "gap": 12,
    "backgroundColor": "#1e1e1e"
  },
  "children": [
    {
      "type": "text",
      "id": "title",
      "props": {
        "text": "角色信息"
      },
      "style": {
        "fontSize": 28,
        "color": "#ffffff"
      }
    },
    {
      "type": "view",
      "id": "card",
      "style": {
        "padding": 12,
        "gap": 8,
        "backgroundColor": "#2a2a2a",
        "borderRadius": 8
      },
      "children": [
        {
          "type": "text",
          "props": {
            "text": "名称：Knight"
          },
          "style": {
            "fontSize": 20,
            "color": "#dddddd"
          }
        }
      ]
    }
  ]
}
```

## 示例 2：横向头像信息
```json
{
  "type": "view",
  "style": {
    "flexDirection": "row",
    "alignItems": "center",
    "gap": 10,
    "padding": 12
  },
  "children": [
    {
      "type": "image",
      "props": {
        "src": "ui/avatar.png"
      },
      "style": {
        "width": 64,
        "height": 64,
        "objectFit": "cover"
      }
    },
    {
      "type": "view",
      "style": {
        "gap": 4
      },
      "children": [
        {
          "type": "text",
          "props": {
            "text": "玩家名称"
          },
          "style": {
            "fontSize": 22,
            "color": "#ffffff"
          }
        },
        {
          "type": "text",
          "props": {
            "text": "Lv.18"
          },
          "style": {
            "fontSize": 18,
            "color": "#aaaaaa"
          }
        }
      ]
    }
  ]
}
```
