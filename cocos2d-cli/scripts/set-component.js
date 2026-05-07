#!/usr/bin/env node

import { loadScene, saveScene, findNodeIndex, loadScriptMap } from './lib/fire-utils.js';
import { outputJson, outputError } from './lib/utils.js';
import CCCanvas from './lib/cc/CCCanvas.js';
import CCWidget from './lib/cc/CCWidget.js';
import CCCamera from './lib/cc/CCCamera.js';
import CCSprite from './lib/cc/CCSprite.js';
import CCLabel from './lib/cc/CCLabel.js';
import CCButton from './lib/cc/CCButton.js';
import CCLayout from './lib/cc/CCLayout.js';
import CCRichText from './lib/cc/CCRichText.js';

const COMPONENT_CLASSES = {
    'cc.Canvas': CCCanvas,
    'cc.Widget': CCWidget,
    'cc.Camera': CCCamera,
    'cc.Sprite': CCSprite,
    'cc.Label': CCLabel,
    'cc.Button': CCButton,
    'cc.Layout': CCLayout,
    'cc.RichText': CCRichText
};

const isDirectRun = process.argv[1]?.endsWith('set-component.js');
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
    spritesd: 'cc.SpriteAtlas',
    animation: 'cc.Animation',
    audiosource: 'cc.AudioSource',
    particlesystem: 'cc.ParticleSystem',
    mask: 'cc.Mask',
    scrollview: 'cc.ScrollView',
    editbox: 'cc.EditBox',
    toggle: 'cc.Toggle',
    togglecontainer: 'cc.ToggleContainer',
    progressbar: 'cc.ProgressBar',
    slider: 'cc.Slider',
    blockinputevents: 'cc.BlockInputEvents',
    motionstreak: 'cc.MotionStreak',
    collider: 'cc.Collider',
    rigidbody: 'cc.RigidBody',
    graphics: 'cc.Graphics',
    dragonbones: 'cc.DragonBones',
    spineskeleton: 'cc.SpineSkeleton',
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

function findComponent(data, nodeIdx, compType, scriptMap) {
  const node = data[nodeIdx];
  if (!node?._components) return null;

  const guessed = guessTypeName(compType);

  for (const ref of node._components) {
    const comp = data[ref.__id__];
    if (!comp) continue;

    if (comp.__type__ === guessed || comp.__type__ === compType) {
      return comp;
    }

    const display = getTypeDisplayName(comp.__type__, scriptMap);
    if (display.toLowerCase() === compType.toLowerCase()) {
      return comp;
    }
  }
  return null;
}

/**
 * set-component 命令 - 修改节点上组件的属性
 * @module commands/set-component
 * @param {string[]} args - [文件路径] [节点路径] [组件类型] [属性名] [值]
 */
export function run(args) {
    const filePath = args[0];
    const nodePath = args[1];
    const compType = args[2];
    const propName = args[3];
    const propValue = args[4];

    if (!filePath || !nodePath || !compType || !propName || propValue === undefined) {
        outputError('用法: cocos2d-cli set-component <文件> <节点路径> <组件类型> <属性名> <值>');
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

        const scriptMap = loadScriptMap(filePath);
        const comp = findComponent(data, idx, compType, scriptMap);

        if (!comp) {
            outputError(`组件未找到: ${compType}`);
            return;
        }

        let valueToSet = propValue;
        if (valueToSet === 'true') valueToSet = true;
        else if (valueToSet === 'false') valueToSet = false;
        else if (valueToSet !== '' && !isNaN(Number(valueToSet))) valueToSet = Number(valueToSet);

        const ComponentClass = COMPONENT_CLASSES[comp.__type__];

        if (ComponentClass) {
            // 1. 面向对象模式：反序列化为类实例
            const instance = new ComponentClass();
            Object.assign(instance, comp); // Hydrate 原始数据
            
            // 2. 调用类的专属 setProp 逻辑
            instance.setProp({ [propName]: valueToSet });
            
            // 3. 序列化并回填到原始数据，保留未定义的扩展字段
            const result = instance.toJSON();
            Object.assign(comp, result);
        } else {
            // 兜底模式：直接修改底层 JSON 数据
            let handled = false;
            if (comp.__type__ === 'cc.Label' && propName === 'string') {
                if ('_string' in comp) comp['_string'] = valueToSet;
                if ('_N$string' in comp) comp['_N$string'] = valueToSet;
                handled = true;
            }
            
            if (!handled) {
                let found = false;
                if (`_${propName}` in comp) {
                    comp[`_${propName}`] = valueToSet;
                    found = true;
                }
                if (`_N$${propName}` in comp) {
                    comp[`_N$${propName}`] = valueToSet;
                    found = true;
                }
                if (!found) {
                    comp[propName] = valueToSet;
                }
            }
        }

        saveScene(filePath, data);
        outputJson({ success: true, message: `成功修改 ${nodePath} 上 ${compType} 的 ${propName} 属性` });
    } catch (err) {
        outputError(err.message);
    }
}
