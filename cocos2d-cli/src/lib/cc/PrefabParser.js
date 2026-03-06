const fs = require('fs');
const { CCPrefab, CCPrefabInfo } = require('./CCPrefab');
const CCNode = require('./CCNode');
const CCComponent = require('./CCComponent');
const { generateFileId } = require('../fire-utils');

/**
 * 预制体解析器
 */
class PrefabParser {
    constructor() {
        this.prefab = null;      // CCPrefab
        this.rootNode = null;    // 根节点
        this.allNodes = [];      // 所有节点
    }

    /**
     * 解析预制体文件
     */
    static parse(filePath) {
        const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const parser = new PrefabParser();
        parser.parseJSON(json);
        return parser;
    }

    /**
     * 解析 JSON 数据
     */
    parseJSON(json) {
        const indexMap = new Map();
        
        // 第一遍：创建对象
        json.forEach((item, index) => {
            const obj = this.createObject(item);
            if (obj) indexMap.set(index, obj);
        });

        // 第二遍：建立引用
        json.forEach((item, index) => {
            const obj = indexMap.get(index);
            if (!obj) return;
            this.setupReferences(obj, item, indexMap);
        });

        // 设置根对象
        this.prefab = indexMap.get(0);
        this.rootNode = indexMap.get(1);

        // 收集所有节点
        this.collectNodes();
    }

    /**
     * 创建对象
     */
    createObject(item) {
        const type = item.__type__;
        
        switch (type) {
            case 'cc.Prefab':
                return new CCPrefab();
            case 'cc.PrefabInfo':
                const info = new CCPrefabInfo(0, 0);
                info.fileId = item.fileId || '';
                info.sync = item.sync || false;
                return info;
            case 'cc.Node':
                const node = new CCNode(item._name || 'Node');
                node._id = ''; // 预制体节点 _id 为空
                return node;
            case 'cc.Canvas':
            case 'cc.Widget':
            case 'cc.Camera':
            case 'cc.Sprite':
            case 'cc.Label':
            case 'cc.Button':
                return this.createComponent(type, item);
            default:
                return { ...item };
        }
    }

    /**
     * 创建组件
     */
    createComponent(type, item) {
        const comp = new CCComponent();
        comp.__type__ = type;
        comp._id = ''; // 预制体组件 _id 为空
        
        for (const key of Object.keys(item)) {
            if (!['__type__', '_name', '_objFlags', 'node', '_enabled', '_id'].includes(key)) {
                comp[key] = item[key];
            }
        }
        
        return comp;
    }

    /**
     * 设置引用
     */
    setupReferences(obj, item, indexMap) {
        const type = item.__type__;
        
        if (type === 'cc.Prefab') {
            if (item.data) {
                obj.data = indexMap.get(item.data.__id__);
            }
        } else if (type === 'cc.PrefabInfo') {
            if (item.root) obj.root = indexMap.get(item.root.__id__);
            if (item.asset) obj.asset = indexMap.get(item.asset.__id__);
        } else if (type === 'cc.Node') {
            if (item._parent) obj._parent = indexMap.get(item._parent.__id__);
            if (item._children) {
                obj._children = item._children.map(c => indexMap.get(c.__id__)).filter(Boolean);
            }
            if (item._components) {
                obj._components = item._components.map(c => indexMap.get(c.__id__)).filter(Boolean);
                obj._components.forEach(comp => { if (comp) comp.node = obj; });
            }
            if (item._prefab) {
                obj._prefab = indexMap.get(item._prefab.__id__);
            }
            this.copyNodeProperties(obj, item);
        } else if (obj.node !== undefined) {
            if (item.node) obj.node = indexMap.get(item.node.__id__);
        }
    }

    /**
     * 复制节点属性
     */
    copyNodeProperties(obj, item) {
        if (item._active !== undefined) obj._active = item._active;
        if (item._opacity !== undefined) obj._opacity = item._opacity;
        if (item._is3DNode !== undefined) obj._is3DNode = item._is3DNode;
        if (item._groupIndex !== undefined) obj._groupIndex = item._groupIndex;
        if (item.groupIndex !== undefined) obj.groupIndex = item.groupIndex;
        
        if (item._color) {
            obj._color.r = item._color.r;
            obj._color.g = item._color.g;
            obj._color.b = item._color.b;
            obj._color.a = item._color.a;
        }
        if (item._contentSize) {
            obj._contentSize.width = item._contentSize.width;
            obj._contentSize.height = item._contentSize.height;
        }
        if (item._anchorPoint) {
            obj._anchorPoint.x = item._anchorPoint.x;
            obj._anchorPoint.y = item._anchorPoint.y;
        }
        if (item._trs && item._trs.array) {
            for (let i = 0; i < item._trs.array.length; i++) {
                obj._trs.array[i] = item._trs.array[i];
            }
        }
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
        collect(this.rootNode);
    }

