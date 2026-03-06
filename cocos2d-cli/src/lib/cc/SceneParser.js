const fs = require('fs');
const CCSceneAsset = require('./CCSceneAsset');
const CCScene = require('./CCScene');
const CCNode = require('./CCNode');
const CCComponent = require('./CCComponent');
const CCCanvas = require('./CCCanvas');
const CCWidget = require('./CCWidget');
const CCCamera = require('./CCCamera');
const CCSprite = require('./CCSprite');
const CCLabel = require('./CCLabel');
const CCButton = require('./CCButton');
const { generateUUID, generateCompressedUUID } = require('../utils');

/**
 * 场景解析器
 * 将 JSON 解析为对象树，支持操作后重新序列化
 */
class SceneParser {
    constructor() {
        this.asset = null;    // CCSceneAsset
        this.scene = null;    // CCScene
        this.allNodes = [];   // 所有节点（用于生成 _id）
    }

    /**
     * 解析场景文件
     * @param {string} filePath - 场景文件路径
     * @returns {SceneParser}
     */
    static parse(filePath) {
        const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const parser = new SceneParser();
        parser.parseJSON(json);
        return parser;
    }

    /**
     * 解析 JSON 数据
     * @param {Array} json - JSON 数组
     */
    parseJSON(json) {
        // 创建索引映射
        const indexMap = new Map();
        
        // 第一遍：创建所有对象
        json.forEach((item, index) => {
            const obj = this.createObject(item);
            if (obj) {
                indexMap.set(index, obj);
            }
        });

        // 第二遍：建立引用关系
        json.forEach((item, index) => {
            const obj = indexMap.get(index);
            if (!obj) return;
            
            this.setupReferences(obj, item, indexMap);
        });

        // 设置根对象
        this.asset = indexMap.get(0);
        this.scene = indexMap.get(1);

        // 收集所有节点
        this.collectNodes();
    }

    /**
     * 根据类型创建对象
     */
    createObject(item) {
        const type = item.__type__;
        
        switch (type) {
            case 'cc.SceneAsset':
                return new CCSceneAsset();
            case 'cc.Scene':
                const scene = new CCScene(item._name || 'Scene');
                scene._id = item._id || '';
                return scene;
            case 'cc.Node':
                const node = new CCNode(item._name || 'Node');
                // 预制体内节点 _id 为空
                node._id = item._id || '';
                return node;
            case 'cc.Canvas':
            case 'cc.Widget':
            case 'cc.Camera':
            case 'cc.Sprite':
            case 'cc.Label':
            case 'cc.Button':
                return this.createComponent(type, item);
            default:
                // 未知类型返回原始对象
                return { ...item };
        }
    }

    /**
     * 创建组件
     */
    createComponent(type, item) {
        let comp;
        
        // 创建具体类型的组件
        switch (type) {
            case 'cc.Canvas':
                comp = new CCCanvas();
                break;
            case 'cc.Widget':
                comp = new CCWidget();
                break;
            case 'cc.Camera':
                comp = new CCCamera();
                break;
            case 'cc.Sprite':
                comp = new CCSprite();
                break;
            case 'cc.Label':
                comp = new CCLabel();
                break;
            case 'cc.Button':
                comp = new CCButton();
                break;
            default:
                comp = new CCComponent();
                comp.__type__ = type;
        }
        
        comp._id = item._id || '';
        
        // 复制所有属性
        for (const key of Object.keys(item)) {
            if (!['__type__', '_name', '_objFlags', 'node', '_enabled', '_id'].includes(key)) {
                comp[key] = item[key];
            }
        }
        
        return comp;
    }

    /**
     * 设置引用关系
     */
    setupReferences(obj, item, indexMap) {
        const type = item.__type__;
        
        if (type === 'cc.SceneAsset') {
            // scene 引用
            if (item.scene) {
                obj.scene = indexMap.get(item.scene.__id__);
            }
        } else if (type === 'cc.Scene' || type === 'cc.Node') {
            // 父节点引用
            if (item._parent) {
                obj._parent = indexMap.get(item._parent.__id__);
            }
            // 子节点引用
            if (item._children) {
                obj._children = item._children.map(c => indexMap.get(c.__id__)).filter(Boolean);
            }
            // 组件引用
            if (item._components) {
                obj._components = item._components.map(c => indexMap.get(c.__id__)).filter(Boolean);
                // 设置组件的 node 引用
                obj._components.forEach(comp => {
                    if (comp) comp.node = obj;
                });
            }
            // 复制其他属性
            this.copyNodeProperties(obj, item);
        } else if (obj.node !== undefined) {
            // 组件的 node 引用
            if (item.node) {
                obj.node = indexMap.get(item.node.__id__);
            }
        }
    }

