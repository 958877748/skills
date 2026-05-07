#!/usr/bin/env node

import { loadScene, loadScriptMap, findNodeIndex } from './lib/fire-utils.js';
import { getNodeState } from './lib/node-utils.js';
import { findProjectRoot, outputJson, outputError } from './lib/utils.js';
import * as fs from 'fs';
import * as path from 'path';

const isDirectRun = process.argv[1]?.endsWith('get.js');
if (isDirectRun) {
  run(process.argv.slice(2));
}

function extractComponentProps(comp) {
  const props = {};
  for (const [key, val] of Object.entries(comp)) {
    if (key === 'node' || key === '__type__' || key === '_name' || key === '_objFlags' || key === '_id') continue;
    if (val && typeof val === 'object' && val.__id__ !== undefined) continue;
    if (val && typeof val === 'object' && val.__uuid__ !== undefined) {
      props[key] = val.__uuid__;
    } else if (val && typeof val === 'object' && val.__type__) {
      const simple = {};
      for (const [k, v] of Object.entries(val)) {
        if (k !== '__type__') simple[k] = v;
      }
      props[key] = simple;
    } else {
      props[key] = val;
    }
  }
  return props;
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
  const withCC = 'cc.' + typeName;
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

export function run(args) {
  const filePath = args[0];
  const nodePath = args[1];
  const third = args[2];

  if (!filePath || filePath.startsWith('--')) {
    outputError('用法: cocos2d-cli get <文件> <节点路径> [属性名|组件类型]');
    return;
  }

  try {
    const data = loadScene(filePath);
    if (!data || data.length === 0) {
      outputError('文件为空或格式错误');
      return;
    }

    const idx = findNodeIndex(data, nodePath || '');
    if (idx === -1) {
      outputError(`节点未找到: ${nodePath}`);
      return;
    }

    const node = data[idx];

    const groups = loadGroupList(filePath);

    if (!third) {
      const state = getNodeState(node, groups);
      outputJson(state);
      return;
    }

    const comp = findComponent(data, idx, third, loadScriptMap(filePath));
    if (comp) {
      const props = extractComponentProps(comp);
      outputJson(props);
      return;
    }

    const state = getNodeState(node, groups);
    if (third in state) {
      outputJson({ [third]: state[third] });
      return;
    }

    outputJson({ [third]: node['_' + third] ?? node[third] ?? undefined });
  } catch (err) {
    outputError(err.message);
  }
}

function loadGroupList(filePath) {
  try {
    const root = findProjectRoot(filePath);
    if (!root) return null;
    const configPath = path.join(root, 'settings', 'project.json');
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);
    return config['group-list'] || null;
  } catch {
    return null;
  }
}
