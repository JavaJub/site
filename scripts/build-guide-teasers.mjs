// Turn the full free guide PDFs into TEASERS for the site: first N pages +
// a branded "продолжение в канале" page. The FULL guides live only in the
// Telegram channel — the site hosts teasers so the full file is a reason to
// subscribe. HTML question pages stay open (SEO); only the packaged PDF is gated.
//
//   JAVAJUB_GUIDES_SRC=/path/to/full-guides node scripts/build-guide-teasers.mjs
// Writes public/guides/<slug>.pdf (teaser). Source = full PDFs (NOT committed).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const SRC = process.env.JAVAJUB_GUIDES_SRC || resolve(root, '../guides-full');
const OUT = resolve(root, 'public/guides');
const TEASER_PAGES = 10;

const guides = JSON.parse(readFileSync(resolve(root, 'src/data/guides.generated.json'), 'utf8')).guides;
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function ctaSvg(g) {
  const review = g.kind === 'review';
  const bullets = review
    ? ['полный разбор всех багов + правильный код', 'чек-лист код-ревью под Senior', 'разбор самого коварного бага']
    : ['все вопросы с ответами по грейду', 'задачи: live-coding, SQL, System Design — с разбором', 'чек-лист «за 2 часа до собеса»'];
  const b = bullets.map((t, i) => `<text x="64" y="${452 + i * 40}" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#f4ece6">•  ${xml(t)}</text>`).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 595 842">
  <rect width="595" height="842" fill="#0e0c0b"/>
  <rect x="0" y="0" width="595" height="7" fill="#ff3d00"/>
  <text x="64" y="150" font-family="Menlo, monospace" font-size="13" letter-spacing="2" fill="#ff6a36">// JavaJub</text>
  <text x="64" y="232" font-family="Georgia, 'Times New Roman', serif" font-size="46" font-weight="bold" fill="#fff7f2">Это только начало</text>
  <text x="64" y="288" font-family="Georgia, 'Times New Roman', serif" font-size="46" font-weight="bold" fill="#ff3d00">гайда.</text>
  <text x="64" y="340" font-family="Helvetica, Arial, sans-serif" font-size="17" fill="#ffd8c7">${xml(g.company)} · ${xml(g.grade)}</text>
  <text x="64" y="410" font-family="Helvetica, Arial, sans-serif" font-size="19" fill="#f4ece6">Полная версия — бесплатно в Telegram-канале:</text>
  ${b}
  <rect x="64" y="600" width="230" height="58" rx="12" fill="#ff3d00"/>
  <text x="179" y="637" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="bold" fill="#0e0c0b">@java_jub</text>
  <text x="64" y="716" font-family="Menlo, monospace" font-size="13" fill="#8a8078">t.me/java_jub  ·  подписка бесплатная</text>
</svg>`;
}

mkdirSync(OUT, { recursive: true });
let done = 0;
for (const g of guides) {
  const src = resolve(SRC, `${g.slug}.pdf`);
  if (!existsSync(src)) { console.log(`-- skip (no source): ${g.slug}`); continue; }
  const tmp = resolve(tmpdir(), `jj-teaser-${g.slug}`);
  mkdirSync(tmp, { recursive: true });
  const body = resolve(tmp, 'body.pdf');
  const ctaSvgPath = resolve(tmp, 'cta.svg');
  const ctaPdf = resolve(tmp, 'cta.pdf');
  try {
    execFileSync('qpdf', ['--empty', '--pages', src, `1-${TEASER_PAGES}`, '--', body]);
    writeFileSync(ctaSvgPath, ctaSvg(g));
    execFileSync('rsvg-convert', ['-f', 'pdf', '-o', ctaPdf, ctaSvgPath]);
    execFileSync('pdfunite', [body, ctaPdf, resolve(OUT, `${g.slug}.pdf`)]);
    done++;
    console.log(`✓ ${g.slug.padEnd(26)} teaser: ${TEASER_PAGES}p + CTA`);
  } catch (e) {
    console.error(`✗ ${g.slug}: ${e.message}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
console.log(`\n✓ ${done} guide teasers → public/guides/`);
