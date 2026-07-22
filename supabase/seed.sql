-- Este arquivo é gerado automaticamente.
-- Execute: npm run db:seed:generate
-- Não altere manualmente.

begin;

-- Evita preencher o histórico de auditoria com a carga inicial.
alter table public.site_settings
	disable trigger site_settings_write_audit;

alter table public.service_pages
	disable trigger service_pages_write_audit;

alter table public.services
	disable trigger services_write_audit;

alter table public.pricing_items
	disable trigger pricing_items_write_audit;

alter table public.social_links
	disable trigger social_links_write_audit;

insert into public.site_settings (
	key,
	value,
	description,
	is_public
)
values (
	'site.identity',
	'{"name":"Noden","legalName":"Noden Technology Hub","description":"Noden Technology Hub — suporte residencial, performance gamer e soluções em software e dados.","url":"https://nodenhub.com.br","locale":"pt-BR"}'::jsonb,
	'Identidade e informações institucionais da Noden.',
	true
)
on conflict (key)
do update set
	value = excluded.value,
	description = excluded.description,
	is_public = excluded.is_public,
	updated_at = now();

insert into public.site_settings (
	key,
	value,
	description,
	is_public
)
values (
	'site.contact',
	'{"phone":"+55 54 99630-6632","whatsapp":{"phone":"5554996306632","defaultMessage":"Olá! Vim pelo site da Noden."}}'::jsonb,
	'Dados públicos de contato.',
	true
)
on conflict (key)
do update set
	value = excluded.value,
	description = excluded.description,
	is_public = excluded.is_public,
	updated_at = now();

insert into public.site_settings (
	key,
	value,
	description,
	is_public
)
values (
	'site.service_areas',
	'{"items":["Barão","Carlos Barbosa","Salvador do Sul","São Pedro da Serra"]}'::jsonb,
	'Municípios e regiões atendidas.',
	true
)
on conflict (key)
do update set
	value = excluded.value,
	description = excluded.description,
	is_public = excluded.is_public,
	updated_at = now();

insert into public.service_pages (
	division,
	seo_title,
	seo_description,
	canonical_path,
	accent_color,
	accent_secondary_color,
	hero_eyebrow,
	hero_title,
	hero_description,
	hero_highlights,
	hero_primary_label,
	hero_primary_message,
	hero_secondary_label,
	hero_secondary_href,
	services_eyebrow,
	services_title,
	services_description,
	pricing_eyebrow,
	pricing_title,
	pricing_description,
	pricing_disclaimer,
	cta_eyebrow,
	cta_title,
	cta_description,
	cta_button_label,
	cta_message,
	cta_secondary_label,
	cta_secondary_href,
	is_published
)
values (
	'home'::public.service_division,
	'Noden Home — Suporte técnico residencial',
	'Suporte técnico residencial, manutenção de computadores, formatação, limpeza, redes Wi-Fi e configuração de dispositivos.',
	'/home',
	'#2387ff',
	'#6f35ff',
	'NODEN HOME',
	'Tecnologia funcionando bem dentro da sua casa.',
	'Suporte técnico próximo e transparente para computadores, redes, dispositivos e toda a tecnologia que faz parte da sua rotina.',
	'["Atendimento próximo","Preços justos","Explicação clara"]'::jsonb,
	'Solicitar atendimento',
	'Olá! Vim pela página Noden Home e gostaria de solicitar atendimento.',
	'Conhecer os serviços',
	'#servicos',
	'SOLUÇÕES RESIDENCIAIS',
	'Ajuda técnica sem complicação.',
	'Do computador lento à configuração completa da rede da sua casa, cada atendimento começa entendendo o problema antes de propor uma solução.',
	'VALORES INICIAIS',
	'Você entende o custo antes de começar.',
	'Os valores abaixo servem como referência inicial. O orçamento definitivo é informado depois de entendermos o equipamento e o serviço necessário.',
	'Valores iniciais sujeitos à complexidade do serviço, estado do equipamento, necessidade de peças, licenças, backup e deslocamento. Nenhum serviço adicional é realizado sem autorização.',
	'PRECISA DE AJUDA?',
	'Conte o que está acontecendo com sua tecnologia.',
	'Explique o problema pelo WhatsApp. A primeira conversa serve para entender sua necessidade e indicar o melhor caminho.',
	'Falar com a Noden Home',
	'Olá! Vim pela página Noden Home e preciso de ajuda com um equipamento.',
	'Voltar aos serviços',
	'#servicos',
	true
)
on conflict (division)
do update set
	seo_title = excluded.seo_title,
	seo_description = excluded.seo_description,
	canonical_path = excluded.canonical_path,
	accent_color = excluded.accent_color,
	accent_secondary_color = excluded.accent_secondary_color,
	hero_eyebrow = excluded.hero_eyebrow,
	hero_title = excluded.hero_title,
	hero_description = excluded.hero_description,
	hero_highlights = excluded.hero_highlights,
	hero_primary_label = excluded.hero_primary_label,
	hero_primary_message = excluded.hero_primary_message,
	hero_secondary_label = excluded.hero_secondary_label,
	hero_secondary_href = excluded.hero_secondary_href,
	services_eyebrow = excluded.services_eyebrow,
	services_title = excluded.services_title,
	services_description = excluded.services_description,
	pricing_eyebrow = excluded.pricing_eyebrow,
	pricing_title = excluded.pricing_title,
	pricing_description = excluded.pricing_description,
	pricing_disclaimer = excluded.pricing_disclaimer,
	cta_eyebrow = excluded.cta_eyebrow,
	cta_title = excluded.cta_title,
	cta_description = excluded.cta_description,
	cta_button_label = excluded.cta_button_label,
	cta_message = excluded.cta_message,
	cta_secondary_label = excluded.cta_secondary_label,
	cta_secondary_href = excluded.cta_secondary_href,
	is_published = excluded.is_published,
	updated_at = now();

