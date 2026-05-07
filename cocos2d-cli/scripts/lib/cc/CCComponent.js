/**
 * Cocos Creator CCComponent 基类模拟
 * @module lib/cc/CCComponent
 */

import CCObject from './CCObject.js';
import { generateId } from '../utils.js';
export default class CCComponent extends CCObject {
    node;
    _enabled;
    _id;
    constructor() {
        super('');
        this.__type__ = 'cc.Component';
        this.node = null;
        this._enabled = true;
        this._id = generateId();
    }
    setNode(nodeIndex) {
        this.node = { __id__: nodeIndex };
        return this;
    }
    getProp() {
        return {
            class: this.__type__,
            enabled: this._enabled
        };
    }
    setProp(props) {
        if (props.enabled !== undefined)
            this._enabled = props.enabled;
        return this;
    }
    toJSON() {
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
