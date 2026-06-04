#!/usr/bin/env node
/**
 * ランディングUIの「戻り」を検知する回帰テスト。
 * 正本: ルート index.html + public/static/style.css + public/static/hero-variants.css
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'public/static/style.css'), 'utf8');
const heroCss = readFileSync(join(root, 'public/static/hero-variants.css'), 'utf8');
const errors = [];

const requireMatch = (cond, msg) => {
  if (!cond) errors.push(msg);
};

requireMatch(!html.includes('id="page-menu"'), 'index.html に #page-menu が残っています（削除済みのはず）');
requireMatch(!html.includes('ページメニュー'), 'index.html に「ページメニュー」リンクが残っています');
requireMatch(!/<body[^>]*class="[^"]*is-landing/.test(html), 'body に is-landing を直書きしない（JS で付与）');
requireMatch(html.includes('clearPageViewState'), 'ルート切替 clearPageViewState() がありません');
requireMatch(html.includes('hero-actions--quad'), '表紙4ボタン hero-actions--quad がありません');
requireMatch(html.includes('id="concerns"'), 'お悩みセクション #concerns がありません');
requireMatch(html.includes('mobile-menu-overview'), 'モバイルメニュー写真カード overview がありません');
requireMatch(!html.includes('mobile-menu-contact'), 'ハンバーガー内お問い合わせブロックが残っています');
requireMatch(html.includes('landing-only landing-overview'), '「支援のかたち」landing-overview がありません');

requireMatch(css.split('\n').length >= 7800, `style.css が短すぎます（${css.split('\n').length} 行）。957c93c 以降の欠落の可能性`);
requireMatch((css.match(/concerns-section/g) ?? []).length >= 20, 'style.css に concerns-section スタイルが不足');
requireMatch(css.includes('hero-actions--quad'), 'style.css に hero-actions--quad がありません');
requireMatch(css.includes('.glass-btn') || css.includes('hero-action--glass'), 'style.css にガラスCTAスタイルがありません');
requireMatch(
  css.includes('上寄せ固定') || css.includes('上寄せ・密度'),
  'style.css に表紙上寄せブロックがありません',
);
requireMatch(css.includes('フッター：余白'), 'style.css にフッターコンパクトブロックがありません');
requireMatch(css.includes('body.is-landing .visual-card:not(:first-child)'), '表紙風景1枚化 CSS がありません');
requireMatch(css.includes('landing-overview__grid--menu'), 'モバイルメニュー写真カード用 CSS がありません');

requireMatch(heroCss.includes('hero-variant-bottom'), 'hero-variants.css に bottom 案がありません');
requireMatch(heroCss.includes('flex-start'), 'hero-variants.css の C 案が flex-end に戻っています');

if (errors.length > 0) {
  console.error('verify-landing-ui-regression: FAILED');
  for (const msg of errors) {
    console.error(`  - ${msg}`);
  }
  process.exit(1);
}

console.log('verify-landing-ui-regression: OK');