insert into public.service_pages (
	division,
	seo_title,
	seo_description,
	canonical_path,
	accent_color,
	accent_secondary_color,
	hero_eyebrow,
	hero_title,
	hero_description,
	hero_highlights,
	hero_primary_label,
	hero_primary_message,
	hero_secondary_label,
	hero_secondary_href,
	services_eyebrow,
	services_title,
	services_description,
	pricing_eyebrow,
	pricing_title,
	pricing_description,
	pricing_disclaimer,
	cta_eyebrow,
	cta_title,
	cta_description,
	cta_button_label,
	cta_message,
	cta_secondary_label,
	cta_secondary_href,
	is_published
)
values (
	'game'::public.service_division,
	'Noden Game — Montagem e otimização de computadores gamer',
	'Montagem, manutenção, diagnóstico, upgrades e otimização de computadores e setups gamer.',
	'/game',
	'#9a35ff',
	'#315cff',
	'NODEN GAME',
	'Seu setup pronto para entregar mais.',
	'Montagem, revisão e otimização de computadores gamer com foco em desempenho, estabilidade e escolhas de hardware que realmente façam sentido.',
	'["Performance","Estabilidade","Custo-benefício"]'::jsonb,
	'Solicitar avaliação',
	'Olá! Vim pela página Noden Game e gostaria de avaliar meu setup.',
	'Conhecer os serviços',
	'#servicos',
	'PERFORMANCE E HARDWARE',
	'Cada componente trabalhando do jeito certo.',
	'Antes de recomendar uma troca ou upgrade, analisamos o objetivo do jogador, o hardware atual e onde realmente estão os gargalos.',
	'VALORES INICIAIS',
	'Performance com investimento consciente.',
	'Os valores são referências iniciais. Cada setup pode exigir procedimentos e testes diferentes.',
	'Valores sujeitos ao hardware, complexidade da montagem, materiais utilizados, necessidade de peças e testes adicionais. Componentes não estão incluídos.',
	'QUER MELHORAR O SETUP?',
	'Descubra onde realmente vale a pena investir.',
	'Conte quais jogos você utiliza, seu hardware atual e o que está incomodando. A análise começa pela sua necessidade, não pela peça mais cara.',
	'Falar com a Noden Game',
	'Olá! Vim pela página Noden Game e gostaria de conversar sobre meu setup.',
	'Voltar aos serviços',
	'#servicos',
	true
)
on conflict (division)
do update set
	seo_title = excluded.seo_title,
	seo_description = excluded.seo_description,
	canonical_path = excluded.canonical_path,
	accent_color = excluded.accent_color,
	accent_secondary_color = excluded.accent_secondary_color,
	hero_eyebrow = excluded.hero_eyebrow,
	hero_title = excluded.hero_title,
	hero_description = excluded.hero_description,
	hero_highlights = excluded.hero_highlights,
	hero_primary_label = excluded.hero_primary_label,
	hero_primary_message = excluded.hero_primary_message,
	hero_secondary_label = excluded.hero_secondary_label,
	hero_secondary_href = excluded.hero_secondary_href,
	services_eyebrow = excluded.services_eyebrow,
	services_title = excluded.services_title,
	services_description = excluded.services_description,
	pricing_eyebrow = excluded.pricing_eyebrow,
	pricing_title = excluded.pricing_title,
	pricing_description = excluded.pricing_description,
	pricing_disclaimer = excluded.pricing_disclaimer,
	cta_eyebrow = excluded.cta_eyebrow,
	cta_title = excluded.cta_title,
	cta_description = excluded.cta_description,
	cta_button_label = excluded.cta_button_label,
	cta_message = excluded.cta_message,
	cta_secondary_label = excluded.cta_secondary_label,
	cta_secondary_href = excluded.cta_secondary_href,
	is_published = excluded.is_published,
	updated_at = now();

