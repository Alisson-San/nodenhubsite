export const defaultHomeContent = {
  title: 'Tecnologia para sua casa, seu setup e seu negócio.',
  description: 'Suporte residencial, performance gamer e soluções em software e dados. Escolha o que você precisa e fale com a Noden.',
  aboutTitle: 'Um hub. Três frentes.',
  aboutDescription: 'A Noden reúne serviços complementares para resolver desde o suporte do dia a dia até projetos de alta performance e inteligência de dados.',
  contactTitle: 'Vamos conversar sobre o que você precisa?',
  contactDescription: 'Conte sua necessidade para combinar o próximo passo com a Noden.',
  contactLabel: 'Falar com a Noden',
};
export type HomeContent = typeof defaultHomeContent;
export const homeContentFields: { key: keyof HomeContent; label: string; max: number }[] = [
  { key: 'title', label: 'Título da abertura', max: 120 },
  { key: 'description', label: 'Descrição da abertura', max: 320 },
  { key: 'aboutTitle', label: 'Título de Quem somos', max: 120 },
  { key: 'aboutDescription', label: 'Texto de Quem somos', max: 600 },
  { key: 'contactTitle', label: 'Título do contato', max: 120 },
  { key: 'contactDescription', label: 'Texto do contato', max: 320 },
  { key: 'contactLabel', label: 'Texto do botão de contato', max: 50 },
];
export function readHomeContent(value: unknown): HomeContent {
  const result = { ...defaultHomeContent };
  if (!value || typeof value !== 'object') return result;
  for (const { key } of homeContentFields) {
    const text = (value as Record<string, unknown>)[key];
    if (typeof text === 'string' && text.trim()) result[key] = text;
  }
  return result;
}
export function parseHomeContentForm(form: FormData): HomeContent | null {
  const result = { ...defaultHomeContent };
  for (const { key, max } of homeContentFields) {
    const value = form.get(`home_${key}`);
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max) return null;
    result[key] = value.trim();
  }
  return result;
}
