export interface DefaultPaper {
  name: string;
  year: number;
  paper: 1 | 2;
  url: string;
}

export const DEFAULT_PAPERS: DefaultPaper[] = [
  { year: 2025, paper: 1, name: 'JEE Adv 2025 — Paper 1', url: '/papers/jee_adv_2025_paper1.pdf' },
  { year: 2025, paper: 2, name: 'JEE Adv 2025 — Paper 2', url: '/papers/jee_adv_2025_paper2.pdf' },
  { year: 2024, paper: 1, name: 'JEE Adv 2024 — Paper 1', url: '/papers/jee_adv_2024_paper1.pdf' },
  { year: 2024, paper: 2, name: 'JEE Adv 2024 — Paper 2', url: '/papers/jee_adv_2024_paper2.pdf' },
  { year: 2023, paper: 1, name: 'JEE Adv 2023 — Paper 1', url: '/papers/jee_adv_2023_paper1.pdf' },
  { year: 2023, paper: 2, name: 'JEE Adv 2023 — Paper 2', url: '/papers/jee_adv_2023_paper2.pdf' },
  { year: 2022, paper: 1, name: 'JEE Adv 2022 — Paper 1', url: '/papers/jee_adv_2022_paper1.pdf' },
  { year: 2022, paper: 2, name: 'JEE Adv 2022 — Paper 2', url: '/papers/jee_adv_2022_paper2.pdf' },
  { year: 2021, paper: 1, name: 'JEE Adv 2021 — Paper 1', url: '/papers/jee_adv_2021_paper1.pdf' },
  { year: 2021, paper: 2, name: 'JEE Adv 2021 — Paper 2', url: '/papers/jee_adv_2021_paper2.pdf' },
];

export async function fetchPaperAsFile(p: DefaultPaper): Promise<File> {
  const res = await fetch(p.url);
  if (!res.ok) throw new Error(`Failed to load ${p.name}`);
  const blob = await res.blob();
  return new File([blob], `${p.name}.pdf`, { type: 'application/pdf' });
}