insert into public.service_pages (
	division,
	seo_title,
	seo_description,
	canonical_path,
	accent_color,
	accent_secondary_color,
	hero_eyebrow,
	hero_title,
	hero_description,
	hero_highlights,
	hero_primary_label,
	hero_primary_message,
	hero_secondary_label,
	hero_secondary_href,
	services_eyebrow,
	services_title,
	services_description,
	pricing_eyebrow,
	pricing_title,
	pricing_description,
	pricing_disclaimer,
	cta_eyebrow,
	cta_title,
	cta_description,
	cta_button_label,
	cta_message,
	cta_secondary_label,
	cta_secondary_href,
	is_published
)
values (
	'data'::public.service_division,
	'Noden Data — Software, automação, dados e BI',
	'Desenvolvimento de software, sites, automações, dashboards, integração de dados e soluções digitais para empresas.',
	'/data',
	'#08a8ff',
	'#2354ff',
	'NODEN DATA',
	'Soluções digitais para organizar e evoluir seu negócio.',
	'Software, automação, dados e inteligência de negócio aplicados a problemas reais, respeitando o tamanho e o momento de cada empresa.',
	'["Software","Automação","Dados e BI"]'::jsonb,
	'Apresentar uma necessidade',
	'Olá! Vim pela página Noden Data e gostaria de conversar sobre uma solução para meu negócio.',
	'Conhecer as soluções',
	'#servicos',
	'SOFTWARE E DADOS',
	'Tecnologia aplicada ao que sua empresa precisa.',
	'Cada projeto começa entendendo o processo, as dificuldades atuais e o resultado que precisa ser alcançado.',
	'FORMATOS DE PROJETO',
	'Uma proposta adequada à necessidade.',
	'Projetos digitais variam bastante em escopo. Os valores abaixo servem apenas como ponto de partida para a conversa.',
	'Os valores dependem de escopo, integrações, infraestrutura, domínio, hospedagem, volume de dados, prazo e necessidade de suporte contínuo.',
	'VAMOS ENTENDER O PROBLEMA?',
	'Antes de desenvolver, precisamos compreender.',
	'Conte como o processo funciona hoje, onde estão as dificuldades e qual resultado você gostaria de alcançar.',
	'Falar com a Noden Data',
	'Olá! Vim pela página Noden Data e gostaria de apresentar uma necessidade do meu negócio.',
	'Voltar às soluções',
	'#servicos',
	true
)
on conflict (division)
do update set
	seo_title = excluded.seo_title,
	seo_description = excluded.seo_description,
	canonical_path = excluded.canonical_path,
	accent_color = excluded.accent_color,
	accent_secondary_color = excluded.accent_secondary_color,
	hero_eyebrow = excluded.hero_eyebrow,
	hero_title = excluded.hero_title,
	hero_description = excluded.hero_description,
	hero_highlights = excluded.hero_highlights,
	hero_primary_label = excluded.hero_primary_label,
	hero_primary_message = excluded.hero_primary_message,
	hero_secondary_label = excluded.hero_secondary_label,
	hero_secondary_href = excluded.hero_secondary_href,
	services_eyebrow = excluded.services_eyebrow,
	services_title = excluded.services_title,
	services_description = excluded.services_description,
	pricing_eyebrow = excluded.pricing_eyebrow,
	pricing_title = excluded.pricing_title,
	pricing_description = excluded.pricing_description,
	pricing_disclaimer = excluded.pricing_disclaimer,
	cta_eyebrow = excluded.cta_eyebrow,
	cta_title = excluded.cta_title,
	cta_description = excluded.cta_description,
	cta_button_label = excluded.cta_button_label,
	cta_message = excluded.cta_message,
	cta_secondary_label = excluded.cta_secondary_label,
	cta_secondary_href = excluded.cta_secondary_href,
	is_published = excluded.is_published,
	updated_at = now();

