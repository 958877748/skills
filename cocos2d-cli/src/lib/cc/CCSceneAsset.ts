import CCObject from './CCObject.js';
import CCScene from './CCScene.js';
import CCNode from './CCNode.js';
import CCCanvas from './CCCanvas.js';
import CCWidget from './CCWidget.js';
import CCSprite from './CCSprite.js';
import CCLabel from './CCLabel.js';
import CCButton from './CCButton.js';
import CCCamera from './CCCamera.js';
import { generateCompressedUUID } from '../utils.js';

interface CCRef { __id__: number }

/**
 * Cocos Creator 场景资源类
 * 场景文件的容器，包含 CCScene 根节点
 */
export default class CCSceneAsset extends CCObject {
    _native: string;
    _scene: CCScene | null;

    constructor() {
        super('');
        this.__type__ = 'cc.SceneAsset';
        
        this._native = '';
        this._scene = null;
    }

    /**
     * 获取场景根节点
     */
    getScene(): CCScene | null {
        return this._scene;
    }

    /**
     * 添加节点到场景
     */
    addNode(node: CCNode): CCNode | null {
        if (!this._scene) return null;
        
        node._parent = { __id__: 1 }; // 引用 Scene
        if (!this._scene._children) this._scene._children = [];
        this._scene._children.push({ __id__: 0 }); // 简化处理
        
        // 场景中的节点需要 _id
        node._id = generateCompressedUUID();
        
        return node;
    }

    /**
     * 删除节点
     */
    removeNode(node: CCNode): boolean {
        if (!node._parent) return false;
        
        const idx = -1; // 简化处理
        if (idx > -1) {
            return true;
        }
        return false;
    }

    /**
     * 从 JSON 解析
     */
    static fromJSON(json: any[]): CCSceneAsset {
        const asset = new CCSceneAsset();
        const objects: any[] = [];
        
        // 第一遍：创建所有对象
        json.forEach((item, index) => {
            objects[index] = createObject(item);
        });
        
        // 第二遍：建立引用关系
        json.forEach((item, index) => {
            setupReferences(objects[index], item, objects);
        });
        
        asset._scene = objects[1];
        return asset;
    }

    /**
     * 序列化为 JSON
     */
    toJSON(): any[] {
        const result: any[] = [];
        const indexMap = new Map<any, number>();
        
        // 0: SceneAsset 头
        indexMap.set(this, 0);
        result.push({
            __type__: 'cc.SceneAsset',
            _name: '',
            _objFlags: 0,
            _native: '',
            scene: { __id__: 1 }
        });
        
        // 1: Scene
        if (this._scene) {
            indexMap.set(this._scene, 1);
        }
        result.push(null);
        
        // 递归处理节点
        const processNode = (node: CCNode) => {
            if (!node) return;
            
            indexMap.set(node, result.length);
            result.push(null);
            
            if (node._children) {
                node._children.forEach(child => processNode(child as unknown as CCNode));
            }
            
            if (node._components) {
                node._components.forEach(comp => {
                    indexMap.set(comp, result.length);
                    result.push(componentToJSON(comp, indexMap));
                });
            }
            
            result[indexMap.get(node)!] = {
                __type__: 'cc.Node',
                _name: node._name,
                _objFlags: node._objFlags,
                _parent: node._parent ? { __id__: indexMap.get(node._parent) } : null,
                _children: node._children?.map(c => ({ __id__: indexMap.get(c) })) || [],
                _active: node._active,
                _components: node._components?.map(c => ({ __id__: indexMap.get(c) })) || [],
                _prefab: null,
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
        };
        
        if (this._scene?._children) {
            this._scene._children.forEach(child => processNode(child as unknown as CCNode));
        }
        
        if (this._scene) {
            result[1] = {
                __type__: 'cc.Scene',
                _objFlags: this._scene._objFlags,
                _parent: null,
                _children: this._scene._children?.map(c => ({ __id__: indexMap.get(c) })) || [],
                _active: this._scene._active,
                _components: [],
                _prefab: null,
                _opacity: this._scene._opacity,
                _color: this._scene._color.toJSON(),
                _contentSize: this._scene._contentSize.toJSON(),
                _anchorPoint: this._scene._anchorPoint.toJSON(),
                _trs: this._scene._trs.toJSON(),
                _is3DNode: this._scene._is3DNode,
                _groupIndex: this._scene._groupIndex,
                groupIndex: this._scene.groupIndex,
                autoReleaseAssets: this._scene.autoReleaseAssets || false,
                _id: this._scene._id || ''
            };
        }
        
        return result;
    }
}

function componentToJSON(comp: any, indexMap: Map<any, number>): any {
    const json: any = {
        __type__: comp.__type__,
        _name: comp._name || '',
        _objFlags: comp._objFlags || 0,
        node: { __id__: indexMap.get(comp.node) },
        _enabled: comp._enabled !== false
    };
    
    for (const key of Object.keys(comp)) {
        if (['__type__', '_name', '_objFlags', 'node', '_enabled', '_id'].includes(key)) continue;
        const val = comp[key];
        if (val === undefined) continue;
        json[key] = val && typeof val.toJSON === 'function' ? val.toJSON() : val;
    }
    
    json._id = comp._id || '';
    return json;
}

function createObject(item: any): any {
    const type = item.__type__;
    
    if (type === 'cc.SceneAsset') return null;
    if (type === 'cc.Scene') {
        const scene = new CCScene();
        scene._id = item._id || '';
        if (item._active !== undefined) scene._active = item._active;
        if (item.autoReleaseAssets !== undefined) scene.autoReleaseAssets = item.autoReleaseAssets;
        return scene;
    }
    
    if (type === 'cc.Node') {
        const node = new CCNode(item._name || 'Node');
        node._id = item._id || '';
        copyNodeProps(node, item);
        return node;
    }
    
    const comp = createComponentInstance(type);
    if (comp) {
        copyComponentProps(comp, item);
        return comp;
    }
    
    const obj: any = { __type__: type };
    for (const key of Object.keys(item)) {
        obj[key] = item[key];
    }
    return obj;
}

function createComponentInstance(type: string): any {
    switch (type) {
        case 'cc.Canvas': return new CCCanvas();
        case 'cc.Widget': return new CCWidget();
        case 'cc.Sprite': return new CCSprite();
        case 'cc.Label': return new CCLabel();
        case 'cc.Button': return new CCButton();
        case 'cc.Camera': return new CCCamera();
        default: return null;
    }
}

function copyComponentProps(comp: any, item: any): void {
    for (const key of Object.keys(item)) {
        if (['__type__', '_name', '_objFlags', 'node', '_enabled', '_id'].includes(key)) continue;
        comp[key] = item[key];
    }
    if (item._id) comp._id = item._id;
}

function copyNodeProps(node: CCNode, item: any): void {
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
    if (item._trs?.array) item._trs.array.forEach((v: number, i: number) => node._trs.array[i] = v);
    if (item._eulerAngles) node._eulerAngles.set(item._eulerAngles.x, item._eulerAngles.y, item._eulerAngles.z);
}

function setupReferences(obj: any, item: any, objects: any[]): void {
    if (!obj) return;
    
    if (obj.__type__ === 'cc.Scene' || obj.__type__ === 'cc.Node') {
        if (item._parent) obj._parent = objects[item._parent.__id__];
        if (item._children) obj._children = item._children.map((c: CCRef) => objects[c.__id__]).filter(Boolean);
        if (item._components) {
            obj._components = item._components.map((c: CCRef) => objects[c.__id__]).filter(Boolean);
            obj._components.forEach((c: any) => { if (c) c.node = obj; });
        }
    }
}
