import * as path from 'path';
import * as fs from 'fs';
import CCSceneAsset from '../lib/cc/CCSceneAsset.js';
import { CCPrefab } from '../lib/cc/CCPrefab.js';
import CCCanvas from '../lib/cc/CCCanvas.js';
import CCWidget from '../lib/cc/CCWidget.js';
import CCSprite from '../lib/cc/CCSprite.js';
import CCLabel from '../lib/cc/CCLabel.js';
import CCButton from '../lib/cc/CCButton.js';
import CCCamera from '../lib/cc/CCCamera.js';
import { buildTree } from '../lib/node-utils.js';
import { loadScriptMap, isPrefab } from '../lib/fire-utils.js';

export function run(args: string[]): void {
    console.log(JSON.stringify({ args }));
}