-- Recria os filhos das três páginas para manter o seed reproduzível.
delete from public.pricing_items
where service_page_id in (
	select id
	from public.service_pages
	where division in (
		'home',
		'game',
		'data'
	)
);

delete from public.services
where service_page_id in (
	select id
	from public.service_pages
	where division in (
		'home',
		'game',
		'data'
	)
);

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Diagnóstico e suporte',
	'Identificação de lentidão, travamentos, falhas no sistema e problemas de configuração.',
	'["Análise inicial do equipamento","Identificação da causa provável","Orçamento antes da execução"]'::jsonb,
	'Primeiro passo',
	true,
	0
from public.service_pages as page
where page.division =
	'home'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Formatação e configuração',
	'Instalação limpa do sistema e preparação do computador para voltar ao uso.',
	'["Instalação do sistema","Drivers e atualizações","Programas essenciais","Configurações iniciais"]'::jsonb,
	null,
	true,
	1
from public.service_pages as page
where page.division =
	'home'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Limpeza e manutenção',
	'Cuidados preventivos para reduzir temperatura, ruído e perda de desempenho.',
	'["Limpeza interna","Verificação das temperaturas","Revisão de ventoinhas","Testes após o serviço"]'::jsonb,
	null,
	true,
	2
from public.service_pages as page
where page.division =
	'home'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Redes e Wi-Fi',
	'Configuração e melhoria da conexão entre roteadores, computadores e dispositivos.',
	'["Configuração de roteadores","Análise de cobertura","Organização da rede","Conexão de dispositivos"]'::jsonb,
	null,
	true,
	3
from public.service_pages as page
where page.division =
	'home'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Instalação de equipamentos',
	'Configuração de impressoras, câmeras, periféricos e outros dispositivos da casa.',
	'["Instalação e configuração","Conexão à rede","Testes de funcionamento","Orientação de uso"]'::jsonb,
	null,
	true,
	4
from public.service_pages as page
where page.division =
	'home'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Orientação para compra',
	'Ajuda para escolher computadores, peças e equipamentos adequados à sua necessidade.',
	'["Análise da finalidade","Comparação de opções","Recomendação sem vínculo com loja","Foco em custo-benefício"]'::jsonb,
	null,
	true,
	5
from public.service_pages as page
where page.division =
	'home'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Montagem de computador gamer',
	'Montagem completa com organização, configuração e testes de estabilidade.',
	'["Verificação de compatibilidade","Montagem e organização de cabos","Configuração da BIOS","Testes de funcionamento"]'::jsonb,
	'Setup completo',
	true,
	0
from public.service_pages as page
where page.division =
	'game'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Diagnóstico de desempenho',
	'Análise de travamentos, quedas de FPS, temperaturas e limitações do hardware.',
	'["Análise de gargalos","Testes de CPU e GPU","Monitoramento de temperaturas","Orientação sobre melhorias"]'::jsonb,
	null,
	true,
	1
from public.service_pages as page
where page.division =
	'game'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Upgrades de hardware',
	'Planejamento e instalação de melhorias compatíveis com o computador atual.',
	'["Memória e armazenamento","Placa de vídeo","Processador e placa-mãe","Fonte e refrigeração"]'::jsonb,
	null,
	true,
	2
