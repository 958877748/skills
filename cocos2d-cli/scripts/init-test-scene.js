#!/usr/bin/env node
/**
 * 生成一个与 Cocos Creator 编辑器新建场景格式完全一致的干净 .fire 文件
 * 结构: cc.SceneAsset → cc.Scene → Canvas(cc.Canvas+cc.Widget) → Main Camera(cc.Camera)
 */
import * as fs from 'fs';
import * as crypto from 'crypto';

function genId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let r = '';
  for (let i = 0; i < 22; i++) r += chars[Math.floor(Math.random() * 64)];
  return r;
}

const outPath = process.argv[2] || 'NewProject/assets/cli-test.fire';

const sceneId   = crypto.randomUUID();
const canvasId  = genId();
const cameraId  = genId();
const camCompId = genId();
const ccCanvasId = genId();
const ccWidgetId = genId();

const data = [
  {
    __type__: 'cc.SceneAsset',
    _name: '',
    _objFlags: 0,
    _native: '',
    scene: { __id__: 1 }
  },
  {
    __type__: 'cc.Scene',
    _objFlags: 0,
    _parent: null,
    _children: [{ __id__: 2 }],
    _active: true,
    _components: [],
    _prefab: null,
    _opacity: 255,
    _color: { __type__: 'cc.Color', r: 255, g: 255, b: 255, a: 255 },
    _contentSize: { __type__: 'cc.Size', width: 0, height: 0 },
    _anchorPoint: { __type__: 'cc.Vec2', x: 0, y: 0 },
    _trs: { __type__: 'TypedArray', ctor: 'Float64Array', array: [0,0,0,0,0,0,1,1,1,1] },
    _is3DNode: true,
    _groupIndex: 0,
    groupIndex: 0,
    autoReleaseAssets: false,
    _id: sceneId
  },
  {
    __type__: 'cc.Node',
    _name: 'Canvas',
    _objFlags: 0,
    _parent: { __id__: 1 },
    _children: [{ __id__: 3 }],
    _active: true,
    _components: [{ __id__: 4 }, { __id__: 5 }],
    _prefab: null,
    _opacity: 255,
    _color: { __type__: 'cc.Color', r: 255, g: 255, b: 255, a: 255 },
    _contentSize: { __type__: 'cc.Size', width: 960, height: 640 },
    _anchorPoint: { __type__: 'cc.Vec2', x: 0.5, y: 0.5 },
    _trs: { __type__: 'TypedArray', ctor: 'Float64Array', array: [480,320,0,0,0,0,1,1,1,1] },
    _eulerAngles: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
    _skewX: 0,
    _skewY: 0,
    _is3DNode: false,
    _groupIndex: 0,
    groupIndex: 0,
    _id: canvasId
  },
  {
    __type__: 'cc.Node',
    _name: 'Main Camera',
    _objFlags: 0,
    _parent: { __id__: 2 },
    _children: [],
    _active: true,
    _components: [{ __id__: 6 }],
    _prefab: null,
    _opacity: 255,
    _color: { __type__: 'cc.Color', r: 255, g: 255, b: 255, a: 255 },
    _contentSize: { __type__: 'cc.Size', width: 0, height: 0 },
    _anchorPoint: { __type__: 'cc.Vec2', x: 0.5, y: 0.5 },
    _trs: { __type__: 'TypedArray', ctor: 'Float64Array', array: [0,0,0,0,0,0,1,1,1,1] },
    _eulerAngles: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
    _skewX: 0,
    _skewY: 0,
    _is3DNode: false,
    _groupIndex: 0,
    groupIndex: 0,
    _id: cameraId
  },
  {
    __type__: 'cc.Canvas',
    _name: '',
    _objFlags: 0,
    node: { __id__: 2 },
    _enabled: true,
    _designResolution: { __type__: 'cc.Size', width: 960, height: 640 },
    _fitWidth: false,
    _fitHeight: true,
    _id: ccCanvasId
  },
  {
    __type__: 'cc.Widget',
    _name: '',
    _objFlags: 0,
    node: { __id__: 2 },
    _enabled: true,
    alignMode: 1,
    _target: null,
    _alignFlags: 45,
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
    _id: ccWidgetId
  },
  {
    __type__: 'cc.Camera',
    _name: '',
    _objFlags: 0,
    node: { __id__: 3 },
    _enabled: true,
    _cullingMask: 4294967295,
    _clearFlags: 7,
    _backgroundColor: { __type__: 'cc.Color', r: 0, g: 0, b: 0, a: 255 },
    _depth: -1,
    _zoomRatio: 1,
    _targetTexture: null,
    _fov: 60,
    _orthoSize: 10,
    _nearClip: 1,
    _farClip: 4096,
    _ortho: true,
    _rect: { __type__: 'cc.Rect', x: 0, y: 0, width: 1, height: 1 },
    _renderStages: 1,
    _alignWithScreen: true,
    _id: camCompId
  }
];

fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
console.log(JSON.stringify({ success: true, outputPath: outPath }));
