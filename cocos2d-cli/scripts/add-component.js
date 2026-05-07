#!/usr/bin/env node

import { loadScene, saveScene, findNodeIndex } from './lib/fire-utils.js';
import { outputJson, outputError, generateId } from './lib/utils.js';

const isDirectRun = process.argv[1]?.endsWith('add-component.js');
if (isDirectRun) {
  run(process.argv.slice(2));
}

/**
 * add-component 命令 - 给节点添加组件
 * @module commands/add-component
 * @param {string[]} args - [文件路径] [节点路径] [组件类型]
 */
export function run(args) {
    const filePath = args[0];
    const nodePath = args[1];
    const compType = args[2];

    if (!filePath || !nodePath || !compType) {
        outputError('用法: cocos2d-cli add-component <文件> <节点路径> <组件类型>');
        return;
    }

    try {
        const data = loadScene(filePath);
        if (!data || data.length === 0) {
            outputError('文件为空或格式错误');
            return;
        }

        const idx = findNodeIndex(data, nodePath);
        if (idx === -1) {
            outputError(`节点未找到: ${nodePath}`);
            return;
        }

        const node = data[idx];
        const typeLower = compType.toLowerCase();
        let compData = null;

        if (typeLower === 'sprite') {
            compData = {
                __type__: 'cc.Sprite',
                _name: '',
                _objFlags: 0,
                node: { __id__: idx },
                _enabled: true,
                _materials: [{ "__uuid__": "eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432" }],
                _srcBlendFactor: 770,
                _dstBlendFactor: 771,
                _spriteFrame: { "__uuid__": "a23235d1-15db-4b95-8439-a2e005bfff91" },
                _type: 0,
                _sizeMode: 0,
                _fillType: 0,
                _fillCenter: { __type__: "cc.Vec2", x: 0, y: 0 },
                _fillStart: 0,
                _fillRange: 0,
                _isTrimmedMode: true,
                _atlas: null,
                _id: generateId()
            };
        } else if (typeLower === 'label') {
            compData = {
                __type__: 'cc.Label',
                _name: '',
                _objFlags: 0,
                node: { __id__: idx },
                _enabled: true,
                _materials: [{ "__uuid__": "eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432" }],
                _srcBlendFactor: 770,
                _dstBlendFactor: 771,
                _useOriginalSize: false,
                _string: 'Label',
                _N$string: 'Label',
                _fontSize: 40,
                _lineHeight: 40,
                _enableWrapText: true,
                _N$file: null,
                _isSystemFontUsed: true,
                _spacingX: 0,
                _batchAsBitmap: false,
                _styleFlags: 0,
                _underlineHeight: 0,
                _N$horizontalAlign: 1,
                _N$verticalAlign: 1,
                _N$fontFamily: "Arial",
                _N$overflow: 0,
                _N$cacheMode: 0,
                _id: generateId()
            };
        } else if (typeLower === 'button') {
            compData = {
                __type__: 'cc.Button',
                _name: '',
                _objFlags: 0,
                node: { __id__: idx },
                _enabled: true,
                _transition: 2,
                transition: 2,
                _interactable: true,
                _N$target: { __id__: idx },
                clickEvents: [],
                _id: generateId()
            };
        } else if (typeLower === 'canvas') {
            compData = {
                __type__: 'cc.Canvas',
                _name: '',
                _objFlags: 0,
                node: { __id__: idx },
                _enabled: true,
                _designResolution: {
                    __type__: "cc.Size",
                    width: 750,
                    height: 1334
                },
                _fitWidth: false,
                _fitHeight: true,
                _id: generateId()
            };
        } else if (typeLower === 'widget') {
             compData = {
                __type__: 'cc.Widget',
                _name: '',
                _objFlags: 0,
                node: { __id__: idx },
                _enabled: true,
                alignMode: 1,
                _target: null,
                _alignFlags: 0,
                _left: 0,
                _right: 0,
                _top: 0,
                _bottom: 0,
                _verticalCenter: 0,
                _horizontalCenter: 0,
                _isAbsLeft: true,
                _isAbsRight: true,
                _isAbsTop: true,
                _isAbsBottom: true,
                _isAbsHorizontalCenter: true,
                _isAbsVerticalCenter: true,
                _originalWidth: 0,
                _originalHeight: 0,
                _id: generateId()
            };
        } else if (typeLower === 'camera') {
            compData = {
                __type__: 'cc.Camera',
                _name: '',
                _objFlags: 0,
                node: { __id__: idx },
                _enabled: true,
                _cullingMask: 4294967295,
                _clearFlags: 7,
                _backgroundColor: { __type__: "cc.Color", r: 0, g: 0, b: 0, a: 255 },
                _depth: -1,
                _zoomRatio: 1,
                _targetTexture: null,
                _fov: 60,
                _orthoSize: 10,
                _nearClip: 1,
                _farClip: 4096,
                _ortho: true,
                _rect: { __type__: "cc.Rect", x: 0, y: 0, width: 1, height: 1 },
                _id: generateId()
            };
        } else {
            outputError(`暂不支持添加该类型的组件: ${compType}`);
            return;
        }

        const compIdx = data.length;
        data.push(compData);
        if (!node._components) node._components = [];
        node._components.push({ __id__: compIdx });

        saveScene(filePath, data);
        outputJson({ success: true, message: `成功添加组件: ${compType}` });
    } catch (err) {
        outputError(err.message);
    }
}