from public.service_pages as page
where page.division =
	'game'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Limpeza e refrigeração',
	'Manutenção preventiva para controlar temperaturas, ruídos e perda de desempenho.',
	'["Limpeza interna detalhada","Revisão das ventoinhas","Análise do fluxo de ar","Testes de temperatura"]'::jsonb,
	null,
	true,
	3
from public.service_pages as page
where page.division =
	'game'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Otimização do sistema',
	'Configuração do sistema, drivers e recursos utilizados durante os jogos.',
	'["Atualização de drivers","Revisão de processos","Configuração de energia","Testes de estabilidade"]'::jsonb,
	null,
	true,
	4
from public.service_pages as page
where page.division =
	'game'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Consultoria para peças',
	'Ajuda para escolher componentes compatíveis com o objetivo e orçamento disponíveis.',
	'["Análise do setup atual","Comparação de componentes","Compatibilidade entre peças","Planejamento de upgrades"]'::jsonb,
	null,
	true,
	5
from public.service_pages as page
where page.division =
	'game'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Sites institucionais',
	'Presença digital profissional, responsiva e preparada para apresentar sua empresa.',
	'["Design responsivo","Informações de contato","Integração com redes sociais","Configuração de domínio"]'::jsonb,
	'Presença digital',
	true,
	0
from public.service_pages as page
where page.division =
	'data'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Sistemas personalizados',
	'Desenvolvimento de soluções para organizar operações e processos específicos.',
	'["Levantamento da necessidade","Desenvolvimento sob medida","Controle de usuários","Evolução contínua"]'::jsonb,
	null,
	true,
	1
from public.service_pages as page
where page.division =
	'data'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Automação de processos',
	'Redução de tarefas repetitivas e integração entre informações e ferramentas.',
	'["Automação de relatórios","Importação e exportação de dados","Processamento programado","Integração entre sistemas"]'::jsonb,
	null,
	true,
	2
from public.service_pages as page
where page.division =
	'data'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Dashboards e indicadores',
	'Visualização de resultados para acompanhar operações e apoiar decisões.',
	'["Definição de indicadores","Dashboards interativos","Atualização automatizada","Visão gerencial"]'::jsonb,
	null,
	true,
	3
from public.service_pages as page
where page.division =
	'data'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Organização e integração de dados',
	'Estruturação das informações utilizadas por sistemas, planilhas e relatórios.',
	'["Tratamento de dados","Padronização de informações","Integração de fontes","Preparação para análises"]'::jsonb,
	null,
	true,
	4
from public.service_pages as page
where page.division =
	'data'::public.service_division;

insert into public.services (
	service_page_id,
	title,
	description,
	features,
	badge,
	is_active,
	sort_order
)
select
	page.id,
	'Suporte e evolução de software',
	'Manutenção e melhoria de sistemas, sites e soluções digitais existentes.',
	'["Correção de problemas","Novas funcionalidades","Atualizações técnicas","Acompanhamento contínuo"]'::jsonb,
	null,
	true,
	5
from public.service_pages as page
where page.division =
	'data'::public.service_division;

insert into public.pricing_items (
	service_page_id,
	name,
	description,
	price_type,
	price,
	price_prefix,
	price_label,
	price_suffix,
	features,
	badge,
	note,
	is_featured,
	is_active,
	sort_order,
	cta_label,
	cta_message
)
select
	page.id,
	'Diagnóstico técnico',
	'Avaliação inicial para identificar a provável causa do problema.',
	'starting_at'::public.price_type,
	50,
	'A partir de',
	null,
	null,
	'["Análise do equipamento","Identificação inicial da falha","Orientação sobre a solução"]'::jsonb,
	null,
	'O valor poderá ser considerado no orçamento quando o serviço for executado pela Noden.',
	false,
	true,
	0,
	null,
	'Olá! Gostaria de solicitar um diagnóstico técnico com a Noden Home.'
from public.service_pages as page
where page.division =
	'home'::public.service_division;

