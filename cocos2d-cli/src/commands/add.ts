import * as path from 'path';
import * as fs from 'fs';
import CCNode from '../lib/cc/CCNode.js';
import CCSceneAsset from '../lib/cc/CCSceneAsset.js';
import { CCPrefab, CCPrefabInfo } from '../lib/cc/CCPrefab.js';
import CCCanvas from '../lib/cc/CCCanvas.js';
import CCWidget from '../lib/cc/CCWidget.js';
import CCSprite from '../lib/cc/CCSprite.js';
import CCLabel from '../lib/cc/CCLabel.js';
import CCButton from '../lib/cc/CCButton.js';
import { buildTree } from '../lib/node-utils.js';
import { loadScriptMap, isPrefab } from '../lib/fire-utils.js';
import { generateCompressedUUID } from '../lib/utils.js';

export function run(args: string[]): void {
    console.log(JSON.stringify({ args }));
}