    /**
     * 查找节点 by 名称
     */
    findNode(name) {
        return this.allNodes.find(n => n._name === name);
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
        
        const parts = path.split('/').filter(p => p);
        if (parts.length === 0) return null;
        
        let current = this.rootNode;
        
        // 如果路径以根节点名称开始，跳过它
        if (parts[0] === this.rootNode._name) {
            parts.shift();
        }
        
        for (const part of parts) {
            if (!current._children) return null;
            
            const match = part.match(/^(.+?)(?:\[(\d+)\])?$/);
            if (!match) return null;
            
            const name = match[1];
            const index = match[2] !== undefined ? parseInt(match[2]) : null;
            
            const matches = current._children.filter(c => c._name === name);
            
            if (matches.length === 0) return null;
            
            if (index !== null) {
                current = matches[index] || null;
            } else if (matches.length === 1) {
                current = matches[0];
            } else {
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
            const node = this.findByPath(ref);
            if (node) return node;
            return this.findNode(ref);
        }
        return null;
    }

    /**
     * 添加节点
     */
    addNode(node, parent = this.rootNode) {
        parent._children.push(node);
        node._parent = parent;
        node._id = '';
        
        // 创建 PrefabInfo
        const info = new CCPrefabInfo(this.rootNode, this.prefab);
        node._prefab = info;
        
        this.allNodes.push(node);
        return node;
    }

    /**
     * 删除节点
     */
    removeNode(node) {
        if (!node || node === this.rootNode) return false; // 不能删除根节点
        
        if (node._parent) {
            const index = node._parent._children.indexOf(node);
            if (index > -1) node._parent._children.splice(index, 1);
        }
        
        const remove = (n) => {
            const idx = this.allNodes.indexOf(n);
            if (idx > -1) this.allNodes.splice(idx, 1);
            if (n._children) n._children.forEach(c => remove(c));
        };
        remove(node);
        
        return true;
    }

    /**
     * 添加组件
     */
    addComponent(node, component) {
        component.node = node;
        component._id = '';
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
        const prefabInfos = []; // 收集所有 PrefabInfo

        // 添加 Prefab
        indexMap.set(this.prefab, 0);
        result.push(this.prefab);

        // 递归添加节点
        const addNode = (node) => {
            if (!node || indexMap.has(node)) return;
            
            indexMap.set(node, result.length);
            result.push(node);

            // 添加组件
            if (node._components) {
                node._components.forEach(comp => {
                    if (!indexMap.has(comp)) {
                        indexMap.set(comp, result.length);
                        result.push(comp);
                    }
                });
            }

            // 添加 PrefabInfo
            if (node._prefab && !indexMap.has(node._prefab)) {
                indexMap.set(node._prefab, result.length);
                result.push(node._prefab);
            }

            // 递归子节点
            if (node._children) {
                node._children.forEach(child => addNode(child));
            }
        };

        addNode(this.rootNode);

        // 转换为 JSON
        return result.map(obj => this.objectToJSON(obj, indexMap));
    }

    /**
     * 单个对象转 JSON
     */
    objectToJSON(obj, indexMap) {
        const type = obj.__type__;
        
        if (type === 'cc.Prefab') {
            return {
                __type__: 'cc.Prefab',
                _name: obj._name || '',
                _objFlags: obj._objFlags,
                _native: obj._native || '',
                data: { __id__: indexMap.get(obj.data) },
                optimizationPolicy: obj.optimizationPolicy || 0,
                asyncLoadAssets: obj.asyncLoadAssets || false,
                readonly: obj.readonly || false
            };
        }
        
        if (type === 'cc.PrefabInfo') {
            return {
                __type__: 'cc.PrefabInfo',
                _name: obj._name || '',
                _objFlags: obj._objFlags,
                root: { __id__: indexMap.get(obj.root) },
                asset: { __id__: indexMap.get(obj.asset) },
                fileId: obj.fileId || '',
                sync: obj.sync || false
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
                _prefab: obj._prefab ? { __id__: indexMap.get(obj._prefab) } : null,
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
            _enabled: obj._enabled,
            _id: obj._id
        };
        
        for (const key of Object.keys(obj)) {
            if (!['__type__', '_name', '_objFlags', 'node', '_enabled', '_id'].includes(key)) {
                json[key] = obj[key];
            }
        }
        
        return json;
    }

    /**
     * 保存
     */
    save(filePath) {
        fs.writeFileSync(filePath, JSON.stringify(this.toJSON(), null, 2), 'utf8');
    }
}

module.exports = PrefabParser;
