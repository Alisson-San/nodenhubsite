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

export const gamePage: ServicePageConfig = {
	division: "game",

	seo: {
		title:
			"Noden Game — Montagem e otimização de computadores gamer",
		description:
			"Montagem, manutenção, diagnóstico, upgrades e otimização de computadores e setups gamer.",
		canonical: "/game",
	},

	theme: {
		accent: "#9a35ff",
		accentSecondary: "#315cff",
	},

	hero: {
		eyebrow: "NODEN GAME",

		title:
			"Seu setup pronto para entregar mais.",

		description:
			"Montagem, revisão e otimização de computadores gamer com foco em desempenho, estabilidade e escolhas de hardware que realmente façam sentido.",

		highlights: [
			"Performance",
			"Estabilidade",
			"Custo-benefício",
		],

		primaryLabel:
			"Solicitar avaliação",

		primaryMessage:
			"Olá! Vim pela página Noden Game e gostaria de avaliar meu setup.",

		secondaryLabel:
			"Conhecer os serviços",

		secondaryHref:
			"#servicos",
	},

	servicesSection: {
		eyebrow:
			"PERFORMANCE E HARDWARE",

		title:
			"Cada componente trabalhando do jeito certo.",

		description:
			"Antes de recomendar uma troca ou upgrade, analisamos o objetivo do jogador, o hardware atual e onde realmente estão os gargalos.",
	},

	services: [
		{
			title:
				"Montagem de computador gamer",

			description:
				"Montagem completa com organização, configuração e testes de estabilidade.",

			features: [
				"Verificação de compatibilidade",
				"Montagem e organização de cabos",
				"Configuração da BIOS",
				"Testes de funcionamento",
			],

			badge:
				"Setup completo",
		},
		{
			title:
				"Diagnóstico de desempenho",

			description:
				"Análise de travamentos, quedas de FPS, temperaturas e limitações do hardware.",

			features: [
				"Análise de gargalos",
				"Testes de CPU e GPU",
				"Monitoramento de temperaturas",
				"Orientação sobre melhorias",
			],
		},
		{
			title:
				"Upgrades de hardware",

			description:
				"Planejamento e instalação de melhorias compatíveis com o computador atual.",

			features: [
				"Memória e armazenamento",
				"Placa de vídeo",
				"Processador e placa-mãe",
				"Fonte e refrigeração",
			],
		},
		{
			title:
				"Limpeza e refrigeração",

			description:
				"Manutenção preventiva para controlar temperaturas, ruídos e perda de desempenho.",

			features: [
				"Limpeza interna detalhada",
				"Revisão das ventoinhas",
				"Análise do fluxo de ar",
				"Testes de temperatura",
			],
		},
		{
			title:
				"Otimização do sistema",

			description:
				"Configuração do sistema, drivers e recursos utilizados durante os jogos.",

			features: [
				"Atualização de drivers",
				"Revisão de processos",
				"Configuração de energia",
				"Testes de estabilidade",
			],
		},
		{
			title:
				"Consultoria para peças",

			description:
				"Ajuda para escolher componentes compatíveis com o objetivo e orçamento disponíveis.",

			features: [
				"Análise do setup atual",
				"Comparação de componentes",
				"Compatibilidade entre peças",
				"Planejamento de upgrades",
			],
		},
	],

	pricingSection: {
		eyebrow:
			"VALORES INICIAIS",

		title:
			"Performance com investimento consciente.",

		description:
			"Os valores são referências iniciais. Cada setup pode exigir procedimentos e testes diferentes.",

		disclaimer:
			"Valores sujeitos ao hardware, complexidade da montagem, materiais utilizados, necessidade de peças e testes adicionais. Componentes não estão incluídos.",
	},

	pricing: [
		{
			name:
				"Diagnóstico gamer",

			description:
				"Análise inicial de desempenho, temperaturas, gargalos e estabilidade.",

			pricePrefix:
				"A partir de",

			price:
				60,

			features: [
				"Análise do hardware",
				"Testes de desempenho",
				"Monitoramento de temperatura",
				"Orientação sobre melhorias",
			],

			ctaMessage:
				"Olá! Gostaria de solicitar um diagnóstico gamer com a Noden Game.",
		},
		{
			name:
				"Manutenção completa",

			description:
				"Limpeza detalhada, revisão da refrigeração e testes do equipamento.",

			pricePrefix:
				"A partir de",

			price:
				130,

			featured:
				true,

			badge:
				"Mais procurado",

			features: [
				"Limpeza interna",
				"Revisão das ventoinhas",
				"Análise de temperaturas",
				"Testes de estabilidade",
			],

			note:
				"Materiais térmicos e procedimentos específicos são avaliados conforme o equipamento.",

			ctaMessage:
				"Olá! Gostaria de solicitar uma manutenção completa com a Noden Game.",
		},
		{
			name:
				"Montagem completa",

			description:
				"Montagem de computador gamer com organização, configuração e testes.",

			pricePrefix:
				"A partir de",

			price:
				180,

			features: [
				"Montagem dos componentes",
				"Organização dos cabos",
				"Configuração inicial",
				"Testes de funcionamento",
			],

			note:
				"Não inclui sistema operacional, licenças ou aquisição dos componentes.",

			ctaMessage:
				"Olá! Gostaria de solicitar a montagem de um computador com a Noden Game.",
		},
	],

	cta: {
		eyebrow:
			"QUER MELHORAR O SETUP?",

		title:
			"Descubra onde realmente vale a pena investir.",

		description:
			"Conte quais jogos você utiliza, seu hardware atual e o que está incomodando. A análise começa pela sua necessidade, não pela peça mais cara.",

		buttonLabel:
			"Falar com a Noden Game",

		message:
			"Olá! Vim pela página Noden Game e gostaria de conversar sobre meu setup.",

		secondaryLabel:
			"Voltar aos serviços",

		secondaryHref:
			"#servicos",
	},
};

