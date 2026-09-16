export const defaultHomeContent = {
  homeTitle: "Suporte técnico presencial para sua casa.",
  homeDescription: "Atendimento residencial com deslocamento até o local para resolver problemas, instalar equipamentos e orientar você com clareza.",
  homeHighlights: "Instalação e configuração de equipamentos\nLimpeza, formatação e otimização do sistema\nUpgrades básicos de memória e SSD\nConsultoria gratuita para dúvidas e problemas",
  homeMeta: "Atendimento local · Diagnóstico · Solução prática",
  gameTitle: "Setup gamer pensado em otimização.",
  gameDescription: "Para quem quer montar, revisar ou evoluir o setup com foco em desempenho, estabilidade e melhor escolha de hardware.",
  gameHighlights: "Montagem e revisão completa do setup gamer\nDiagnóstico de desempenho e gargalos\nUpgrades de hardware e refrigeração\nConsultoria para peças, compatibilidade e custo-benefício",
  gameMeta: "Hardware · Performance · Otimização",
  dataTitle: "Dados organizados para apoiar decisões reais.",
  dataDescription: "Soluções para estruturar informações, automatizar análises e transformar dados em visão de negócio.",
  dataHighlights: "Dashboards, indicadores e visualização de resultados\nSoluções de Software, evoluindo processos.\nIntegração, tratamento e organização de dados\nAutomação de relatórios e fluxos analíticos\nBI, analytics e apoio à tomada de decisão",
  dataMeta: "Data Engineering · BI · Analytics · Developer",
  title: 'Tecnologia para sua casa, seu setup e seu negócio.',
  description: 'Suporte residencial, performance gamer e soluções em software e dados. Escolha o que você precisa e fale com a Noden.',
  aboutTitle: 'Um hub. Três frentes.',
  aboutDescription: 'A Noden reúne serviços complementares para resolver desde o suporte do dia a dia até projetos de alta performance e inteligência de dados.',
  contactTitle: 'Vamos conversar sobre o que você precisa?',
  contactDescription: 'Conte sua necessidade para combinar o próximo passo com a Noden.',
  contactLabel: 'Falar com a Noden',
};
export type HomeContent = typeof defaultHomeContent;
export const homeContentFields: { key: keyof HomeContent; label: string; max: number; group?: string; list?: boolean }[] = [
  { key: 'homeTitle', label: 'Título', max: 100, group: 'Home' },
  { key: 'homeDescription', label: 'Descrição', max: 260, group: 'Home' },
  { key: 'homeHighlights', label: 'Destaques (um por linha, até 6 itens de 100 caracteres)', max: 605, group: 'Home', list: true },
  { key: 'homeMeta', label: 'Complemento', max: 80, group: 'Home' },
  { key: 'gameTitle', label: 'Título', max: 100, group: 'Game' },
  { key: 'gameDescription', label: 'Descrição', max: 260, group: 'Game' },
  { key: 'gameHighlights', label: 'Destaques (um por linha, até 6 itens de 100 caracteres)', max: 605, group: 'Game', list: true },
  { key: 'gameMeta', label: 'Complemento', max: 80, group: 'Game' },
  { key: 'dataTitle', label: 'Título', max: 100, group: 'Data' },
  { key: 'dataDescription', label: 'Descrição', max: 260, group: 'Data' },
  { key: 'dataHighlights', label: 'Destaques (um por linha, até 6 itens de 100 caracteres)', max: 605, group: 'Data', list: true },
  { key: 'dataMeta', label: 'Complemento', max: 80, group: 'Data' },
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
export function splitHomeHighlights(value: string): string[] {
  return value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}
export function parseHomeContentForm(form: FormData): HomeContent | null {
  const result = { ...defaultHomeContent };
  for (const { key, max, list } of homeContentFields) {
    const value = form.get(`home_${key}`);
    if (typeof value !== 'string' || !value.trim()) return null;
    if (list) {
      const items = splitHomeHighlights(value);
      if (!items.length || items.length > 6 || items.some(item => item.length > 100)) return null;
      result[key] = items.join('\n');
    } else {
      if (value.trim().length > max) return null;
      result[key] = value.trim();
    }
  }
  return result;
}
