#!/usr/bin/env node

import { loadScene, saveScene, findNodeIndex, loadScriptMap } from './lib/fire-utils.js';
import { outputJson, outputError } from './lib/utils.js';

const isDirectRun = process.argv[1]?.endsWith('remove-component.js');
if (isDirectRun) {
  run(process.argv.slice(2));
}

function guessTypeName(typeName) {
  const builtin = {
    canvas: 'cc.Canvas',
    sprite: 'cc.Sprite',
    label: 'cc.Label',
    button: 'cc.Button',
    widget: 'cc.Widget',
    camera: 'cc.Camera',
    richtext: 'cc.RichText',
    layout: 'cc.Layout',
  };
  const lower = typeName.toLowerCase();
  if (builtin[lower]) return builtin[lower];
  return typeName;
}

function getTypeDisplayName(typeName, scriptMap) {
  if (scriptMap && scriptMap[typeName]) return scriptMap[typeName];
  if (typeName.startsWith('cc.')) return typeName.slice(3);
  return typeName;
}

/**
 * remove-component 命令 - 删除节点上的组件
 * @module commands/remove-component
 * @param {string[]} args - [文件路径] [节点路径] [组件类型]
 */
export function run(args) {
    const filePath = args[0];
    const nodePath = args[1];
    const compType = args[2];

    if (!filePath || !nodePath || !compType) {
        outputError('用法: cocos2d-cli remove-component <文件> <节点路径> <组件类型>');
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
        if (!node._components) {
             outputError(`节点上没有任何组件: ${nodePath}`);
             return;
        }

        const scriptMap = loadScriptMap(filePath);
        const guessed = guessTypeName(compType);
        
        let targetCompIdx = -1;
        let arrayIdx = -1;

        for (let i = 0; i < node._components.length; i++) {
            const ref = node._components[i];
            const comp = data[ref.__id__];
            if (!comp) continue;

            if (comp.__type__ === guessed || comp.__type__ === compType) {
                targetCompIdx = ref.__id__;
                arrayIdx = i;
                break;
            }

            const display = getTypeDisplayName(comp.__type__, scriptMap);
            if (display.toLowerCase() === compType.toLowerCase()) {
                targetCompIdx = ref.__id__;
                arrayIdx = i;
                break;
            }
        }

        if (targetCompIdx === -1) {
            outputError(`未在节点上找到组件: ${compType}`);
            return;
        }

        // 从节点组件列表中移除
        node._components.splice(arrayIdx, 1);
        
        // 在数据流中将其设为 null
        data[targetCompIdx] = null;

        saveScene(filePath, data);
        outputJson({ success: true, message: `成功删除组件: ${compType}` });
    } catch (err) {
        outputError(err.message);
    }
}