    /**
     * 复制节点属性
     */
    copyNodeProperties(obj, item) {
        // 复制基本属性
        if (item._active !== undefined) obj._active = item._active;
        if (item._opacity !== undefined) obj._opacity = item._opacity;
        if (item._is3DNode !== undefined) obj._is3DNode = item._is3DNode;
        if (item._groupIndex !== undefined) obj._groupIndex = item._groupIndex;
        if (item.groupIndex !== undefined) obj.groupIndex = item.groupIndex;
        if (item.autoReleaseAssets !== undefined) obj.autoReleaseAssets = item.autoReleaseAssets;
        
        // 复制颜色
        if (item._color) {
            obj._color.r = item._color.r;
            obj._color.g = item._color.g;
            obj._color.b = item._color.b;
            obj._color.a = item._color.a;
        }
        
        // 复制大小
        if (item._contentSize) {
            obj._contentSize.width = item._contentSize.width;
            obj._contentSize.height = item._contentSize.height;
        }
        
        // 复制锚点
        if (item._anchorPoint) {
            obj._anchorPoint.x = item._anchorPoint.x;
            obj._anchorPoint.y = item._anchorPoint.y;
        }
        
        // 复制变换
        if (item._trs && item._trs.array) {
            for (let i = 0; i < item._trs.array.length; i++) {
                obj._trs.array[i] = item._trs.array[i];
            }
        }
        
        // 复制旋转
        if (item._eulerAngles) {
            obj._eulerAngles.x = item._eulerAngles.x;
            obj._eulerAngles.y = item._eulerAngles.y;
            obj._eulerAngles.z = item._eulerAngles.z;
        }
        
        if (item._skewX !== undefined) obj._skewX = item._skewX;
        if (item._skewY !== undefined) obj._skewY = item._skewY;
    }

    /**
     * 收集所有节点
     */
    collectNodes() {
        this.allNodes = [];
        const collect = (node) => {
            if (!node) return;
            this.allNodes.push(node);
            if (node._children) {
                node._children.forEach(child => collect(child));
            }
        };
        collect(this.scene);
    }

    /**
     * 查找节点 by 名称
     */
    findNode(name) {
        return this.allNodes.find(n => n._name === name);
    }

    /**
     * 查找节点 by _id
     */
    findNodeById(id) {
        return this.allNodes.find(n => n._id === id);
    }

    /**
     * 通过路径查找节点
     * 支持格式：
     * - "NodeName" - 直接名称
     * - "Parent/Child" - 路径
     * - "Parent/Child[0]" - 数组索引
     * @param {string} path - 节点路径
     * @returns {CCNode|null}
     */
    findByPath(path) {
        if (!path) return null;
        
        // 解析路径
        const parts = path.split('/').filter(p => p);
        if (parts.length === 0) return null;
        
        // 从 scene 的子节点开始查找
        let current = this.scene;
        
        for (const part of parts) {
            if (!current._children) return null;
            
            // 解析名称和索引：NodeName 或 NodeName[0]
            const match = part.match(/^(.+?)(?:\[(\d+)\])?$/);
            if (!match) return null;
            
            const name = match[1];
            const index = match[2] !== undefined ? parseInt(match[2]) : null;
            
            // 查找匹配名称的子节点
            const matches = current._children.filter(c => c._name === name);
            
            if (matches.length === 0) return null;
            
            if (index !== null) {
                // 指定索引
                current = matches[index] || null;
            } else if (matches.length === 1) {
                // 唯一匹配
                current = matches[0];
            } else {
                // 多个匹配，默认取第一个
                current = matches[0];
            }
            
            if (!current) return null;
        }
        
        return current;
    }

    /**
     * 通过路径或对象查找节点
     * @param {string|CCNode} ref - 路径或节点对象
     * @returns {CCNode|null}
     */
    resolveNode(ref) {
        if (!ref) return null;
        if (typeof ref === 'object') return ref;
        if (typeof ref === 'string') {
            // 先尝试路径查找
            const node = this.findByPath(ref);
            if (node) return node;
            // 再尝试名称查找
            return this.findNode(ref);
        }
        return null;
    }

    /**
     * 添加节点
     * @param {CCNode} node - 新节点
     * @param {CCNode} parent - 父节点，默认为 scene
     */
    addNode(node, parent = this.scene) {
        if (!parent) parent = this.scene;
        parent._children.push(node);
        node._parent = parent;
        node._id = generateCompressedUUID(); // 使用压缩格式 UUID
        this.allNodes.push(node);
        return node;
    }

    /**
     * 删除节点
     * @param {CCNode} node - 要删除的节点
     */
    removeNode(node) {
        if (!node || !node._parent) return false;
        
        // 从父节点移除
        const index = node._parent._children.indexOf(node);
        if (index > -1) {
            node._parent._children.splice(index, 1);
        }
        
        // 从 allNodes 移除
        const remove = (n) => {
            const idx = this.allNodes.indexOf(n);
            if (idx > -1) this.allNodes.splice(idx, 1);
            if (n._children) n._children.forEach(c => remove(c));
        };
        remove(node);
        
        return true;
    }

