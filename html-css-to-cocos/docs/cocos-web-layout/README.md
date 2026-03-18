# Cocos Web-Like UI Layout

一个运行在 Cocos 中的、面向 AI 生成的类网页 UI 布局系统。

## 背景

AI 对 HTML / CSS / Flex 布局非常熟悉，但对 Cocos 原生 UI 布局系统的理解和生成能力相对较弱。
本项目的目标，是在 Cocos 中实现一套接近网页语义的布局组件和运行时，让 AI 可以复用网页布局经验来生成游戏 UI。

## 核心思路

- AI 生成统一的 JSON 节点树
- 或者将 HTML / CSS 转换为统一 JSON
- 运行时读取 JSON，在 Cocos 中创建节点和自定义组件
- 使用类网页的布局规则进行排版和渲染

## 目标

- 在运行时实现接近网页的布局逻辑
- 以 `flex + box model + absolute` 为核心
- 使用统一 JSON 作为中间描述格式
- 让 AI 更容易稳定生成 UI
- 让 HTML / CSS 示例可以较容易映射到 Cocos UI

## 非目标

当前阶段不追求完整浏览器能力，不支持：

- 完整 CSS 选择器系统
- 完整层叠规则
- `inline / float / table`
- 复杂动画与高级排版
- 任意网页的无损转换

## v1 范围

### 支持的节点
- `view`
- `text`
- `image`

### 支持的布局能力
- `display: flex`
- `flexDirection`
- `justifyContent`
- `alignItems`
- `alignSelf`
- `flexGrow / flexShrink / flexBasis`
- `gap`
- `padding / margin`
- `width / height / min / max`
- `% / auto / number`
- `position: relative / absolute`
- `left / right / top / bottom`
- 文本测量参与布局
- 图片尺寸与缩放模式参与布局

## 设计原则

1. JSON 作为唯一中间表示
2. 命名尽量贴近 HTML / CSS
3. 运行时逻辑接近网页，但不追求完整浏览器兼容
4. 优先支持 AI 最容易生成、最常见的布局能力
5. 先做稳定可用的 v1，再逐步扩展

## 目录建议

- `runtime/`：Cocos 运行时组件与布局引擎
- `schema/`：JSON 规范与属性定义
- `converter/`：HTML / CSS 到 JSON 的转换工具
- `examples/`：示例页面与测试数据
- `docs/`：设计文档

## 当前阶段任务

1. 定义 v1 JSON Schema
2. 定义布局计算规则
3. 实现基础节点与布局组件
4. 打通 JSON -> Cocos Node 渲染流程
5. 增加 HTML / CSS 子集转换工具
