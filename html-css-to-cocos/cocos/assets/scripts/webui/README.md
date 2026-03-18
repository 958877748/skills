# WebUI Runtime Prototype

这是第一版运行时原型，目标是先把以下闭环跑通：

- JSON 节点树
- `view / text / image` 基础节点
- 简化版 `flex` 布局
- 简化版 `absolute` 定位
- 基于 `example.html` 的示例页面

## 当前文件

- `types.ts`：JSON 节点与样式类型
- `style.ts`：默认样式、盒模型和数值解析
- `layout.ts`：简化布局引擎
- `WebUIBackground.ts`：背景色与圆角绘制
- `WebUIRenderer.ts`：JSON -> Cocos 节点树
- `WebUIDemo.ts`：示例入口组件
- `examples/withdrawExample.ts`：提现页面 JSON 示例

## 如何在编辑器中测试

1. 打开 Cocos Creator 2.4 工程目录 `cocos/`
2. 在场景中创建一个全屏节点，建议直接使用 `Canvas`
3. 给该节点挂载 `WebUIDemo`
4. 如果你希望渲染到子节点，也可以：
   - 创建一个空节点作为容器
   - 设置容器尺寸
   - 在 `WebUIDemo.target` 中指定这个容器
5. 运行场景，查看是否渲染出示例页面

## 当前限制

这是原型，不是完整引擎。当前已知限制：

- `image` 仅完成基础加载入口，未完善尺寸测量
- `flexGrow / flexShrink` 还未实现
- `flexWrap` 还未实现
- `overflow: hidden` 仅在 schema 中保留，未接入 mask
- 边框、渐变、完整文本测量仍未完成
- 部分背景绘制依赖布局完成后的二次刷新

## 下一步建议

1. 优先补 `flexGrow / flexShrink`
2. 增加 `row` / `column` 的更精确测量逻辑
3. 接入 `Mask` 处理 `overflow: hidden`
4. 把 `example.html` 自动转换成 JSON
5. 加一套布局调试输出
