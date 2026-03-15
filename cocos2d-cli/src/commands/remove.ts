import * as path from 'path';
import * as fs from 'fs';
import CCSceneAsset from '../lib/cc/CCSceneAsset.js';
import { CCPrefab } from '../lib/cc/CCPrefab.js';
import { buildTree } from '../lib/node-utils.js';
import { loadScriptMap, isPrefab } from '../lib/fire-utils.js';

export function run(args: string[]): void {
    console.log(JSON.stringify({ args }));
}
