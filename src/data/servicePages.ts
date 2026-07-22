import type {
	ServicePageConfig,
} from "../types/services";

export const homePage: ServicePageConfig = {
	division: "home",

	seo: {
		title:
			"Noden Home — Suporte técnico residencial",
		description:
			"Suporte técnico residencial, manutenção de computadores, formatação, limpeza, redes Wi-Fi e configuração de dispositivos.",
		canonical: "/home",
	},

	theme: {
		accent: "#2387ff",
		accentSecondary: "#6f35ff",
	},

	hero: {
		eyebrow: "NODEN HOME",

		title:
			"Tecnologia funcionando bem dentro da sua casa.",

		description:
			"Suporte técnico próximo e transparente para computadores, redes, dispositivos e toda a tecnologia que faz parte da sua rotina.",

		highlights: [
			"Atendimento próximo",
			"Preços justos",
			"Explicação clara",
		],

		primaryLabel:
			"Solicitar atendimento",

		primaryMessage:
			"Olá! Vim pela página Noden Home e gostaria de solicitar atendimento.",

		secondaryLabel:
			"Conhecer os serviços",

		secondaryHref:
			"#servicos",
	},

	servicesSection: {
		eyebrow:
			"SOLUÇÕES RESIDENCIAIS",

		title:
			"Ajuda técnica sem complicação.",

		description:
			"Do computador lento à configuração completa da rede da sua casa, cada atendimento começa entendendo o problema antes de propor uma solução.",
	},

	services: [
		{
			title:
				"Diagnóstico e suporte",

			description:
				"Identificação de lentidão, travamentos, falhas no sistema e problemas de configuração.",

			features: [
				"Análise inicial do equipamento",
				"Identificação da causa provável",
				"Orçamento antes da execução",
			],

			badge:
				"Primeiro passo",
		},
		{
			title:
				"Formatação e configuração",

			description:
				"Instalação limpa do sistema e preparação do computador para voltar ao uso.",

			features: [
				"Instalação do sistema",
				"Drivers e atualizações",
				"Programas essenciais",
				"Configurações iniciais",
			],
		},
		{
			title:
				"Limpeza e manutenção",

			description:
				"Cuidados preventivos para reduzir temperatura, ruído e perda de desempenho.",

			features: [
				"Limpeza interna",
				"Verificação das temperaturas",
				"Revisão de ventoinhas",
				"Testes após o serviço",
			],
		},
		{
			title:
				"Redes e Wi-Fi",

			description:
				"Configuração e melhoria da conexão entre roteadores, computadores e dispositivos.",

			features: [
				"Configuração de roteadores",
				"Análise de cobertura",
				"Organização da rede",
				"Conexão de dispositivos",
			],
		},
		{
			title:
				"Instalação de equipamentos",

			description:
				"Configuração de impressoras, câmeras, periféricos e outros dispositivos da casa.",

			features: [
				"Instalação e configuração",
				"Conexão à rede",
				"Testes de funcionamento",
				"Orientação de uso",
			],
		},
		{
			title:
				"Orientação para compra",

			description:
				"Ajuda para escolher computadores, peças e equipamentos adequados à sua necessidade.",

			features: [
				"Análise da finalidade",
				"Comparação de opções",
				"Recomendação sem vínculo com loja",
				"Foco em custo-benefício",
			],
		},
	],

	pricingSection: {
		eyebrow:
			"VALORES INICIAIS",

		title:
			"Você entende o custo antes de começar.",

		description:
			"Os valores abaixo servem como referência inicial. O orçamento definitivo é informado depois de entendermos o equipamento e o serviço necessário.",

		disclaimer:
			"Valores iniciais sujeitos à complexidade do serviço, estado do equipamento, necessidade de peças, licenças, backup e deslocamento. Nenhum serviço adicional é realizado sem autorização.",
	},

	pricing: [
		{
			name:
				"Diagnóstico técnico",

			description:
				"Avaliação inicial para identificar a provável causa do problema.",

			pricePrefix:
				"A partir de",

			price:
				50,

			features: [
				"Análise do equipamento",
				"Identificação inicial da falha",
				"Orientação sobre a solução",
			],

			note:
				"O valor poderá ser considerado no orçamento quando o serviço for executado pela Noden.",

			ctaMessage:
				"Olá! Gostaria de solicitar um diagnóstico técnico com a Noden Home.",
		},
		{
			name:
				"Formatação completa",

			description:
				"Reinstalação e configuração inicial do sistema operacional.",

			pricePrefix:
				"A partir de",

			price:
				90,

			featured:
				true,

			badge:
				"Mais procurado",

			features: [
				"Instalação do sistema",
				"Drivers e atualizações",
				"Programas essenciais",
				"Testes de funcionamento",
			],

			note:
				"Backup, recuperação de arquivos e licenças são avaliados separadamente.",

			ctaMessage:
				"Olá! Gostaria de saber mais sobre o serviço de formatação da Noden Home.",
		},
		{
			name:
				"Limpeza preventiva",

			description:
				"Limpeza interna e revisão básica do sistema de refrigeração.",

			pricePrefix:
				"A partir de",

			price:
				100,

			features: [
				"Limpeza interna",
				"Verificação de ventoinhas",
				"Análise de temperaturas",
				"Testes após a manutenção",
			],

			note:
				"Troca de pasta térmica e materiais específicos dependem do equipamento.",

			ctaMessage:
				"Olá! Gostaria de solicitar uma limpeza preventiva com a Noden Home.",
		},
	],

	cta: {
		eyebrow:
			"PRECISA DE AJUDA?",

		title:
			"Conte o que está acontecendo com sua tecnologia.",

		description:
			"Explique o problema pelo WhatsApp. A primeira conversa serve para entender sua necessidade e indicar o melhor caminho.",

		buttonLabel:
			"Falar com a Noden Home",

		message:
			"Olá! Vim pela página Noden Home e preciso de ajuda com um equipamento.",

		secondaryLabel:
			"Voltar aos serviços",

		secondaryHref:
			"#servicos",
	},
};