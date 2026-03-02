# Cocos Creator CLI 开发状态

> 最后更新：2026年3月2日

## ✅ 功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| 查看节点树 | ✅ 正常 | `tree` 命令，组件显示索引 |
| 获取节点属性 | ✅ 正常 | `get` 命令 |
| 修改节点属性 | ✅ 正常 | `set` 命令，支持自动刷新编辑器 |
| 添加节点 | ✅ 正常 | `add` 命令，支持插入到任意位置 |
| 添加组件 | ✅ 正常 | `add-component` 命令 |
| 删除节点 | ✅ 正常 | `delete` 命令，与编辑器行为一致 |
| 删除组件 | ✅ 正常 | `remove` 命令，支持自动刷新编辑器 |
| 构建组件映射 | ✅ 正常 | `build` 命令 |
| 编辑器自动刷新 | ✅ 正常 | 通过 CLI Helper 插件实现 |

---

## 📝 技术细节

### 索引排列规律（Cocos Creator 2.4.x）

```
0: cc.SceneAsset
1: cc.Scene
2: cc.Node (根节点，如 Canvas)
3:   cc.Node (第1个子节点)
4:     cc.Component (子节点的组件)
5:   cc.Node (第2个子节点)
6:     cc.Component
7:   cc.Component (根节点的组件)
8:   cc.Component
```

**规律**：
1. 0, 1 固定为 SceneAsset 和 Scene
2. 节点按深度优先遍历顺序排列
3. 组件紧跟在所属节点后面
4. 根节点的组件放在所有子节点之后

### 删除算法

```javascript
1. 收集要删除的索引（节点 + 子节点 + 组件）
2. 从父节点 _children 中移除引用
3. 重建所有 __id__ 引用（映射旧索引到新索引）
4. 从数组中真正删除元素
5. 保存文件
```

### 添加算法

```javascript
1. 创建新节点和组件
2. 追加到数组末尾
3. 更新父节点 _children
4. 重新排列数组以匹配 _children 顺序
5. 保存文件
```

### 编辑器自动刷新机制

**CLI Helper 插件**（`editor-plugin/cocos-cli-helper/`）：
- 启动 HTTP 服务器（端口 7455）
- 接收 `/refresh` POST 请求
- 刷新资源数据库：`Editor.assetdb.refresh()`
- 重新打开场景：`Editor.Ipc.sendToMain('scene:open-by-uuid', uuid)`

**自动安装**：
- CLI 首次执行时自动复制插件到项目 `packages/` 目录
- 用户需在编辑器中启用插件

---

## 💡 使用建议

### 推荐工作流

```bash
# 1. 查看节点树（组件会显示索引）
node bin/cocos-cli.js tree assets/main.fire

# 2. 添加节点
node bin/cocos-cli.js add assets/main.fire Canvas NewSprite --type=sprite --x=100 --y=200

# 3. 修改属性（自动刷新编辑器）
node bin/cocos-cli.js set assets/main.fire Canvas/NewSprite --x=200 --scaleX=2

# 4. 删除组件（自动刷新编辑器）
node bin/cocos-cli.js remove assets/main.fire 15

# 5. 删除节点
node bin/cocos-cli.js delete assets/main.fire Canvas/OldNode
```

### 注意事项

1. **首次使用**：确保在编辑器中启用 CLI Helper 插件
2. **组件索引**：tree 命令会显示组件索引，用于 remove 命令
3. **自动刷新**：增删改操作后编辑器会自动重新加载场景
4. **直接操作文件**：所有命令直接读取和保存场景文件

---

## 🗑️ 已删除功能

| 功能 | 删除原因 |
|------|---------|
| 会话模式（open/close）| 直接操作文件更简单高效 |
| session.js | 不再需要会话管理 |

---

## 📚 参考项目

### mcp-bridge
- **URL**: https://github.com/firekula/mcp-bridge
- **用途**: Cocos Creator 编辑器扩展开发参考
- **查找 IPC 信息**: 搜索 `Editor.Ipc.sendToMain`、`Editor.Ipc.sendToPanel`、`scene:` 等关键词

---

## 📞 问题反馈

如有问题或建议，请记录在此处。
