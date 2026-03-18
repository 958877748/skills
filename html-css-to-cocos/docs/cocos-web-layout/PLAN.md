# Development Plan

## Phase 1: 规范先行

目标：先把“语言”定义清楚。

### 任务
- 定义节点树 JSON 结构
- 定义 `style` 支持的字段
- 定义尺寸、百分比、auto 的计算规则
- 定义 flex 布局规则
- 定义 absolute 定位规则
- 定义文本 / 图片的测量规则

### 产出
- `schema-v1.md`
- `layout-rules-v1.md`
- `example-analysis.md`

---

## Phase 2: 运行时最小闭环

目标：JSON 能在 Cocos 中跑起来。

### 任务
- 实现 JSON 节点工厂
- 实现 `view / text / image` 基础节点
- 实现布局脏标记与重排
- 实现 flex 布局
- 实现 absolute 布局
- 实现文本与图片尺寸接入

### 产出
- 基础运行时
- 一个完整示例页面

---

## Phase 3: HTML / CSS 转 JSON

目标：让网页示例可以复用。

### 任务
- 定义支持的 HTML 标签子集
- 定义支持的 CSS 属性子集
- 实现转换器
- 生成可直接运行的 JSON

### 产出
- 转换工具
- 示例 HTML -> JSON

---

## Phase 4: 扩展能力

目标：覆盖更多游戏 UI 场景。

### 任务
- `scroll`
- `zIndex`
- `aspectRatio`
- 状态样式
- 业务组件挂载
- 模板与复用

### 产出
- v2 规范
- 更多复杂页面示例

---

## 当前建议优先级

1. JSON Schema v1
2. Layout Rules v1
3. Example Analysis
4. Runtime Core
5. HTML/CSS Converter
6. Example Library
