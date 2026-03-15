import * as fs from 'fs';
import * as path from 'path';
import CCNode from '../lib/cc/CCNode.js';
import CCScene from '../lib/cc/CCScene.js';
import CCSceneAsset from '../lib/cc/CCSceneAsset.js';
import CCCanvas from '../lib/cc/CCCanvas.js';
import CCWidget from '../lib/cc/CCWidget.js';
import CCCamera from '../lib/cc/CCCamera.js';
import { buildTree } from '../lib/node-utils.js';
import { loadScriptMap, createSceneMeta, saveMetaFile } from '../lib/fire-utils.js';
import { generateUUID, generateCompressedUUID } from '../lib/utils.js';
import { fromJSON } from '../lib/json-parser.js';

export function run(args: string[]): void {
    console.log(JSON.stringify({ args }));
}