export const dataPage: ServicePageConfig = {
	division: "data",

	seo: {
		title:
			"Noden Data — Software, automação, dados e BI",
		description:
			"Desenvolvimento de software, sites, automações, dashboards, integração de dados e soluções digitais para empresas.",
		canonical: "/data",
	},

	theme: {
		accent: "#08a8ff",
		accentSecondary: "#2354ff",
	},

	hero: {
		eyebrow: "NODEN DATA",

		title:
			"Soluções digitais para organizar e evoluir seu negócio.",

		description:
			"Software, automação, dados e inteligência de negócio aplicados a problemas reais, respeitando o tamanho e o momento de cada empresa.",

		highlights: [
			"Software",
			"Automação",
			"Dados e BI",
		],

		primaryLabel:
			"Apresentar uma necessidade",

		primaryMessage:
			"Olá! Vim pela página Noden Data e gostaria de conversar sobre uma solução para meu negócio.",

		secondaryLabel:
			"Conhecer as soluções",

		secondaryHref:
			"#servicos",
	},

	servicesSection: {
		eyebrow:
			"SOFTWARE E DADOS",

		title:
			"Tecnologia aplicada ao que sua empresa precisa.",

		description:
			"Cada projeto começa entendendo o processo, as dificuldades atuais e o resultado que precisa ser alcançado.",
	},

	services: [
		{
			title:
				"Sites institucionais",

			description:
				"Presença digital profissional, responsiva e preparada para apresentar sua empresa.",

			features: [
				"Design responsivo",
				"Informações de contato",
				"Integração com redes sociais",
				"Configuração de domínio",
			],

			badge:
				"Presença digital",
		},
		{
			title:
				"Sistemas personalizados",

			description:
				"Desenvolvimento de soluções para organizar operações e processos específicos.",

			features: [
				"Levantamento da necessidade",
				"Desenvolvimento sob medida",
				"Controle de usuários",
				"Evolução contínua",
			],
		},
		{
			title:
				"Automação de processos",

			description:
				"Redução de tarefas repetitivas e integração entre informações e ferramentas.",

			features: [
				"Automação de relatórios",
				"Importação e exportação de dados",
				"Processamento programado",
				"Integração entre sistemas",
			],
		},
		{
			title:
				"Dashboards e indicadores",

			description:
				"Visualização de resultados para acompanhar operações e apoiar decisões.",

			features: [
				"Definição de indicadores",
				"Dashboards interativos",
				"Atualização automatizada",
				"Visão gerencial",
			],
		},
		{
			title:
				"Organização e integração de dados",

			description:
				"Estruturação das informações utilizadas por sistemas, planilhas e relatórios.",

			features: [
				"Tratamento de dados",
				"Padronização de informações",
				"Integração de fontes",
				"Preparação para análises",
			],
		},
		{
			title:
				"Suporte e evolução de software",

			description:
				"Manutenção e melhoria de sistemas, sites e soluções digitais existentes.",

			features: [
				"Correção de problemas",
				"Novas funcionalidades",
				"Atualizações técnicas",
				"Acompanhamento contínuo",
			],
		},
	],

	pricingSection: {
		eyebrow:
			"FORMATOS DE PROJETO",

		title:
			"Uma proposta adequada à necessidade.",

		description:
			"Projetos digitais variam bastante em escopo. Os valores abaixo servem apenas como ponto de partida para a conversa.",

		disclaimer:
			"Os valores dependem de escopo, integrações, infraestrutura, domínio, hospedagem, volume de dados, prazo e necessidade de suporte contínuo.",
	},

	pricing: [
		{
			name:
				"Análise inicial",

			description:
				"Conversa e levantamento para compreender o problema e possíveis caminhos.",

			priceLabel:
				"Sem custo",

			features: [
				"Entendimento da necessidade",
				"Análise inicial de viabilidade",
				"Definição dos próximos passos",
			],

			ctaLabel:
				"Apresentar uma ideia",

			ctaMessage:
				"Olá! Gostaria de apresentar uma ideia ou necessidade para a Noden Data.",
		},
		{
			name:
				"Site institucional",

			description:
				"Projeto para apresentar serviços, contatos e informações da empresa.",

			pricePrefix:
				"A partir de",

			price:
				900,

			featured:
				true,

			badge:
				"Presença digital",

			features: [
				"Layout responsivo",
				"Páginas institucionais",
				"Contato e redes sociais",
				"Publicação inicial",
			],

			note:
				"Domínio, hospedagem, identidade visual e recursos específicos são avaliados separadamente.",

			ctaMessage:
				"Olá! Gostaria de solicitar uma proposta para um site institucional.",
		},
		{
			name:
				"Solução personalizada",

			description:
				"Sistemas, automações, dashboards e integrações desenvolvidos conforme o processo.",

			priceLabel:
				"Sob consulta",

			features: [
				"Levantamento do processo",
				"Definição do escopo",
				"Desenvolvimento por etapas",
				"Proposta personalizada",
			],

			ctaMessage:
				"Olá! Gostaria de conversar sobre uma solução personalizada com a Noden Data.",
		},
	],

	cta: {
		eyebrow:
			"VAMOS ENTENDER O PROBLEMA?",

		title:
			"Antes de desenvolver, precisamos compreender.",

		description:
			"Conte como o processo funciona hoje, onde estão as dificuldades e qual resultado você gostaria de alcançar.",

		buttonLabel:
			"Falar com a Noden Data",

		message:
			"Olá! Vim pela página Noden Data e gostaria de apresentar uma necessidade do meu negócio.",

		secondaryLabel:
			"Voltar às soluções",

		secondaryHref:
			"#servicos",
	},
};