    /**
     * 添加组件到节点
     */
    addComponent(node, component) {
        component.node = node;
        node._components.push(component);
        return component;
    }

    /**
     * 移除组件
     */
    removeComponent(component) {
        if (!component || !component.node) return false;
        const index = component.node._components.indexOf(component);
        if (index > -1) {
            component.node._components.splice(index, 1);
            component.node = null;
            return true;
        }
        return false;
    }

    /**
     * 序列化为 JSON
     */
    toJSON() {
        const result = [];
        const indexMap = new Map();

        // 先添加 SceneAsset
        result.push(this.asset);
        indexMap.set(this.asset, 0);

        // 添加 Scene
        result.push(this.scene);
        indexMap.set(this.scene, 1);

        // 递归添加节点（先节点，再子节点，最后组件）
        const addNode = (node) => {
            if (!node || indexMap.has(node)) return;
            
            const nodeIndex = result.length;
            indexMap.set(node, nodeIndex);
            result.push(node);

            // 先递归子节点
            if (node._children) {
                node._children.forEach(child => addNode(child));
            }

            // 最后添加组件
            if (node._components) {
                node._components.forEach(comp => {
                    if (!indexMap.has(comp)) {
                        indexMap.set(comp, result.length);
                        result.push(comp);
                    }
                });
            }
        };

        // 遍历 scene 的子节点
        if (this.scene._children) {
            this.scene._children.forEach(child => addNode(child));
        }

        // 转换为 JSON 对象
        return result.map(obj => this.objectToJSON(obj, indexMap));
    }

    /**
     * 单个对象转 JSON
     */
    objectToJSON(obj, indexMap) {
        const type = obj.__type__;
        
        if (type === 'cc.SceneAsset') {
            return {
                __type__: 'cc.SceneAsset',
                _name: obj._name || '',
                _objFlags: obj._objFlags,
                _native: obj._native || '',
                scene: { __id__: indexMap.get(obj.scene) }
            };
        }
        
        if (type === 'cc.Scene') {
            return {
                __type__: 'cc.Scene',
                _objFlags: obj._objFlags,
                _parent: null,
                _children: obj._children.map(c => ({ __id__: indexMap.get(c) })),
                _active: obj._active,
                _components: [],
                _prefab: null,
                _opacity: obj._opacity,
                _color: obj._color.toJSON(),
                _contentSize: obj._contentSize.toJSON(),
                _anchorPoint: obj._anchorPoint.toJSON(),
                _trs: obj._trs.toJSON(),
                _is3DNode: obj._is3DNode,
                _groupIndex: obj._groupIndex,
                groupIndex: obj.groupIndex,
                autoReleaseAssets: obj.autoReleaseAssets || false,
                _id: obj._id
            };
        }
        
        if (type === 'cc.Node') {
            return {
                __type__: 'cc.Node',
                _name: obj._name,
                _objFlags: obj._objFlags,
                _parent: obj._parent ? { __id__: indexMap.get(obj._parent) } : null,
                _children: obj._children.map(c => ({ __id__: indexMap.get(c) })),
                _active: obj._active,
                _components: obj._components.map(c => ({ __id__: indexMap.get(c) })),
                _prefab: obj._prefab,
                _opacity: obj._opacity,
                _color: obj._color.toJSON(),
                _contentSize: obj._contentSize.toJSON(),
                _anchorPoint: obj._anchorPoint.toJSON(),
                _trs: obj._trs.toJSON(),
                _eulerAngles: obj._eulerAngles.toJSON(),
                _skewX: obj._skewX,
                _skewY: obj._skewY,
                _is3DNode: obj._is3DNode,
                _groupIndex: obj._groupIndex,
                groupIndex: obj.groupIndex,
                _id: obj._id
            };
        }
        
        // 组件
        const json = {
            __type__: type,
            _name: obj._name || '',
            _objFlags: obj._objFlags,
            node: { __id__: indexMap.get(obj.node) },
            _enabled: obj._enabled
        };
        
        // 复制其他属性（不含 _id）
        for (const key of Object.keys(obj)) {
            if (!['__type__', '_name', '_objFlags', 'node', '_enabled', '_id'].includes(key)) {
                json[key] = obj[key];
            }
        }
        
        // _id 放最后
        json._id = obj._id;
        
        return json;
    }

    /**
     * 保存到文件
     */
    save(filePath, metaPath = null) {
        const json = this.toJSON();
        
        // 如果有 meta 文件，读取 uuid
        if (metaPath && fs.existsSync(metaPath)) {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            if (meta.uuid && this.scene) {
                this.scene._id = meta.uuid;
            }
        }
        
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    }
}

module.exports = SceneParser;
