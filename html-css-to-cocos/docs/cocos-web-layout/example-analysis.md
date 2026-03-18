# Example Analysis: `example.html`

本文分析仓库根目录下的 `example.html`，用于提炼：

- v1 必须支持的布局能力
- HTML/CSS 到 JSON 的映射策略
- 运行时实现优先级

---

## 1. 页面结构概览

该页面是一个典型的移动端信息展示页，结构大致为：

1. 顶部状态栏
2. 导航栏
3. 主内容容器
4. 提现信息卡片
5. 金额详情卡片
6. 奖励通知卡片
7. 底部提示文案

这是一个很适合作为 v1 样例的页面，因为它大量使用了：

- 纵向页面布局
- 横向子区域布局
- 居中与两端对齐
- absolute 定位
- 圆角卡片
- 文本尺寸驱动布局
- gap / padding / margin

---

## 2. 该示例依赖的核心能力

## 2.1 页面纵向堆叠
例如：

- `.content`
- `.amount-section`
- `.reward-card`
- `.footer-tip`

依赖能力：

- `flexDirection: column`
- `marginTop`
- `padding`

说明：
- v1 当前只定义了 `margin` 四值数组或单值
- 为了方便 HTML/CSS 转换，后续 schema 可能需要增加 `marginTop` / `marginBottom` 等单边写法
- 如果暂不增加，则转换器需要自动展开为四值数组

---

## 2.2 横向排列 + 居中对齐
例如：

- `.status-bar`
- `.withdraw-to`
- `.reward-header`
- `.reward-amount`

依赖能力：

- `display: flex`
- `flexDirection: row`
- `alignItems: center`
- `gap`

这是 v1 的核心场景，必须优先支持。

---

## 2.3 主轴分布
例如：

- `.status-bar { justify-content: space-between }`
- `.detail-row { justify-content: space-between }`
- `.info-row { justify-content: space-between }`

依赖能力：

- `justifyContent: space-between`

这是信息行布局的关键能力。

---

## 2.4 absolute 定位
例如：

- `.nav-bar { position: relative }`
- `.nav-bar .back { position: absolute; left: 12px }`

依赖能力：

- `position: relative`
- `position: absolute`
- `left`
- 父内容区定位

这是 v1 必须支持的 absolute 场景。

---

## 2.5 文本尺寸与字号差异
例如：

- `.amount-value`
- `.amount-value .currency`
- `.reward-amount`

依赖能力：

- 文本按字号测量
- 同一行多个文本节点共同组成金额展示
- `alignItems: flex-start`

说明：
- 金额中的货币符号和数值字号不同，这是很常见的游戏 UI 场景
- 文本测量必须足够稳定，否则金额区会错位

---

## 2.6 卡片视觉样式
例如：

- `background-color`
- `border-radius`
- `overflow: hidden`
- `border-top`
- `border-bottom`

依赖能力：

- `backgroundColor`
- `borderRadius`
- `overflow`

说明：
- 当前 schema v1 已有 `backgroundColor`、`borderRadius`、`overflow`
- 但 `border-top` / `border-bottom` 尚未纳入 v1
- 该能力可先通过额外分隔线节点替代

---

## 3. 该示例中超出当前 v1 的 CSS 能力

以下能力出现在 HTML 中，但当前 schema v1 未直接覆盖：

### 3.1 单边 margin / padding
例如：
- `margin-top: 12px`
- `padding-top: 16px`
- `margin-bottom: 8px`
- `margin-right: 2px`

解决建议：
- 转换阶段展开为四值数组
- 或在 schema v1.1 中增加 `marginTop`、`paddingTop` 这类字段

### 3.2 字重
例如：
- `font-weight: 700`
- `font-weight: 600`

解决建议：
- 很实用，建议尽快补进 schema v1.1

### 3.3 边框
例如：
- `border-top: 1px solid #f0f0f0`
- `border-bottom: 1px solid #f5f5f5`

解决建议：
- v1 可以先不实现通用边框
- 用额外 `view` 作为分隔线替代
- v2 再考虑 `borderWidth` / `borderColor`

### 3.4 渐变背景
例如：
- `.pdd-logo { background: linear-gradient(...) }`

解决建议：
- v1 不支持
- 转换时退化为纯色背景
- 或允许业务自定义组件接管

### 3.5 emoji / 特殊字符图标
例如：
- `🔋`

解决建议：
- 在 JSON 层仍可当作文本处理
- 但实际渲染效果依赖字体资源

---

## 4. 建议的 HTML 标签映射

针对该示例，建议先支持以下 HTML 子集：

- `div` -> `view`
- `span` -> `text`
- 纯文本节点 -> `text`

这样已经足以覆盖 `example.html`。

---

## 5. 建议的 CSS 属性映射

## 可直接映射
- `display` -> `display`
- `flex-direction` -> `flexDirection`
- `justify-content` -> `justifyContent`
- `align-items` -> `alignItems`
- `gap` -> `gap`
- `width` -> `width`
- `height` -> `height`
- `position` -> `position`
- `left/right/top/bottom` -> 同名字段
- `background-color` -> `backgroundColor`
- `border-radius` -> `borderRadius`
- `opacity` -> `opacity`
- `font-size` -> `fontSize`
- `color` -> `color`
- `line-height` -> `lineHeight`
- `text-align` -> `textAlign`
- `overflow` -> `overflow`

## 需转换展开
- `margin-top` -> `margin: [top, right, bottom, left]`
- `margin-bottom` -> 同上
- `padding-top` -> `padding: [top, right, bottom, left]`
- `padding-left/right` -> 同上

## 暂不支持或降级处理
- `box-sizing`
- `font-family`
- `-webkit-font-smoothing`
- `background: linear-gradient(...)`
- `border-top`
- `border-bottom`

---

## 6. 运行时实现优先级建议

为了尽快让 `example.html` 能映射到 Cocos 页面，推荐按以下顺序实现：

1. `view / text` 节点
2. `flexDirection`
3. `justifyContent`
4. `alignItems`
5. `gap`
6. `padding / margin`
7. `position: absolute`
8. 文本测量
9. `backgroundColor`
10. `borderRadius`
11. `overflow: hidden`
12. `image` 节点

说明：
- 这个页面几乎不依赖真实图片资源
- 所以 `image` 可以稍后实现

---

## 7. 作为第一个测试样例的价值

`example.html` 很适合作为第一批自动化测试样例，因为它：

- 结构清晰
- 没有复杂 grid
- 没有复杂动画
- 主要依赖 flex 和 absolute
- 对文本尺寸有一定要求
- 能暴露大部分移动端页面排版问题

建议后续产出：

- `examples/withdraw-page.json`
- `examples/withdraw-page.expected.png` 或布局快照
- `converter/example-output.json`

---

## 8. 当前结论

该示例验证了当前方向是可行的：

- v1 只靠 `view + text + flex + absolute + box model` 就能覆盖大部分结构
- schema 需要补强单边 `margin/padding` 的表达便利性
- 文本测量与 absolute 是实现该示例的关键点
- 边框与渐变可以先降级，不影响整体路线
