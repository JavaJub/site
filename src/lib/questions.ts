import bank from '../data/questions-bank.json';
import { topicLabel } from './companies';

type RawChoice = { id: string; text: string };
type Raw = {
  id: string; prompt: string; topics: string[]; level: string;
  choices: RawChoice[]; correct: string[]; explanation: string;
};

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};
function slugify(s: string): string {
  return s.toLowerCase().split('').map((c) => TRANSLIT[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64).replace(/-+$/g, '');
}

export type QA = {
  id: string; slug: string; topic: string; topicLabel: string; level: string;
  prompt: string; answer: string; explanation: string; companies: string[];
};

// Treat the bank's testing-aqa bucket as the site's "testing" topic.
const normTopic = (t: string) => (t === 'testing-aqa' ? 'testing' : t);

const used = new Set<string>();
export const questions: QA[] = (bank.questions as Raw[])
  .filter((q) => q.choices?.length && q.correct?.length && q.explanation)
  .map((q) => {
    const topic = q.topics?.[0] || 'java-core';
    const correct = q.choices.find((c) => q.correct.includes(c.id));
    let slug = slugify(q.prompt) || 'q';
    let s = slug; let i = 2;
    while (used.has(`${topic}/${s}`)) { s = `${slug}-${i++}`; }
    used.add(`${topic}/${s}`);
    return {
      id: q.id, slug: s, topic, topicLabel: topicLabel(topic), level: q.level,
      prompt: q.prompt, answer: correct?.text ?? '', explanation: q.explanation,
      companies: (q as Raw & { companies?: string[] }).companies ?? [],
    };
  })
  .filter((q) => q.answer);

export const questionTopics = [...new Set(questions.map((q) => q.topic))];

export function questionsByTopic(topic: string): QA[] {
  return questions.filter((q) => q.topic === topic);
}
export function getQuestion(topic: string, slug: string): QA | undefined {
  return questions.find((q) => q.topic === topic && q.slug === slug);
}

// FREE questions a given company actually got (matched to its sample guide).
export function freeQuestionsForCompany(bankKeys: string[], limit = 10): QA[] {
  if (!bankKeys?.length) return [];
  const keys = new Set(bankKeys);
  return questions.filter((q) => q.companies.some((c) => keys.has(c))).slice(0, limit);
}

// FREE questions on a company's most-asked topics — honest, generic, all answered.
export function freeQuestionsByTopics(topics: string[], limit = 8): QA[] {
  const wanted = new Set(topics.map(normTopic).filter((t) => t !== 'other'));
  if (!wanted.size) return questions.slice(0, limit);
  const out: QA[] = [];
  const seen = new Set<string>();
  // round-robin across topics so the sample is varied, not all one bucket
  const buckets = [...wanted].map((t) => questions.filter((q) => normTopic(q.topic) === t));
  let added = true;
  for (let i = 0; added && out.length < limit; i++) {
    added = false;
    for (const b of buckets) {
      const q = b[i];
      if (q && !seen.has(q.id)) { seen.add(q.id); out.push(q); added = true; if (out.length >= limit) break; }
    }
  }
  return out;
}
