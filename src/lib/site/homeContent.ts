export const defaultHomeContent = {
  homeTitle: "Seu computador de volta, funcionando.",
  homeDescription: "Formatação, limpeza, upgrade, internet e Wi-Fi. Buscamos o equipamento, resolvemos e devolvemos — no mesmo dia quando a agenda permite.",
  homeHighlights: "Atendimento no mesmo dia\nBusca e entrega do equipamento\nAvaliação remota grátis\nOrçamento antes de qualquer serviço",
  homeMeta: "Casa e dia a dia",
  gameTitle: "PC gamer montado, limpo e rodando liso.",
  gameDescription: "Montagem, upgrade, refrigeração e otimização com teste no final. Compatibilidade conferida antes de você gastar com peça.",
  gameHighlights: "Busca e entrega do PC\nCompatibilidade antes da compra\nTemperaturas e estabilidade testadas\nOrçamento antes da execução",
  gameMeta: "Para seu setup",
  dataTitle: "Sua empresa rodando com dados e sistemas certos.",
  dataDescription: "Dashboards, automações, integrações, sites e plataformas sob medida — do tamanho e do momento do seu negócio.",
  dataHighlights: "Dashboards e BI\nAutomação de processos\nSites, sistemas e plataformas\nIntegração e organização de dados",
  dataMeta: "Para sua empresa",
  title: "A gente busca, resolve e devolve funcionando.",
  description: "Suporte para sua casa, PC gamer no ponto e sistemas para sua empresa. Atendimento no mesmo dia, busca e entrega do equipamento e orçamento antes de mexer em qualquer coisa.",
  aboutTitle: "Cada círculo da Noden é uma especialidade.",
  aboutDescription: "Casa, setup gamer e empresa. Separados, cada nó resolve uma parte da sua tecnologia com quem entende do assunto.",
  storyTitle: "Conectados, viram a Noden.",
  storyDescription: "Um contato só para a tecnologia da casa, do setup e da empresa. A gente entende o problema, aciona a especialidade certa e entrega funcionando.",
  contactTitle: "Manda a mensagem. A gente resolve.",
  contactDescription: "Conte o problema, mande foto ou vídeo. Respondemos com o próximo passo e o orçamento antes de começar.",
  contactLabel: "Chamar no WhatsApp",
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
  { key: 'storyTitle', label: 'Título da conexão (fim da apresentação)', max: 120 },
  { key: 'storyDescription', label: 'Texto da conexão (fim da apresentação)', max: 320 },
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

/** Valida o conteúdo da inicial editado no site (mesmas regras do formulário). */
export function validateHomeContent(value: unknown): HomeContent | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const result = { ...defaultHomeContent };
  for (const { key, max, list } of homeContentFields) {
    const text = record[key];
    if (typeof text !== 'string' || !text.trim()) return null;
    if (list) {
      const items = splitHomeHighlights(text);
      if (!items.length || items.length > 6 || items.some(item => item.length > 100)) return null;
      result[key] = items.join('\n');
    } else {
      if (text.trim().length > max) return null;
      result[key] = text.trim();
    }
  }
  return result;
}
