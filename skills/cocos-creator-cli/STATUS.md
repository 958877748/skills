# Cocos Creator CLI 开发状态

> 最后更新：2026年2月12日

## ✅ 已修复功能

### 删除节点

**状态**：✅ 已完成，与编辑器行为一致

**修复内容**：
- 真正从数组中移除元素（而非标记销毁）
- 递归删除所有子节点和组件
- 自动重建所有 `__id__` 索引引用
- 支持单次删除和会话模式删除

**验证结果**：
| 测试项 | 结果 |
|--------|------|
| 删除单个节点 | ✅ 通过 |
| 删除有子节点的节点 | ✅ 通过 |
| 与编辑器行为对比 | ✅ 一致 |

**相关文件**：
- `delete_node.js` - 单次删除工具
- `scene_session.js` - 会话模式删除

---

## ⚠️ 已知问题

### 添加节点

**状态**：⚠️ 有限制，待完善

**当前行为**：
- 新节点追加到数组末尾
- 索引引用正确
- **不支持**插入到中间位置（`--at` 参数仅更新 `_children` 顺序）

**问题说明**：
```
当前实现：
[0:SceneAsset, 1:Scene, 2:Canvas, 3:MainCamera, 4:Camera, 5:Parent, ...]
                                                    ↑ 新节点追加到这里

编辑器行为（插入中间）：
[0:SceneAsset, 1:Scene, 2:Canvas, 3:MainCamera, 4:Camera, 5:NewNode, 6:Sprite, 7:Parent, ...]
                                                          ↑ 插入到这里
```

**影响**：
- 节点顺序与编辑器不同
- 但功能正常，编辑器可以正确打开

**Workaround**：
1. 使用 CLI 添加节点
2. 在 Cocos Creator 编辑器中调整节点顺序

**相关文件**：
- `add_node.js` - 单次添加工具
- `scene_session.js` - 会话模式添加

---

## 📋 功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| 查看节点树 | ✅ 正常 | `fire_reader.js` / `scene_session.js tree` |
| 获取节点属性 | ✅ 正常 | `get_node_property.js` / `scene_session.js get` |
| 修改节点属性 | ✅ 正常 | `scene_session.js set` |
| 添加节点 | ⚠️ 有限制 | 追加到末尾，不支持插入中间 |
| 删除节点 | ✅ 正常 | 与编辑器行为一致 |
| 会话模式 | ✅ 正常 | 支持批量操作 |

---

## 🧪 测试场景

项目位置：`c:\Users\guole\Documents\GitHub\skills\cocos`

测试文件：
- `test_backup.fire` - 原始测试场景（包含 Parent/Child1/Child2 结构）
- `test.fire` - 当前编辑场景
- `test_delete_test.fire` - 删除测试用
- `test_add_test.fire` - 添加测试用

---

## 🔧 后续计划

### 高优先级
1. **修复添加节点** - 支持插入到任意位置，与编辑器行为一致

### 中优先级
2. **测试修改属性** - 验证 `set` 命令在各种场景下的稳定性
3. **添加更多组件类型** - Button、Widget、Layout 等

### 低优先级
4. **复制节点功能** - 复制节点及其子节点
5. **查找功能** - 按名称/组件类型查找节点

---

## 💡 使用建议

### 推荐工作流

```bash
# 1. 打开会话
node scene_session.js open assets/main.fire
# 返回: {"sessionId": "a0e9c696"}

# 2. 查看节点树
node scene_session.js tree --session=a0e9c696

# 3. 添加节点（会追加到末尾）
node scene_session.js add Canvas NewSprite --session=a0e9c696 --type=sprite --x=100 --y=200

# 4. 修改属性
node scene_session.js set Canvas/NewSprite --session=a0e9c696 --x=200 --scaleX=2

# 5. 删除节点（完全支持）
node scene_session.js delete Canvas/OldNode --session=a0e9c696

# 6. 关闭会话保存
node scene_session.js close --session=a0e9c696

# 7. 在编辑器中调整节点顺序（如果需要）
```

### 注意事项

1. **添加节点后**，建议在编辑器中检查并调整节点顺序
2. **删除节点**可以放心使用，与编辑器行为完全一致
3. **会话模式**适合批量操作，避免索引错乱问题

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

### 添加算法（当前）

```javascript
1. 创建新节点和组件
2. 追加到数组末尾
3. 更新父节点 _children
4. 保存文件
// 问题：没有重建索引，导致顺序与编辑器不同
```

---

## 📞 问题反馈

如有问题或建议，请记录在此处。
