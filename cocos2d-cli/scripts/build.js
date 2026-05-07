/**
 * build 命令 - 构建脚本组件映射
 * @module commands/build
 * @param {string[]} args - [项目目录]
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export function run(args) {
    console.log(JSON.stringify({ args }));
}
