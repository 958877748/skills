const CCObject = require('./CCObject');
const { generateUUID } = require('../utils');

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
        this._color = { __type__: 'cc.Color', r: 255, g: 255, b: 255, a: 255 };
        this._contentSize = { __type__: 'cc.Size', width: 0, height: 0 };
        this._anchorPoint = { __type__: 'cc.Vec2', x: 0.5, y: 0.5 };
        
        // 变换属性
        this._trs = { __type__: 'TypedArray', ctor: 'Float64Array', array: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] };
        this._eulerAngles = { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 };
        this._skewX = 0;
        this._skewY = 0;
        this._is3DNode = false;
        
        // 分组
        this._groupIndex = 0;
        this.groupIndex = 0;
        
        // 唯一标识
        this._id = generateUUID();
    }

    /**
     * 设置位置
     */
    setPosition(x, y) {
        this._trs.array[0] = x;
        this._trs.array[1] = y;
        return this;
    }

    /**
     * 设置大小
     */
    setContentSize(width, height) {
        this._contentSize.width = width;
        this._contentSize.height = height;
        return this;
    }

    /**
     * 设置锚点
     */
    setAnchorPoint(x, y) {
        this._anchorPoint.x = x;
        this._anchorPoint.y = y;
        return this;
    }

    /**
     * 设置缩放
     */
    setScale(x, y = x) {
        this._trs.array[7] = x;
        this._trs.array[8] = y;
        return this;
    }

    /**
     * 设置旋转（角度）
     */
    setRotation(angle) {
        this._trs.array[5] = angle * Math.PI / 180;
        this._eulerAngles.z = angle;
        return this;
    }

    /**
     * 设置颜色
     */
    setColor(r, g, b, a = 255) {
        this._color.r = r;
        this._color.g = g;
        this._color.b = b;
        this._color.a = a;
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
}

module.exports = CCNode;
