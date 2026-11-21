import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';

const [html, css, license, bundle] = await Promise.all([
  readFile('src/index.html', 'utf8'),
  readFile('src/styles.css', 'utf8'),
  readFile('node_modules/three/LICENSE', 'utf8'),
  build({ entryPoints: ['src/game.js'], bundle: true, minify: true, write: false, format: 'iife', legalComments: 'inline' }),
]);

const page = html
  .replace('<!-- BUILD:STYLE -->', () => `<style>${css}</style>`)
  .replace('<!-- BUILD:GAME -->', () => `<script>/*!\n${license.trim()}\n*/\n${bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>`);

await mkdir('dist', { recursive: true });
await Promise.all([
  writeFile('dist/index.html', page),
  writeFile('dist/THREE-LICENSE.txt', license),
]);
console.log('Built dist/index.html. Open it directly in a WebGL 2 capable browser.');
