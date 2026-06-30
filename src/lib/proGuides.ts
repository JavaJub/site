import data from '../data/pro-guides.generated.json';

export type ProGuide = {
  slug: string;
  company: string;
  grade: string;
  kind: 'bank' | 'product' | 'bundle';
  cover: string;
  toc: string | null;
  sections: string[];
};

export const proGuides = data.guides as ProGuide[];
export const proGuidesCount = data.count as number;