insert into public.pricing_items (
	service_page_id,
	name,
	description,
	price_type,
	price,
	price_prefix,
	price_label,
	price_suffix,
	features,
	badge,
	note,
	is_featured,
	is_active,
	sort_order,
	cta_label,
	cta_message
)
select
	page.id,
	'Formatação completa',
	'Reinstalação e configuração inicial do sistema operacional.',
	'starting_at'::public.price_type,
	90,
	'A partir de',
	null,
	null,
	'["Instalação do sistema","Drivers e atualizações","Programas essenciais","Testes de funcionamento"]'::jsonb,
	'Mais procurado',
	'Backup, recuperação de arquivos e licenças são avaliados separadamente.',
	true,
	true,
	1,
	null,
	'Olá! Gostaria de saber mais sobre o serviço de formatação da Noden Home.'
from public.service_pages as page
where page.division =
	'home'::public.service_division;

insert into public.pricing_items (
	service_page_id,
	name,
	description,
	price_type,
	price,
	price_prefix,
	price_label,
	price_suffix,
	features,
	badge,
	note,
	is_featured,
	is_active,
	sort_order,
	cta_label,
	cta_message
)
select
	page.id,
	'Limpeza preventiva',
	'Limpeza interna e revisão básica do sistema de refrigeração.',
	'starting_at'::public.price_type,
	100,
	'A partir de',
	null,
	null,
	'["Limpeza interna","Verificação de ventoinhas","Análise de temperaturas","Testes após a manutenção"]'::jsonb,
	null,
	'Troca de pasta térmica e materiais específicos dependem do equipamento.',
	false,
	true,
	2,
	null,
	'Olá! Gostaria de solicitar uma limpeza preventiva com a Noden Home.'
from public.service_pages as page
where page.division =
	'home'::public.service_division;

insert into public.pricing_items (
	service_page_id,
	name,
	description,
	price_type,
	price,
	price_prefix,
	price_label,
	price_suffix,
	features,
	badge,
	note,
	is_featured,
	is_active,
	sort_order,
	cta_label,
	cta_message
)
select
	page.id,
	'Diagnóstico gamer',
	'Análise inicial de desempenho, temperaturas, gargalos e estabilidade.',
	'starting_at'::public.price_type,
	60,
	'A partir de',
	null,
	null,
	'["Análise do hardware","Testes de desempenho","Monitoramento de temperatura","Orientação sobre melhorias"]'::jsonb,
	null,
	null,
	false,
	true,
	0,
	null,
	'Olá! Gostaria de solicitar um diagnóstico gamer com a Noden Game.'
from public.service_pages as page
where page.division =
	'game'::public.service_division;

insert into public.pricing_items (
	service_page_id,
	name,
	description,
	price_type,
	price,
	price_prefix,
	price_label,
	price_suffix,
	features,
	badge,
	note,
	is_featured,
	is_active,
	sort_order,
	cta_label,
	cta_message
)
select
	page.id,
	'Manutenção completa',
	'Limpeza detalhada, revisão da refrigeração e testes do equipamento.',
	'starting_at'::public.price_type,
	130,
	'A partir de',
	null,
	null,
	'["Limpeza interna","Revisão das ventoinhas","Análise de temperaturas","Testes de estabilidade"]'::jsonb,
	'Mais procurado',
	'Materiais térmicos e procedimentos específicos são avaliados conforme o equipamento.',
	true,
	true,
	1,
	null,
	'Olá! Gostaria de solicitar uma manutenção completa com a Noden Game.'
from public.service_pages as page
where page.division =
	'game'::public.service_division;

insert into public.pricing_items (
	service_page_id,
	name,
	description,
	price_type,
	price,
	price_prefix,
	price_label,
	price_suffix,
	features,
	badge,
	note,
	is_featured,
	is_active,
	sort_order,
	cta_label,
	cta_message
)
select
	page.id,
	'Montagem completa',
	'Montagem de computador gamer com organização, configuração e testes.',
	'starting_at'::public.price_type,
	180,
	'A partir de',
	null,
	null,
	'["Montagem dos componentes","Organização dos cabos","Configuração inicial","Testes de funcionamento"]'::jsonb,
	null,
	'Não inclui sistema operacional, licenças ou aquisição dos componentes.',
	false,
	true,
	2,
	null,
	'Olá! Gostaria de solicitar a montagem de um computador com a Noden Game.'
from public.service_pages as page
where page.division =
	'game'::public.service_division;

