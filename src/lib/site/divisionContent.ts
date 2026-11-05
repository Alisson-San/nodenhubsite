import type { ServiceDivision } from "../../types/services";

/**
 * Conteúdo complementar das páginas de divisão (promessas e etapas).
 * Editável pelo modo de edição do site; publicado em site_settings
 * na chave "site.division_content".
 *
 * Regra: somente promessas confirmadas pela Noden. Não incluir prazos,
 * garantias, números ou depoimentos sem confirmação.
 * Confirmadas em 05/11/2026: atendimento no mesmo dia (conforme agenda),
 * busca e entrega do equipamento nas cidades atendidas.
 * Já publicadas pela Noden: avaliação remota gratuita (Home), orçamento
 * antes de qualquer serviço, compatibilidade antes da compra (Game).
 */
export interface Promise {
	title: string;
	text: string;
}

export interface DivisionExtras {
	promises: Promise[];
	steps: Promise[];
}

export const DIVISION_CONTENT_KEY = "site.division_content";

export const defaultDivisionExtras: Record<ServiceDivision, DivisionExtras> = {
	home: {
		promises: [
			{ title: "Atendimento no mesmo dia", text: "Chamou cedo, a gente encaixa na agenda do dia." },
			{ title: "Buscamos e entregamos", text: "Você não precisa sair de casa com o equipamento." },
			{ title: "Avaliação remota grátis", text: "Mande foto, vídeo ou descreva o problema." },
			{ title: "Orçamento antes", text: "Nada é feito sem o seu ok." },
		],
		steps: [
			{ title: "Chame no WhatsApp", text: "Conte o que está acontecendo. Foto e vídeo ajudam." },
			{ title: "Receba o orçamento", text: "Avaliamos e passamos o valor antes de mexer em qualquer coisa." },
			{ title: "A gente busca", text: "Retiramos o equipamento ou atendemos aí, no mesmo dia quando a agenda permite." },
			{ title: "Volta funcionando", text: "Entregamos testado e explicamos o que foi feito." },
		],
	},
	game: {
		promises: [
			{ title: "Buscamos e entregamos seu PC", text: "Sem desmontar o setup para carregar até a loja." },
			{ title: "Compatibilidade antes da compra", text: "Você não gasta em peça que não conversa com o resto." },
			{ title: "Testado antes de voltar", text: "Temperaturas e estabilidade conferidas no final do serviço." },
			{ title: "Orçamento antes", text: "Mão de obra e peças aprovadas por você." },
		],
		steps: [
			{ title: "Mande seu setup", text: "Peças, jogos, resolução e o que está incomodando." },
			{ title: "Plano e orçamento", text: "Dizemos o que vale trocar — e o que não vale." },
			{ title: "Buscamos o PC", text: "Retirada e entrega nas cidades atendidas." },
			{ title: "Ajustado e testado", text: "Volta montado, limpo, configurado e validado." },
		],
	},
	data: {
		promises: [
			{ title: "Começa pelo seu processo", text: "Entendemos como a empresa trabalha antes de propor tecnologia." },
			{ title: "Do tamanho da sua empresa", text: "Proposta pensada para o momento e o porte do negócio." },
			{ title: "Do dado ao sistema", text: "Dashboards, automações, integrações, sites e plataformas." },
			{ title: "Foco no resultado", text: "Tecnologia aplicada a problemas reais da operação." },
		],
		steps: [
			{ title: "Conversa inicial", text: "Você explica o processo, a dor e o resultado esperado." },
			{ title: "Mapeamento", text: "Levantamos dados, sistemas e pessoas envolvidas." },
			{ title: "Proposta", text: "Escopo, etapas e investimento claros." },
			{ title: "Construção e entrega", text: "Construímos, validamos com você e colocamos para rodar." },
		],
	},
};

function readList(value: unknown, fallback: Promise[]): Promise[] {
	if (!Array.isArray(value)) return fallback;
	const items = value
		.filter((x): x is Promise => !!x && typeof x === "object" && typeof x.title === "string" && typeof x.text === "string")
		.map((x) => ({ title: x.title.trim(), text: x.text.trim() }))
		.filter((x) => x.title);
	return items.length ? items : fallback;
}

export function readDivisionExtras(value: unknown, division: ServiceDivision): DivisionExtras {
	const fallback = defaultDivisionExtras[division];
	const source = value && typeof value === "object" ? (value as Record<string, unknown>)[division] : undefined;
	if (!source || typeof source !== "object") return structuredClone(fallback);
	const record = source as Record<string, unknown>;
	return {
		promises: readList(record.promises, fallback.promises),
		steps: readList(record.steps, fallback.steps),
	};
}

export function validateDivisionExtras(value: unknown): string | null {
	if (!value || typeof value !== "object") return "Conteúdo complementar inválido.";
	const record = value as Record<string, unknown>;
	for (const key of ["promises", "steps"] as const) {
		const list = record[key];
		if (!Array.isArray(list) || list.length < 1 || list.length > 6) return "Use de 1 a 6 itens em promessas e etapas.";
		for (const item of list) {
			if (!item || typeof item !== "object") return "Item inválido.";
			const { title, text } = item as Record<string, unknown>;
			if (typeof title !== "string" || !title.trim() || title.length > 80) return "Título de até 80 caracteres.";
			if (typeof text !== "string" || text.length > 200) return "Texto de até 200 caracteres.";
		}
	}
	return null;
}
