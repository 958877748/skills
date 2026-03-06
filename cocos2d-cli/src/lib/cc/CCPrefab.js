const CCObject = require('./CCObject');
const { generateFileId } = require('../fire-utils');

/**
 * Cocos Creator 预制体类（只是元数据头，不管理节点树）
 */
class CCPrefab extends CCObject {
    constructor() {
        super('');
        this.__type__ = 'cc.Prefab';
        
        this._native = '';
        this._root = null; // 根节点引用
        this.optimizationPolicy = 0;
        this.asyncLoadAssets = false;
        this.readonly = false;
    }

    setRoot(node) {
        this._root = node;
        return this;
    }

    /**
     * 从 JSON 解析
     */
    static fromJSON(json) {
        const prefab = new CCPrefab();
        const objects = [];
        
        // 第一遍：创建所有对象
        json.forEach((item, index) => {
            objects[index] = createObject(item);
        });
        
        // 第二遍：建立引用关系
        json.forEach((item, index) => {
            setupReferences(objects[index], item, objects);
        });
        
        prefab._root = objects[1];
        return prefab;
    }

    /**
     * 序列化为 JSON
     * 顺序：Prefab头 → 节点树（节点 → 子节点们+PrefabInfo → 组件 → PrefabInfo） → 根PrefabInfo
     */
    toJSON() {
        const result = [];
        const indexMap = new Map();
        
        // 0: Prefab 头
        indexMap.set(this, 0);
        result.push({
            __type__: 'cc.Prefab',
            _name: '',
            _objFlags: 0,
            _native: '',
            data: null, // 后面填充
            optimizationPolicy: this.optimizationPolicy,
            asyncLoadAssets: this.asyncLoadAssets,
            readonly: this.readonly
        });
        
        // 递归处理节点
        const processNode = (node, isRoot = false) => {
            if (!node) return;
            
            // 添加节点
            indexMap.set(node, result.length);
            result.push(null); // 占位
            
            // 递归处理子节点（每个子节点处理完会带上它的 PrefabInfo）
            if (node._children) {
                node._children.forEach(child => processNode(child, false));
            }
            
            // 添加组件
            if (node._components) {
                node._components.forEach(comp => {
                    indexMap.set(comp, result.length);
                    result.push(componentToJSON(comp, indexMap));
                });
            }
            
            // 生成节点 JSON
            result[indexMap.get(node)] = {
                __type__: 'cc.Node',
                _name: node._name,
                _objFlags: node._objFlags,
                _parent: node._parent ? { __id__: indexMap.get(node._parent) } : null,
                _children: (node._children || []).map(c => ({ __id__: indexMap.get(c) })),
                _active: node._active,
                _components: (node._components || []).map(c => ({ __id__: indexMap.get(c) })),
                _prefab: null, // 后面填充
                _opacity: node._opacity,
                _color: node._color.toJSON(),
                _contentSize: node._contentSize.toJSON(),
                _anchorPoint: node._anchorPoint.toJSON(),
                _trs: node._trs.toJSON(),
                _eulerAngles: node._eulerAngles.toJSON(),
                _skewX: node._skewX,
                _skewY: node._skewY,
                _is3DNode: node._is3DNode,
                _groupIndex: node._groupIndex,
                groupIndex: node.groupIndex,
                _id: node._id || ''
            };
            
            // 非根节点：立即添加 PrefabInfo
            if (!isRoot) {
                const infoIdx = result.length;
                result.push({
                    __type__: 'cc.PrefabInfo',
                    root: { __id__: indexMap.get(this._root) },
                    asset: { __id__: 0 },
                    fileId: generateFileId(),
                    sync: false
                });
                result[indexMap.get(node)]._prefab = { __id__: infoIdx };
            }
        };
        
        // 处理根节点
        processNode(this._root, true);
        
        // 填充 Prefab 头的 data
        result[0].data = { __id__: indexMap.get(this._root) };
        
        // 最后添加根节点的 PrefabInfo
        if (this._root) {
            const infoIdx = result.length;
            result.push({
                __type__: 'cc.PrefabInfo',
                root: { __id__: indexMap.get(this._root) },
                asset: { __id__: 0 },
                fileId: '',
                sync: false
            });
            result[indexMap.get(this._root)]._prefab = { __id__: infoIdx };
        }
        
        return result;
    }
}

