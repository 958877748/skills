#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distPath = join(__dirname, '..', 'dist', 'index.js');

const args = process.argv.slice(2);
const child = spawn('node', [distPath, ...args], {
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
