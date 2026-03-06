const CCObject = require('./CCObject');
const CCColor = require('./CCColor');
const CCSize = require('./CCSize');
const CCVec2 = require('./CCVec2');
const CCVec3 = require('./CCVec3');
const CCTrs = require('./CCTrs');

/**
 * Cocos Creator 节点类
 */
class CCNode extends CCObject {
    constructor(name = 'Node') {
        super(name);
        this.__type__ = 'cc.Node';
        
        // 父子关系
        this._parent = null;
        this._children = [];
        
        // 激活状态
        this._active = true;
        
        // 组件列表
        this._components = [];
        
        // 预制体信息
        this._prefab = null;
        
        // 显示属性
        this._opacity = 255;
        this._color = new CCColor();
        this._contentSize = new CCSize();
        this._anchorPoint = new CCVec2(0.5, 0.5);
        
        // 变换属性
        this._trs = new CCTrs();
        this._eulerAngles = new CCVec3();
        this._skewX = 0;
        this._skewY = 0;
        this._is3DNode = false;
        
        // 分组
        this._groupIndex = 0;
        this.groupIndex = 0;
        
        // 唯一标识（预制体中为空，场景中生成）
        this._id = '';
    }

    /**
     * 设置 ID
     */
    setId(id) {
        this._id = id;
        return this;
    }

    // Position getters/setters
    get x() { return this._trs.x; }
    set x(v) { this._trs.x = v; }

    get y() { return this._trs.y; }
    set y(v) { this._trs.y = v; }

    // Scale getters/setters
    get scaleX() { return this._trs.scaleX; }
    set scaleX(v) { this._trs.scaleX = v; }

    get scaleY() { return this._trs.scaleY; }
    set scaleY(v) { this._trs.scaleY = v; }

    // Size getters/setters
    get width() { return this._contentSize.width; }
    set width(v) { this._contentSize.width = v; }

    get height() { return this._contentSize.height; }
    set height(v) { this._contentSize.height = v; }

    // Anchor getters/setters
    get anchorX() { return this._anchorPoint.x; }
    set anchorX(v) { this._anchorPoint.x = v; }

    get anchorY() { return this._anchorPoint.y; }
    set anchorY(v) { this._anchorPoint.y = v; }

    /**
     * 设置位置
     */
    setPosition(x, y) {
        this._trs.setPosition(x, y);
        return this;
    }

    /**
     * 设置大小
     */
    setContentSize(width, height) {
        this._contentSize.set(width, height);
        return this;
    }

    /**
     * 设置锚点
     */
    setAnchorPoint(x, y) {
        this._anchorPoint.set(x, y);
        return this;
    }

    /**
     * 设置缩放
     */
    setScale(x, y = x) {
        this._trs.setScale(x, y);
        return this;
    }

    /**
     * 设置旋转（角度）
     */
    setRotation(angle) {
        this._trs.rotZ = angle * Math.PI / 180;
        this._eulerAngles.z = angle;
        return this;
    }

    /**
     * 设置颜色
     */
    setColor(r, g, b, a = 255) {
        this._color.set(r, g, b, a);
        return this;
    }

    /**
     * 设置透明度
     */
    setOpacity(opacity) {
        this._opacity = opacity;
        return this;
    }

    /**
     * 设置激活状态
     */
    setActive(active) {
        this._active = active;
        return this;
    }

    /**
     * 设置父节点索引
     */
    setParent(parentIndex) {
        this._parent = { __id__: parentIndex };
        return this;
    }

    /**
     * 添加子节点索引
     */
    addChild(childIndex) {
        this._children.push({ __id__: childIndex });
        return this;
    }

    /**
     * 添加组件索引
     */
    addComponent(compIndex) {
        this._components.push({ __id__: compIndex });
        return this;
    }

    /**
     * 转换为属性面板显示格式（人类可读）
     */
    toPanelJSON() {
        const trs = this._trs?.array || [0, 0, 0, 0, 0, 0, 1, 1, 1, 1];
        const result = {
            name: this._name,
            active: this._active,
            position: { x: trs[0], y: trs[1] },
            rotation: this._eulerAngles?.z ?? 0,
            scale: { x: trs[7], y: trs[8] },
            anchor: { x: this._anchorPoint?.x ?? 0.5, y: this._anchorPoint?.y ?? 0.5 },
            size: { w: this._contentSize?.width ?? 0, h: this._contentSize?.height ?? 0 },
            color: this._color ? `#${this._color.r.toString(16).padStart(2,'0')}${this._color.g.toString(16).padStart(2,'0')}${this._color.b.toString(16).padStart(2,'0')}` : '#ffffff',
            opacity: this._opacity ?? 255,
            skew: { x: this._skewX ?? 0, y: this._skewY ?? 0 },
            group: this._groupIndex ?? 0
        };
        
        // 组件列表
        if (this._components && this._components.length > 0) {
            result.components = {};
            this._components.forEach(c => {
                const typeName = c.__type__.replace('cc.', '');
                result.components[typeName] = c.toPanelJSON ? c.toPanelJSON() : {};
            });
        }
        
        return result;
    }

    toJSON() {
        // 显式控制属性顺序
        return {
            __type__: this.__type__,
            _name: this._name,
            _objFlags: this._objFlags,
            _parent: this._parent,
            _children: this._children,
            _active: this._active,
            _components: this._components,
            _prefab: this._prefab,
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

module.exports = CCNode;