#!/usr/bin/env node

import { loadScene, saveScene, findNodeIndex } from './lib/fire-utils.js';
import { createNodeData, setNodeProperty } from './lib/node-utils.js';
import { outputJson, outputError, generateId } from './lib/utils.js';

const isDirectRun = process.argv[1]?.endsWith('add.js');
if (isDirectRun) {
  run(process.argv.slice(2));
}

function parseOptions(args) {
    const options = {};
    for (const arg of args) {
        if (arg.startsWith('--')) {
            const parts = arg.slice(2).split('=');
            const key = parts[0];
            const value = parts.length > 1 ? parts.slice(1).join('=') : true;
            options[key] = value;
        }
    }
    return options;
}

/**
 * add 命令 - 在指定父节点下添加新节点
 * @module commands/add
 * @param {string[]} args - [文件路径] [父节点路径] [节点名称] [选项]
 */
export function run(args) {
    const filePath = args[0];
    const parentPath = args[1];
    const nodeName = args[2];

    if (!filePath || !parentPath || !nodeName || nodeName.startsWith('--')) {
        outputError('用法: cocos2d-cli add <文件> <父节点路径> <节点名称> [选项]');
        return;
    }

    const options = parseOptions(args.slice(3));

    try {
        const data = loadScene(filePath);
        if (!data || data.length === 0) {
            outputError('文件为空或格式错误');
            return;
        }

        const parentIdx = findNodeIndex(data, parentPath);
        if (parentIdx === -1) {
            outputError(`父节点未找到: ${parentPath}`);
            return;
        }

        const parentNode = data[parentIdx];

        // 1. 创建新节点
        const newNode = createNodeData(nodeName);

        // 2. 设置节点基础属性
        const baseProps = ['x', 'y', 'width', 'height', 'scaleX', 'scaleY', 'rotation', 'active'];
        for (const prop of baseProps) {
            if (options[prop] !== undefined) {
                setNodeProperty(newNode, prop, options[prop]);
            }
        }

        // 3. 将新节点加入 data 数组
        const newNodeIdx = data.length;
        data.push(newNode);

        // 4. 建立父子关系
        newNode._parent = { __id__: parentIdx };
        if (!parentNode._children) parentNode._children = [];
        parentNode._children.push({ __id__: newNodeIdx });

        // 5. 根据 --type 添加组件
        if (options.type) {
            const typeLower = options.type.toLowerCase();
            let compData = null;
            
            if (typeLower === 'sprite') {
                compData = {
                    __type__: 'cc.Sprite',
                    _name: '',
                    _objFlags: 0,
                    node: { __id__: newNodeIdx },
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
                    node: { __id__: newNodeIdx },
                    _enabled: true,
                    _materials: [{ "__uuid__": "eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432" }],
                    _srcBlendFactor: 770,
                    _dstBlendFactor: 771,
                    _useOriginalSize: false,
                    _string: options.string || 'Label',
                    _N$string: options.string || 'Label',
                    _fontSize: options.fontSize ? parseInt(options.fontSize) : 40,
                    _lineHeight: options.fontSize ? parseInt(options.fontSize) : 40,
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
                    node: { __id__: newNodeIdx },
                    _enabled: true,
                    _transition: 2,
                    transition: 2,
                    _interactable: true,
                    _N$target: { __id__: newNodeIdx },
                    clickEvents: [],
                    _id: generateId()
                };
            }

            if (compData) {
                const compIdx = data.length;
                data.push(compData);
                newNode._components.push({ __id__: compIdx });
            }
        }

        saveScene(filePath, data);
        outputJson({ success: true, message: `成功在 ${parentPath} 下添加节点: ${nodeName}` });
    } catch (err) {
        outputError(err.message);
    }
}
