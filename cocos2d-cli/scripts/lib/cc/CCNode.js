/**
 * Cocos Creator CCNode 模拟
 * 节点类，包含位置、大小、锚点、缩放、旋转、颜色、透明度等属性
 * @module lib/cc/CCNode
 */

import CCObject from './CCObject.js';
import CCColor from './CCColor.js';
import CCSize from './CCSize.js';
import CCVec2 from './CCVec2.js';
import CCVec3 from './CCVec3.js';
import CCTrs from './CCTrs.js';
export default class CCNode extends CCObject {
    _parent;
    _children;
    _active;
    _components;
    _prefab;
    _opacity;
    _color;
    _contentSize;
    _anchorPoint;
    _trs;
    _eulerAngles;
    _skewX;
    _skewY;
    _is3DNode;
    _groupIndex;
    groupIndex;
    _id;
    constructor(name = 'Node') {
        super(name);
        this.__type__ = 'cc.Node';
        this._parent = null;
        this._children = [];
        this._active = true;
        this._components = [];
        this._prefab = null;
        this._opacity = 255;
        this._color = new CCColor();
        this._contentSize = new CCSize();
        this._anchorPoint = new CCVec2(0.5, 0.5);
        this._trs = new CCTrs();
        this._eulerAngles = new CCVec3();
        this._skewX = 0;
        this._skewY = 0;
        this._is3DNode = false;
        this._groupIndex = 0;
        this.groupIndex = 0;
        this._id = '';
    }
    setId(id) {
        this._id = id;
        return this;
    }
    get x() { return this._trs.x; }
    set x(v) { this._trs.x = v; }
    get y() { return this._trs.y; }
    set y(v) { this._trs.y = v; }
    get scaleX() { return this._trs.scaleX; }
    set scaleX(v) { this._trs.scaleX = v; }
    get scaleY() { return this._trs.scaleY; }
    set scaleY(v) { this._trs.scaleY = v; }
    get width() { return this._contentSize.width; }
    set width(v) { this._contentSize.width = v; }
    get height() { return this._contentSize.height; }
    set height(v) { this._contentSize.height = v; }
    get anchorX() { return this._anchorPoint.x; }
    set anchorX(v) { this._anchorPoint.x = v; }
    get anchorY() { return this._anchorPoint.y; }
    set anchorY(v) { this._anchorPoint.y = v; }
    setPosition(x, y) {
        this._trs.setPosition(x, y);
        return this;
    }
    setContentSize(width, height) {
        this._contentSize.set(width, height);
        return this;
    }
    setAnchorPoint(x, y) {
        this._anchorPoint.set(x, y);
        return this;
    }
    setScale(x, y = x) {
        this._trs.setScale(x, y);
        return this;
    }
    setRotation(angle) {
        this._trs.rotZ = angle * Math.PI / 180;
        this._eulerAngles.z = angle;
        return this;
    }
    setColor(r, g, b, a = 255) {
        this._color.set(r, g, b, a);
        return this;
    }
    setOpacity(opacity) {
        this._opacity = opacity;
        return this;
    }
    setActive(active) {
        this._active = active;
        return this;
    }
    setParent(parent) {
        this._parent = typeof parent === 'number' ? { __id__: parent } : parent;
        return this;
    }
    addChild(child) {
        const childNode = typeof child === 'number' ? { __id__: child } : child;
        this._children.push(childNode);
        if (typeof childNode !== 'number' && childNode._parent !== undefined) {
            childNode._parent = this;
        }
        return this;
    }
    addComponent(comp) {
        if (typeof comp !== 'number') {
            comp.node = this;
        }
        this._components.push(comp);
        return this;
    }
    getProp() {
        const trs = this._trs?.array || [0, 0, 0, 0, 0, 0, 1, 1, 1, 1];
        return {
            name: this._name,
            active: this._active,
            x: trs[0],
            y: trs[1],
            width: this._contentSize?.width ?? 0,
            height: this._contentSize?.height ?? 0,
            anchorX: this._anchorPoint?.x ?? 0.5,
            anchorY: this._anchorPoint?.y ?? 0.5,
            scaleX: trs[7],
            scaleY: trs[8],
            rotation: this._eulerAngles?.z ?? 0,
            opacity: this._opacity ?? 255,
            color: this._color ? `#${this._color.r.toString(16).padStart(2, '0')}${this._color.g.toString(16).padStart(2, '0')}${this._color.b.toString(16).padStart(2, '0')}` : '#ffffff'
        };
    }
    setProp(props) {
        if (props.name !== undefined)
            this._name = props.name;
        if (props.active !== undefined)
            this._active = props.active;
        if (props.x !== undefined)
            this._trs.array[0] = props.x;
        if (props.y !== undefined)
            this._trs.array[1] = props.y;
        if (props.width !== undefined)
            this._contentSize.width = props.width;
        if (props.height !== undefined)
            this._contentSize.height = props.height;
        if (props.anchorX !== undefined)
            this._anchorPoint.x = props.anchorX;
        if (props.anchorY !== undefined)
            this._anchorPoint.y = props.anchorY;
        if (props.scaleX !== undefined)
            this._trs.array[7] = props.scaleX;
        if (props.scaleY !== undefined)
            this._trs.array[8] = props.scaleY;
        if (props.rotation !== undefined) {
            this._trs.array[5] = props.rotation * Math.PI / 180;
            this._eulerAngles.z = props.rotation;
        }
        if (props.opacity !== undefined)
            this._opacity = props.opacity;
        return this;
    }
    toJSON(indexMap) {
        const parent = this._parent ? (indexMap ? { __id__: indexMap.get(this._parent) } : this._parent) : null;
        const children = indexMap ? this._children.map(c => ({ __id__: indexMap.get(c) })) : this._children;
        const components = indexMap ? this._components.map(c => ({ __id__: indexMap.get(c) })) : this._components;
        const prefab = this._prefab ? (indexMap ? { __id__: indexMap.get(this._prefab) } : this._prefab) : null;
        return {
            __type__: this.__type__,
            _name: this._name,
            _objFlags: this._objFlags,
            _parent: parent,
            _children: children,
            _active: this._active,
            _components: components,
            _prefab: prefab,
            _opacity: this._opacity,
            _color: this._color.toJSON(),
            _contentSize: this._contentSize.toJSON(),
            _anchorPoint: this._anchorPoint.toJSON(),
            _trs: this._trs.toJSON(),
            _eulerAngles: this._eulerAngles.toJSON(),
            _skewX: this._skewX,
            _skewY: this._skewY,
            _is3DNode: this._is3DNode,
            _groupIndex: this._groupIndex,
            groupIndex: this.groupIndex,
            _id: this._id
        };
    }
}
