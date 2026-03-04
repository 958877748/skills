# Cocos Creator CLI 开发状态

> 最后更新：2026年3月4日  
> 版本：1.3.0

## ✅ 功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| 查看节点树 | ✅ 正常 | `tree` 命令，组件显示索引 |
| 获取节点属性 | ✅ 正常 | `get` 命令 |
| 修改节点属性 | ✅ 正常 | `set` 命令，支持自动刷新编辑器 |
| 添加节点 | ✅ 正常 | `add` 命令，支持插入到任意位置 |
| 添加组件 | ✅ 正常 | `add-component` 命令 |
| 删除节点/组件 | ✅ 正常 | `remove` 命令，自动识别类型，支持 `--component/--node` 强制指定 |
| 构建组件映射 | ✅ 正常 | `build` 命令 |
| 创建预制体 | ✅ 正常 | `prefab-create` 命令 |
| 创建场景 | ✅ 正常 | `create-scene` 命令 |
| 编辑器自动刷新 | ✅ 正常 | 通过 CLI Helper 插件实现 |

---

## 📁 项目结构

```
cocos-cli/
├── bin/
│   └── cocos-cli.js          # CLI 入口
├── src/
│   ├── commands/             # 命令模块
│   │   ├── add.js            # 添加节点
│   │   ├── add-component.js  # 添加组件
│   │   ├── build.js          # 构建映射
│   │   ├── create-scene.js   # 创建场景
│   │   ├── get.js            # 获取节点信息
│   │   ├── prefab-create.js  # 创建预制体
│   │   ├── remove.js         # 删除节点/组件（统一）
│   │   ├── set.js            # 设置节点属性
│   │   └── tree.js           # 查看节点树
│   └── lib/                  # 核心库
│       ├── components/       # 组件模块（每种类型独立文件）
│       │   ├── index.js      # 组件入口
│       │   ├── sprite.js     # Sprite 组件
│       │   ├── label.js      # Label 组件
│       │   ├── button.js     # Button 组件
│       │   ├── widget.js     # Widget 组件
│       │   ├── layout.js     # Layout 组件
│       │   ├── canvas.js     # Canvas 组件
│       │   ├── camera.js     # Camera 组件
│       │   └── particle-system.js # ParticleSystem 组件
│       ├── node-utils.js     # 节点操作
│       ├── fire-utils.js     # 文件操作
│       ├── templates.js      # 场景/预制体模板
│       └── utils.js          # 通用工具
├── data/
│   ├── prefab-template.json
│   ├── scene-template.json
│   └── script_map.json
└── editor-plugin/
    └── cocos-cli-helper/     # 编辑器插件
```

### 模块职责

| 模块 | 职责 |
|-----|------|
| `components/*.js` | 每种组件独立管理：模板、属性处理、默认值 |
| `components/index.js` | 组件统一入口：创建、解析、属性应用 |
| `node-utils.js` | 节点相关：创建、属性设置、树构建、状态获取 |
| `fire-utils.js` | 文件操作：加载、保存、索引映射、编辑器刷新 |
| `templates.js` | 场景/预制体模板创建 |
| `utils.js` | 通用工具：颜色、UUID、参数解析、输出格式 |

---

## 📝 技术细节

### 索引排列规律（Cocos Creator 2.4.x）

```
0: cc.SceneAsset
1: cc.Scene
2: cc.Node (Canvas - 根节点)
3:   cc.Node (Main Camera - 第1个子节点)
4:     cc.Camera (Main Camera 的组件)
5:   cc.Node (GameScene - 第2个子节点)
6:     cc.Node (Child1 - GameScene 的第1个子节点)
7:       cc.Node (GrandChild - Child1 的子节点)
8:     cc.Node (Child2 - GameScene 的第2个子节点)
9: cc.Canvas (Canvas 的组件)
10: cc.Widget (Canvas 的组件)
```

**规律**：
1. 0, 1 固定为 SceneAsset 和 Scene
2. 节点按**深度优先遍历**顺序排列
3. **组件放在该节点整个子树遍历完成之后**
4. 即：父节点 → 子节点 → 孙节点... → 父节点的组件
5. `_children` 数组的顺序决定了子节点在数组中的先后顺序

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
1. 根据 _children 顺序确定插入位置（深度优先遍历）
2. 创建新节点
3. 在正确位置插入新节点（splice）
4. 重建所有 __id__ 引用（插入位置后的索引+1）
5. 更新新节点的 _parent 引用
6. 如有组件，在节点后插入组件
7. 更新父节点的 _children 数组
8. 保存文件
9. 触发编辑器刷新
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
cocos2d-cli tree assets/main.fire

# 2. 添加节点
cocos2d-cli add assets/main.fire 2 NewSprite --type=sprite --x=100 --y=200

# 3. 修改属性（自动刷新编辑器）
cocos2d-cli set assets/main.fire 5 --x=200 --scaleX=2

# 4. 删除组件（使用索引）
cocos2d-cli remove assets/main.fire 15

# 5. 删除节点（使用索引）
cocos2d-cli remove assets/main.fire 3

# 6. 强制指定删除类型
cocos2d-cli remove assets/main.fire 10 --component
cocos2d-cli remove assets/main.fire 5 --node
```

### 组件规则

**渲染组件（每节点仅一个）**：`sprite`, `label`, `particleSystem`

**功能组件（可多个共存）**：`button`, `widget`, `layout`, `camera`, `canvas`

```bash
# ❌ 错误：多个渲染组件
BtnConfirm (sprite, label)

# ✅ 正确：拆分到子节点
BtnConfirm (button, widget)
└─ BtnText (label)
```

**节点属性选项**：`--width=`, `--height=`, `--x=`, `--y=`, `--active=`, `--color=`

### 注意事项

1. **首次使用**：确保在编辑器中启用 CLI Helper 插件
2. **组件索引**：tree 命令会显示组件索引，用于 remove 命令
3. **自动刷新**：增删改操作后编辑器会自动重新加载场景
4. **直接操作文件**：所有命令直接读取和保存场景文件
5. **场景模板**：`create-scene` 使用 `data/scene-template.json` 作为基础模板

---

## 🔄 版本历史

### v1.3.0 (2026-03-04)
- **架构重构**：按职责拆分模块
  - 每种组件独立文件 `src/lib/components/*.js`
  - 节点操作独立模块 `node-utils.js`
  - 模板独立模块 `templates.js`
- **命令整合**：`delete.js`、`remove-component.js` 合并到 `remove.js`
- **统一命名**：所有命令提示统一为 `cocos2d-cli`
- **代码优化**：消除重复代码，统一输出格式

### v1.2.0
- 新增 `create-scene` 命令
- 优化编辑器自动刷新机制

### v1.1.0
- 新增 `prefab-create` 命令
- 支持预制体操作

### v1.0.0
- 初始版本
- 基础场景操作功能

---

## 🗑️ 已删除功能

| 功能 | 删除原因 |
|------|---------|
| 会话模式（open/close）| 直接操作文件更简单高效 |
| `delete.js` 命令 | 合并到 `remove.js` |
| `remove-component.js` 命令 | 合并到 `remove.js` |

---

## 📚 参考项目

### mcp-bridge
- **URL**: https://github.com/firekula/mcp-bridge
- **用途**: Cocos Creator 编辑器扩展开发参考
- **查找 IPC 信息**: 搜索 `Editor.Ipc.sendToMain`、`Editor.Ipc.sendToPanel`、`scene:` 等关键词

---

## 📞 问题反馈

如有问题或建议，请在项目 Issues 中反馈。