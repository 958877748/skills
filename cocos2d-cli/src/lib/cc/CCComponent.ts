import CCObject from './CCObject.js';
import { generateId } from '../utils.js';

/**
 * Cocos Creator 组件基类
 */
export default class CCComponent extends CCObject {
    node: { __id__: number } | null;
    _enabled: boolean;
    _id: string;

    constructor() {
        super('');
        this.__type__ = 'cc.Component';

        // 关联的节点
        this.node = null;

        // 启用状态
        this._enabled = true;

        // 唯一标识（22位压缩格式）
        this._id = generateId();
    }

    /**
     * 设置节点引用
     */
    setNode(nodeIndex: number): this {
        this.node = { __id__: nodeIndex };
        return this;
    }

    /**
     * 获取属性（子类重写）
     */
    getProp(): Record<string, any> {
        return {
            class: this.__type__,
            enabled: this._enabled
        };
    }

    /**
     * 设置属性（子类重写）
     */
    setProp(props: Record<string, any>): this {
        if (props.enabled !== undefined) this._enabled = props.enabled;
        return this;
    }

    toJSON(): Record<string, any> {
        return {
            __type__: this.__type__,
            _name: this._name,
            _objFlags: this._objFlags,
            node: this.node,
            _enabled: this._enabled,
            _id: this._id
        };
    }
}
