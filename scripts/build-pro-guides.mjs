// Build the PAID-guide TEASER dataset: ONLY the cover + the "Содержание" (TOC)
// page of each paid guide are rendered to images. The question pages are NEVER
// touched or shipped — this just lets visitors see what a Pro guide contains.
//
// Reads source PDFs from $JAVAJUB_PRO_DIR (default ~/Downloads). Renders images
// to public/img/pro/ and writes src/data/pro-guides.generated.json. Like the
// other generated assets, the IMAGES are committed; the PDFs stay local.
//
//   node scripts/build-pro-guides.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const SRC = process.env.JAVAJUB_PRO_DIR || resolve(homedir(), 'Downloads');
const IMG = resolve(root, 'public/img/pro');
mkdirSync(IMG, { recursive: true });

// Curated flagship paid guides (file in SRC, display meta). kind: bank|product|bundle.
const GUIDES = [
  { slug: 'tbank-middle', file: 'JavaJub_Т-Bank_Middle_Java_Interview.pdf', company: 'Т-Банк', grade: 'Middle', kind: 'bank' },
  { slug: 'tbank-senior', file: 'JavaJub_Т-Bank_Senior_Java_Interview.pdf', company: 'Т-Банк', grade: 'Senior', kind: 'bank' },
  { slug: 'vtb-senior', file: 'JavaJub_Собес_vtb-senior_Interview.pdf', company: 'ВТБ', grade: 'Senior', kind: 'bank' },
  { slug: 'sber-senior', file: 'JavaJub_SBER_Senior_Java_Interview.pdf', company: 'Сбер', grade: 'Senior', kind: 'bank' },
  { slug: 'alfa-senior', file: 'JavaJub_Собес_Альфа_Java_Senior.pdf', company: 'Альфа-Банк', grade: 'Senior', kind: 'bank' },
  { slug: 'sovcombank-middle', file: 'JavaJub_Собес_Совкомбанк_Java_Middle.pdf', company: 'Совкомбанк', grade: 'Middle', kind: 'bank' },
  { slug: 'raiffeisen-senior', file: 'JavaJub_Собес_Райффайзен_Senior_Java_Kotlin.pdf', company: 'Райффайзен', grade: 'Senior', kind: 'bank' },
  { slug: 'ozon-middle', file: 'JavaJub_Ozon_SearchPlatform_Interview.pdf', company: 'Ozon Tech', grade: 'Middle', kind: 'product' },
  { slug: 'wildberries-middle', file: 'JavaJub_Собес_Wildberries_Банк_Java_Middle.pdf', company: 'Wildberries Банк', grade: 'Middle', kind: 'product' },
  { slug: 'tochka-senior', file: 'JavaJub_Собес_Точка_Java_Senior.pdf', company: 'Точка', grade: 'Senior', kind: 'bank' },
  { slug: 'megafon-middle', file: 'JavaJub_megafon-middle_Interview.pdf', company: 'МегаФон', grade: 'Middle', kind: 'product' },
  { slug: 'x5-senior', file: 'JavaJub_Собес_X5Tech_Java_Senior_Interview.pdf', company: 'X5 Tech', grade: 'Senior', kind: 'product' },
  { slug: 'nordclan-middle', file: 'JavaJub_Собес_NordClan_Java_Middle.pdf', company: 'Nord Clan', grade: 'Middle', kind: 'product' },
  { slug: 'aston-middle', file: 'JavaJub_Собес_ASTON_Java_Middle_Interview.pdf', company: 'ASTON', grade: 'Middle', kind: 'product' },
  { slug: 'banks-rf-middle', file: 'JavaJub_Middle_Java_Banks_RF_Interviews.pdf', company: 'Банки РФ — сборник', grade: 'Middle', kind: 'bundle' },
];

const text = (file, p) => {
  try { return execFileSync('pdftotext', ['-f', String(p), '-l', String(p), resolve(SRC, file), '-'], { encoding: 'utf8' }); }
  catch { return ''; }
};
const render = (file, page, out) => {
  execFileSync('pdftoppm', ['-jpeg', '-r', '150', '-f', String(page), '-l', String(page), resolve(SRC, file), resolve(IMG, out)]);
  const made = readdirSync(IMG).find((f) => f.startsWith(out + '-') && f.endsWith('.jpg'));
  renameSync(resolve(IMG, made), resolve(IMG, out + '.jpg'));
  execFileSync('sips', ['--resampleWidth', '760', resolve(IMG, out + '.jpg')], { stdio: 'ignore' });
};
// TOC layout is: a line with the section number (NN), then the title on its own
// line, then the page number. Capture the title that follows each NN.
const sections = (t) => {
  const lines = t.split('\n').map((s) => s.trim());
  const out = [];
  for (let i = 0; i < lines.length && out.length < 26; i++) {
    if (!/^\d{1,2}$/.test(lines[i])) continue;
    let j = i + 1; while (j < lines.length && !lines[j]) j++;
    const title = lines[j];
    if (title && /[А-Яа-яA-Za-zЁё]/.test(title) && title.length >= 3 && title.length <= 52 && !/^содержан/i.test(title)) {
      out.push(title.replace(/\s+\d+$/, '').trim());
    }
  }
  return [...new Set(out)];
};

const result = [];
for (const g of GUIDES) {
  if (!existsSync(resolve(SRC, g.file))) { console.log(`-- skip (missing): ${g.file}`); continue; }
  render(g.file, 1, `${g.slug}-cover`);
  // find the Содержание page within the first 6 pages
  let tocPage = 0, tocText = '';
  for (let p = 1; p <= 6; p++) { const t = text(g.file, p); if (/содержан/i.test(t)) { tocPage = p; tocText = t; break; } }
  let toc = null;
  if (tocPage) { render(g.file, tocPage, `${g.slug}-toc`); toc = `/img/pro/${g.slug}-toc.jpg`; }
  result.push({
    slug: g.slug, company: g.company, grade: g.grade, kind: g.kind,
    cover: `/img/pro/${g.slug}-cover.jpg`, toc,
    sections: sections(tocText),
  });
  console.log(`✓ ${g.slug.padEnd(20)} cover + ${toc ? `toc(p${tocPage}, ${result.at(-1).sections.length} разд.)` : 'no-toc'}`);
}

writeFileSync(resolve(root, 'src/data/pro-guides.generated.json'),
  JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), count: result.length, guides: result }, null, 2) + '\n');
console.log(`\n✓ ${result.length} pro guides → src/data/pro-guides.generated.json`);
