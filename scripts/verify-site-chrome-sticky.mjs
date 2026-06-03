#!/usr/bin/env node
/**
 * モバイルでハンバーガーがスクロールで消える回帰を検出する。
 * .site-chrome は全画面幅で position:sticky である必要がある（769px 限定は不可）。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = join(root, 'public/static/style.css');
const css = readFileSync(cssPath, 'utf8');

const errors = [];

if (
  /\.site-chrome\s*\{[^}]*position:\s*relative/s.test(css) &&
  !/\/\* 全画面幅で sticky 必須/.test(css.split('.site-chrome')[1]?.slice(0, 200) ?? '')
) {
  errors.push('.site-chrome に position:relative が指定されています（モバイルでヘッダーがスクロールアウトします）');
}

if (
  /@media\s*\(\s*min-width:\s*769px\s*\)\s*\{[^}]*\.site-chrome\s*\{[^}]*position:\s*sticky/s.test(css)
) {
  errors.push('.site-chrome の sticky が 769px 以上のメディアクエリ内だけにあります（モバイルで再発します）');
}

const chromeBlock = css.match(/\.site-chrome\s*\{[^}]+\}/s);
if (!chromeBlock || !/position:\s*sticky/.test(chromeBlock[0])) {
  errors.push('.site-chrome に position:sticky がありません');
}

if (errors.length) {
  console.error('verify-site-chrome-sticky: FAILED\n');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log('verify-site-chrome-sticky: OK');
