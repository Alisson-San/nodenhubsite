import type { PageTexts } from "../lib/catalog/editorTypes";
import type { ServiceDivision, ServicePageConfig } from "../types/services";

/**
 * Textos de venda das páginas de divisão (proposta de 05/11/2026).
 * Usados como conteúdo de reserva e como sugestão para carregar no rascunho.
 *
 * Só usam promessas confirmadas: atendimento no mesmo dia (conforme agenda),
 * busca e entrega do equipamento, avaliação remota grátis (Home), orçamento
 * antes, compatibilidade antes da compra e testes no final (Game).
 * As observações de preço repetem as condições já publicadas pela Noden.
 */
export const marketingCopy: Record<ServiceDivision, PageTexts> = {
	home: {
		hero_eyebrow: "Assistência técnica em Barão e região",
		hero_title: "Computador parado? A gente busca e devolve funcionando.",
		hero_description:
			"Formatação, limpeza, upgrade, internet e Wi-Fi. Atendimento no mesmo dia quando a agenda permite, busca e entrega do equipamento e orçamento antes de qualquer serviço.",
		hero_highlights: ["Atendimento no mesmo dia", "Busca e entrega", "Avaliação remota grátis", "Orçamento antes"],
		hero_primary_label: "Chamar agora no WhatsApp",
		hero_primary_message: "Olá! Vim pelo site da Noden Home e preciso de atendimento.",
		hero_secondary_label: "Ver preços",
		services_title: "Do computador lento ao Wi-Fi que não pega.",
		services_description:
			"Escolha o serviço ou só conte o problema. Se não souber o que pedir, começamos pela avaliação remota grátis.",
		pricing_title: "Preço na tela. Sem surpresa.",
		pricing_description:
			"Valores de mão de obra para você decidir rápido. Peças e casos especiais são orçados antes, sempre com o seu ok.",
		pricing_disclaimer:
			"Valores de mão de obra. Peças, licenças, recuperação avançada de dados, equipamentos com desmontagem especial e deslocamentos fora da área base são orçados separadamente. Nenhum serviço é executado sem aprovação.",
		cta_title: "Manda a foto do problema. A gente responde com a solução.",
		cta_description:
			"Pelo WhatsApp você recebe orientação, orçamento e o combinado de busca — tudo antes de começar.",
		cta_button_label: "Chamar a Noden Home",
		cta_message: "Olá! Vim pelo site da Noden Home e quero resolver um problema no meu equipamento.",
		seo_title: "Assistência técnica de computador em Barão e região | Noden Home",
		seo_description:
			"Formatação, limpeza, upgrade, internet e Wi-Fi com atendimento no mesmo dia, busca e entrega e orçamento antes. Barão, Carlos Barbosa, Salvador do Sul e São Pedro da Serra.",
	},
	game: {
		hero_eyebrow: "PC gamer em Barão e região",
		hero_title: "Seu PC gamer montado, limpo e rodando liso.",
		hero_description:
			"Montagem, upgrade, refrigeração e otimização com teste no final. Buscamos o PC, conferimos a compatibilidade antes da compra e você aprova o orçamento antes.",
		hero_highlights: ["Busca e entrega do PC", "Compatibilidade antes da compra", "Temperaturas e estabilidade testadas", "Orçamento antes"],
		hero_primary_label: "Analisar meu setup",
		hero_primary_message: "Olá! Vim pelo site da Noden Game e quero uma análise do meu setup.",
		hero_secondary_label: "Ver preços",
		services_title: "Tudo o que o seu setup precisa, num lugar só.",
		services_description:
			"Da montagem do zero ao upgrade que faz diferença. Cada serviço termina com teste e explicação do que mudou.",
		pricing_title: "Escolha o upgrade. A gente cuida do resto.",
		pricing_description:
			"Mão de obra com valor na tela. Peças e PCs completos são orçados pelo desempenho que você quer e pelo valor disponível.",
		pricing_disclaimer:
			"Valores de mão de obra. Peças, licenças, thermal pads, líquidos, acessórios, fretes e deslocamentos são orçados separadamente. Resultados variam conforme hardware, jogo, resolução e estado do sistema. Não realizamos alterações inseguras nem prometemos aumento fixo de FPS.",
		cta_title: "Antes de trocar peça, descubra o que está segurando seu setup.",
		cta_description: "Mande a configuração, os jogos e a resolução. Respondemos com o caminho mais direto e o orçamento.",
		cta_button_label: "Chamar a Noden Game",
		cta_message: "Olá! Vim pelo site da Noden Game e quero melhorar meu setup.",
		seo_title: "Montagem e upgrade de PC gamer em Barão e região | Noden Game",
		seo_description:
			"Montagem, limpeza, upgrade, refrigeração e otimização de PC gamer com busca e entrega, teste no final e orçamento antes.",
	},
	data: {
		hero_eyebrow: "Software e dados para empresas",
		hero_title: "Menos planilha, mais decisão.",
		hero_description:
			"Dashboards, automações, integrações, sites e plataformas sob medida para a sua empresa — no tamanho e no momento do seu negócio.",
		hero_highlights: ["Dashboards e BI", "Automação de processos", "Sites e plataformas", "Integração de dados"],
		hero_primary_label: "Conversar sobre meu projeto",
		hero_primary_message: "Olá! Vim pelo site da Noden Data e quero conversar sobre um projeto para minha empresa.",
		hero_secondary_label: "Ver soluções",
		services_title: "Tecnologia que resolve o gargalo da operação.",
		services_description: "Começamos pelo processo: como funciona hoje, onde trava e que resultado precisa aparecer.",
		pricing_title: "Projetos com escopo claro.",
		pricing_description: "Valores de referência para começar a conversa. A proposta final sai depois de entender o processo.",
		pricing_disclaimer:
			"Os valores dependem de escopo, integrações, infraestrutura, domínio, hospedagem, volume de dados, prazo e necessidade de suporte contínuo.",
		cta_title: "Conte onde a sua operação trava.",
		cta_description: "Explique o processo atual e o resultado esperado. Respondemos com os próximos passos para a proposta.",
		cta_button_label: "Chamar a Noden Data",
		cta_message: "Olá! Vim pelo site da Noden Data e quero apresentar uma necessidade da minha empresa.",
		seo_title: "Dashboards, automação e sistemas para empresas | Noden Data",
		seo_description:
			"Dashboards e BI, automação de processos, integração de dados, sites e plataformas sob medida para empresas.",
	},
};

/** Aplica os textos a uma página (usado no conteúdo de reserva). */
export function withMarketingCopy(page: ServicePageConfig): ServicePageConfig {
	const t = marketingCopy[page.division];
	return {
		...page,
		seo: { ...page.seo, title: t.seo_title, description: t.seo_description },
		hero: {
			...page.hero,
			eyebrow: t.hero_eyebrow,
			title: t.hero_title,
			description: t.hero_description,
			highlights: t.hero_highlights,
			primaryLabel: t.hero_primary_label,
			primaryMessage: t.hero_primary_message,
			secondaryLabel: t.hero_secondary_label,
			secondaryHref: "#precos",
		},
		servicesSection: { ...page.servicesSection, title: t.services_title, description: t.services_description },
		pricingSection: {
			...page.pricingSection,
			title: t.pricing_title,
			description: t.pricing_description,
			disclaimer: t.pricing_disclaimer,
		},
		cta: {
			...page.cta,
			title: t.cta_title,
			description: t.cta_description,
			buttonLabel: t.cta_button_label,
			message: t.cta_message,
		},
	};
}