insert into public.pricing_items (
	service_page_id,
	name,
	description,
	price_type,
	price,
	price_prefix,
	price_label,
	price_suffix,
	features,
	badge,
	note,
	is_featured,
	is_active,
	sort_order,
	cta_label,
	cta_message
)
select
	page.id,
	'Análise inicial',
	'Conversa e levantamento para compreender o problema e possíveis caminhos.',
	'free'::public.price_type,
	null,
	null,
	'Sem custo',
	null,
	'["Entendimento da necessidade","Análise inicial de viabilidade","Definição dos próximos passos"]'::jsonb,
	null,
	null,
	false,
	true,
	0,
	'Apresentar uma ideia',
	'Olá! Gostaria de apresentar uma ideia ou necessidade para a Noden Data.'
from public.service_pages as page
where page.division =
	'data'::public.service_division;

insert into public.pricing_items (
	service_page_id,
	name,
	description,
	price_type,
	price,
	price_prefix,
	price_label,
	price_suffix,
	features,
	badge,
	note,
	is_featured,
	is_active,
	sort_order,
	cta_label,
	cta_message
)
select
	page.id,
	'Site institucional',
	'Projeto para apresentar serviços, contatos e informações da empresa.',
	'starting_at'::public.price_type,
	900,
	'A partir de',
	null,
	null,
	'["Layout responsivo","Páginas institucionais","Contato e redes sociais","Publicação inicial"]'::jsonb,
	'Presença digital',
	'Domínio, hospedagem, identidade visual e recursos específicos são avaliados separadamente.',
	true,
	true,
	1,
	null,
	'Olá! Gostaria de solicitar uma proposta para um site institucional.'
from public.service_pages as page
where page.division =
	'data'::public.service_division;

insert into public.pricing_items (
	service_page_id,
	name,
	description,
	price_type,
	price,
	price_prefix,
	price_label,
	price_suffix,
	features,
	badge,
	note,
	is_featured,
	is_active,
	sort_order,
	cta_label,
	cta_message
)
select
	page.id,
	'Solução personalizada',
	'Sistemas, automações, dashboards e integrações desenvolvidos conforme o processo.',
	'consultation'::public.price_type,
	null,
	null,
	'Sob consulta',
	null,
	'["Levantamento do processo","Definição do escopo","Desenvolvimento por etapas","Proposta personalizada"]'::jsonb,
	null,
	null,
	false,
	true,
	2,
	null,
	'Olá! Gostaria de conversar sobre uma solução personalizada com a Noden Data.'
from public.service_pages as page
where page.division =
	'data'::public.service_division;

insert into public.social_links (
	platform,
	label,
	url,
	username,
	is_active,
	sort_order
)
values (
	'instagram',
	'Instagram',
	'https://instagram.com/noden.hub',
	'@noden.hub',
	true,
	0
)
on conflict (platform)
do update set
	label = excluded.label,
	url = excluded.url,
	username = excluded.username,
	is_active = excluded.is_active,
	sort_order = excluded.sort_order,
	updated_at = now();

insert into public.social_links (
	platform,
	label,
	url,
	username,
	is_active,
	sort_order
)
values (
	'whatsapp',
	'WhatsApp',
	'https://wa.me/5554996306632',
	'+55 54 99630-6632',
	true,
	1
)
on conflict (platform)
do update set
	label = excluded.label,
	url = excluded.url,
	username = excluded.username,
	is_active = excluded.is_active,
	sort_order = excluded.sort_order,
	updated_at = now();

insert into public.social_links (
	platform,
	label,
	url,
	username,
	is_active,
	sort_order
)
values (
	'website',
	'Site',
	'https://nodenhub.com.br',
	'nodenhub.com.br',
	true,
	2
)
on conflict (platform)
do update set
	label = excluded.label,
	url = excluded.url,
	username = excluded.username,
	is_active = excluded.is_active,
	sort_order = excluded.sort_order,
	updated_at = now();

alter table public.site_settings
	enable trigger site_settings_write_audit;

alter table public.service_pages
	enable trigger service_pages_write_audit;

alter table public.services
	enable trigger services_write_audit;

alter table public.pricing_items
	enable trigger pricing_items_write_audit;

alter table public.social_links
	enable trigger social_links_write_audit;

commit;
