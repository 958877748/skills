import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function build() {
  // Ensure dist directory exists
  if (!existsSync(join(__dirname, 'dist'))) {
    mkdirSync(join(__dirname, 'dist'), { recursive: true });
  }

  // Build the main entry point
  await esbuild.build({
    entryPoints: [join(__dirname, 'src/index.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: join(__dirname, 'dist/index.js'),
    banner: {
      js: 'import { createRequire } from "module";const require = createRequire(import.meta.url);'
    },
    sourcemap: true,
    minify: false,
  });

  // Copy bin file
  copyFileSync(
    join(__dirname, 'bin/agents.js'),
    join(__dirname, 'dist/agents.js')
  );

  // Copy templates
  if (!existsSync(join(__dirname, 'dist/templates'))) {
    mkdirSync(join(__dirname, 'dist/templates'), { recursive: true });
  }
  copyFileSync(
    join(__dirname, 'templates/default-agent.md'),
    join(__dirname, 'dist/templates/default-agent.md')
  );

  console.log('Build complete!');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
