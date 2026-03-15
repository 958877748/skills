import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function run(args: string[]): void {
    console.log(JSON.stringify({ args }));
}