function componentToJSON(comp, indexMap) {
    const json = {
        __type__: comp.__type__,
        _name: comp._name || '',
        _objFlags: comp._objFlags || 0,
        node: { __id__: indexMap.get(comp.node) },
        _enabled: comp._enabled !== false
    };
    
    // 其他属性
    for (const key of Object.keys(comp)) {
        if (['__type__', '_name', '_objFlags', 'node', '_enabled', '_id'].includes(key)) continue;
        const val = comp[key];
        if (val === undefined) continue;
        json[key] = val && typeof val.toJSON === 'function' ? val.toJSON() : val;
    }
    
    // _id 放最后
    json._id = comp._id || '';
    
    return json;
}

function createObject(item) {
    const type = item.__type__;
    
    if (type === 'cc.Prefab') return null; // 跳过，由 CCPrefab.fromJSON 处理
    if (type === 'cc.PrefabInfo') return new CCPrefabInfo();
    
    if (type === 'cc.Node') {
        const CCNode = require('./CCNode');
        const node = new CCNode(item._name || 'Node');
        node._id = item._id || '';
        copyNodeProps(node, item);
        return node;
    }
    
    // 组件
    const comp = { __type__: type };
    for (const key of Object.keys(item)) {
        if (['__type__', '_name', '_objFlags', 'node', '_enabled', '_id'].includes(key)) continue;
        comp[key] = item[key];
    }
    return comp;
}

function copyNodeProps(node, item) {
    if (item._active !== undefined) node._active = item._active;
    if (item._opacity !== undefined) node._opacity = item._opacity;
    if (item._is3DNode !== undefined) node._is3DNode = item._is3DNode;
    if (item._groupIndex !== undefined) node._groupIndex = item._groupIndex;
    if (item.groupIndex !== undefined) node.groupIndex = item.groupIndex;
    if (item._skewX !== undefined) node._skewX = item._skewX;
    if (item._skewY !== undefined) node._skewY = item._skewY;
    
    if (item._color) node._color.set(item._color.r, item._color.g, item._color.b, item._color.a);
    if (item._contentSize) node._contentSize.set(item._contentSize.width, item._contentSize.height);
    if (item._anchorPoint) node._anchorPoint.set(item._anchorPoint.x, item._anchorPoint.y);
    if (item._trs?.array) item._trs.array.forEach((v, i) => node._trs.array[i] = v);
    if (item._eulerAngles) node._eulerAngles.set(item._eulerAngles.x, item._eulerAngles.y, item._eulerAngles.z);
}

function setupReferences(obj, item, objects) {
    if (!obj) return;
    
    if (obj.__type__ === 'cc.Node') {
        if (item._parent) obj._parent = objects[item._parent.__id__];
        if (item._children) obj._children = item._children.map(c => objects[c.__id__]).filter(Boolean);
        if (item._components) {
            obj._components = item._components.map(c => objects[c.__id__]).filter(Boolean);
            obj._components.forEach(c => { if (c) c.node = obj; });
        }
        if (item._prefab) obj._prefab = objects[item._prefab.__id__];
    } else if (obj.__type__ === 'cc.PrefabInfo') {
        if (item.root) obj.root = objects[item.root.__id__];
        if (item.asset) obj.asset = objects[item.asset.__id__];
        obj.fileId = item.fileId || '';
        obj.sync = item.sync || false;
    }
}

/**
 * 预制体信息类
 */
class CCPrefabInfo {
    constructor() {
        this.__type__ = 'cc.PrefabInfo';
        this.root = null;
        this.asset = null;
        this.fileId = '';
        this.sync = false;
    }
}

module.exports = { CCPrefab, CCPrefabInfo };
