#!/usr/bin/env node
/**
 * 表紙ランディング（PR #24 方針）の構造が崩れていないか検証する。
 * - 全文セクションは landing-heavy（表紙では非表示）
 * - 要約のみ landing-only（表紙でのみ表示）
 * - 回復支援の全体像(route-summary)は表紙から削除済み
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'public/static/style.css'), 'utf8');
const errors = [];

if (!html.includes('mobile-menu-overview') && !html.includes('landing-only landing-overview')) {
  errors.push('「支援のかたち」(landing-overview) がハンバーガーメニューまたは表紙にありません');
}

if (html.includes('navigation-section') && html.includes('id="page-menu"')) {
  errors.push('ページメニュー(navigation-section) が残っています（表紙から削除済みのはず）');
}

if (/id="route-summary"[^>]*landing-heavy|route-summary landing-heavy/.test(html)) {
  errors.push('回復支援の全体像(route-summary) に landing-heavy が付いています（表紙で非表示になる）');
}

function sectionTag(id) {
  const re = new RegExp(`<section[^>]+id="${id}"[^>]*>`, 'i');
  return html.match(re)?.[0] ?? null;
}

for (const id of ['program', 'rapport', 'grouphome', 'blog', 'staff', 'family-guide']) {
  const tag = sectionTag(id);
  if (!tag) {
    errors.push(`#${id} セクションが見つかりません`);
  } else if (!tag.includes('landing-heavy')) {
    errors.push(`#${id} に landing-heavy がありません（表紙で全文が表示されます）`);
  }
}

if (!html.includes('intro-message site-copy landing-heavy')) {
  errors.push('回復を支える実践サイクル(intro-message) に landing-heavy がありません');
}

if (!html.includes('compact-testimonial-wrap')) {
  errors.push('体験談ハイライト(compact-testimonial-wrap) がありません');
}

if (!css.includes('body.is-landing .visual-card:not(:first-child)')) {
  errors.push('表紙で風景写真を1枚に絞る CSS がありません');
}

if (!css.includes('body.is-landing .landing-heavy')) {
  errors.push('landing-heavy 非表示用の CSS がありません');
}

if (errors.length > 0) {
  console.error('verify-landing-structure: FAILED');
  for (const msg of errors) {
    console.error(`  - ${msg}`);
  }
  process.exit(1);
}

console.log('verify-landing-structure: OK');
