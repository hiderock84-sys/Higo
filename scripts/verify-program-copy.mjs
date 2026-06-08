#!/usr/bin/env node
/**
 * プログラム見出しの文言が古い表記に戻っていないか検証する。
 * 正本: リポジトリ直下の index.html
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = path.join(root, 'index.html');
const html = readFileSync(indexPath, 'utf8');

const errors = [];

if (html.includes('program-section-title__main">一日の型<')) {
  errors.push('index.html: プログラム見出しが「一日の型」のままです →「ひごのいえの一日」に修正してください');
}

if (!html.includes('program-section-title__main">ひごのいえの一日<')) {
  errors.push('index.html: プログラム見出しに「ひごのいえの一日」がありません');
}

if (errors.length) {
  console.error('verify-program-copy: FAILED\n');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log('verify-program-copy: OK');
