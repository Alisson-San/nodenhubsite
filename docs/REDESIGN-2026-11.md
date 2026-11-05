# Novo visual, rotas e edição no site — 05/11/2026

Branch: `claude/confident-bohr-stupb0`, a partir da `develop` (94dfde9).

## Decisões do responsável
- Rotas das divisões: `/noden-home`, `/noden-game`, `/noden-data`.
- Base visual clara, com blocos nas cores da logo.
- Promessas confirmadas para o marketing: **atendimento no mesmo dia** (conforme agenda) e **busca e entrega do equipamento**. Também usadas, porque já estavam publicadas: avaliação remota grátis (Home), orçamento antes, compatibilidade antes da compra e testes no final (Game).
- Edição no site com **rascunho + Publicar**.

## Rotas
| Antes | Agora | Observação |
|---|---|---|
| `/` (desktop) e `/mobile` (celular, por user-agent) | `/` | Uma página responsiva. `/mobile` → 301 para `/`. Removido o redirecionamento por user-agent do `vercel.json`. |
| `/home`, `/game`, `/data` | `/noden-home`, `/noden-game`, `/noden-data` | 301 em `astro.config.mjs`. O fragmento (`#precos`) é preservado. |
| `/produtos/[slug]` | igual | Link de volta aponta para a nova rota da divisão. |
| `/dev/components`, `/dev/services` | removidas | Vitrines de componentes antigos. |

O caminho da divisão vem de `src/lib/site/divisions.ts`; `canonical_path` e links antigos salvos no banco são convertidos por `modernizePath`. Campanhas salvas com páginas antigas continuam valendo (`normalizeCampaignPages`).

## Visual
- `src/styles/noden.css`: tokens, tipografia (Bricolage Grotesque + Instrument Sans, servidas pelo próprio site), botões, chips e a lista de promessas. Contrastes medidos estão no topo do arquivo.
- Cor por divisão: Home = ciano (texto escuro), Game = violeta (abertura escura), Data = índigo. Os três anéis da logo são o elemento gráfico: na inicial, cada anel é o link de uma divisão.
- Saíram: fundo azul-marinho com brilhos, rótulos em caixa alta acima de cada título, grades de cards iguais com ícone brilhante e a animação GSAP da inicial (`gsap` e `lenis` removidos).
- Celular: menu em tela cheia sem links invisíveis focáveis, botão fixo de WhatsApp que aparece após a abertura, sem rolagem horizontal de 320 px a 1440 px.

## Edição no site
Com sessão de administrador, as páginas `/`, `/noden-home`, `/noden-game` e `/noden-data` abrem em modo de edição (o middleware só consulta a sessão quando há cookie de autenticação; visitantes não pagam esse custo).

- **Textos**: clique e digite no próprio lugar. Enter confirma, Escape desfaz.
- **Cards de soluções e itens de preço**: barra em cada card com Editar (modal), ↑/↓ (dentro da categoria), Ocultar/Mostrar e Excluir (confirmação). Botões "+ Nova solução" e "+ Novo item em …".
- **Promessas e etapas**: "Editar promessas"/"Editar etapas" (modal com 1 a 6 itens).
- **Textos e Google**: modal com todos os textos, mensagens de WhatsApp e SEO. Botão **Preencher com textos sugeridos** carrega a proposta de `src/data/marketingCopy.ts` para revisão.
- **Barra inferior**: Ver como visitante, Descartar, Salvar rascunho, Publicar.

### Onde fica cada coisa
| Conteúdo | Rascunho | Ao publicar |
|---|---|---|
| Itens, cards, detalhes de produto | `catalog_drafts.document` | `catalog_editor_publish` (atômico, já existente) |
| Textos da divisão | `catalog_drafts.document.page` | `service_pages` |
| Promessas e etapas | `catalog_drafts.document.extras` | `site_settings` `site.division_content` (público) |
| Textos da inicial | `site_settings` `site.home_draft` (privado) | `site_settings` `site.identity.home` |

Ordem de publicação da divisão: catálogo → promessas → textos (que alteram a revisão de origem) → descarte do rascunho. Se um passo falhar, o rascunho fica e uma nova tentativa reaplica tudo. **Nenhuma migração nova**: os campos extras viajam no JSON do rascunho, que a função SQL aceita.

O editor antigo (`/admin/editor`, agora "Editor de produtos") continua para mídias, FAQ e etapas de produto. Os formulários antigos de `/admin/pages` e `/admin/catalog` gravam direto; se usados com um rascunho aberto, a publicação acusa conflito e orienta descartar.

## Verificação
- `npm run validate`: 0 erros, 0 avisos.
- Testes unitários: 37 (7 arquivos), incluindo regras novas de textos, promessas, rotas, campanhas antigas e operações do editor.
- `scripts/qa/routing.test.mjs`: sem redirecionamento por user-agent, 301 das rotas antigas, rotas renderizadas.
- `scripts/qa/catalog-database.test.mjs` (PGlite): 10 grupos.
- `scripts/qa/public-site.cjs`: 5 páginas × 6 tamanhos (320×740, 390×844, 768×1024, 910×698, 1440×900, 740×360) sem rolagem horizontal; menu por teclado e Escape; busca sem acento e estado vazio; botão fixo; link "Pular para o conteúdo"; 301; 404; movimento reduzido.
- `scripts/qa/inline-editor.cjs` com `DEV_EDITOR_FIXTURE=true`: 15 fluxos (texto no lugar, modal de item, validação, nova solução, novo item, mover, ocultar, excluir, promessas, textos e Google, textos sugeridos, publicar, modo visitante, inicial). Os envios foram validados pelas mesmas regras do servidor.
- Função de produção executada localmente: páginas 200, inexistentes 404, admin sem sessão 303/401.

## Limites e pendências
- **Não testado com sessão real de administrador no Supabase** (o banco não é acessível desta sessão). Testar no ambiente da develop: salvar rascunho, recarregar, publicar e conferir a página pública numa divisão, de preferência com um item oculto de teste.
- Os textos de venda sugeridos **não foram gravados** no banco: use "Preencher com textos sugeridos" no modo de edição de cada divisão e publique quando aprovar.
- O conteúdo de reserva (`src/data/servicePages.ts`) tem menos itens que o banco; aparece só se o Supabase falhar.
- Imagens e mídias de produto continuam no "Editor de produtos" do painel.
- Alertas anteriores do Supabase (`write_audit_log`, proteção de senhas vazadas) seguem pendentes.
- `npm audit`: 4 moderados de build (glob/minimatch via adaptador Vercel); correção exigiria rebaixar o adaptador.

## Atualização — apresentação dos três nós
A ideia original da inicial voltou, refeita sem GSAP (`src/components/site/NodeStory.astro` + `src/lib/site/nodeStory.ts`, ~6 KB):

0. Logo Noden unida (geometria e gradientes da logo oficial).
1. Os nós se separam e formam uma rede, com pacotes circulando entre eles e os ícones aparecendo.
2–4. Cada divisão ganha o centro com sua marca: Noden Home (casinha, anel de cima), Noden Game (controle, esquerda), Noden Data (banco de dados, direita). Texto, destaques e preço "a partir de" ao lado.
5. Os nós voltam às posições da logo, os conectores se desenham e surge **N◎DEN HUB**: o centro que conecta as três.

- Trilha lateral com os seis atos, link "Pular apresentação" e links diretos (`/#apresentacao-game`).
- O texto de todos os atos continua acessível a leitores de tela e teclado; ao receber foco, a cena vai até o ato.
- Leitura normal (sem fixar a cena) com movimento reduzido, sem JavaScript, em tela baixa, quando algum texto não cabe, e no modo de edição.
- Testado em 1440×900, 1280×720, 1024×768, 910×698, 768×1024, 740×600 e 390×844. Em 360×640 o texto não cabe e a página usa leitura normal.

Marcas individuais (`DivisionMark`/`DivisionIcon`, recuperadas da versão anterior): menu, rodapé, links, abertura de cada divisão (mini-rede com a divisão ligada às outras duas), cartões e faixa de serviços.
Também novos: faixa contínua de serviços (`ServiceTicker`) e "Como funciona" como caminho de nós com um pacote percorrendo (`NodePath`), nas páginas das divisões e na inicial.
Textos editáveis novos: `storyTitle` e `storyDescription` (fim da apresentação).

## Atualização — fidelidade da logo e rodada criativa
- **Logo**: a logo oficial é uma fita contínua (os anéis se abrem e se ligam), não três círculos com conectores. A geometria foi medida em `public/Design sem nome.png` (`src/lib/site/brand.ts`: centro, raio, espessura e degradê de cada anel). Nos momentos unidos a apresentação mostra a imagem oficial (`public/brand/noden-symbol.webp`); os nós vetoriais coincidem com os anéis e assumem quando a fita se abre. Cabeçalho e rodapé também usam a imagem oficial.
- **Apresentação**: palco escuro com textura de rede. Entre as divisões o triângulo gira 120°, sempre no mesmo sentido; a divisão da vez sobe ao centro e as outras ficam nos cantos, com cor e ícone. A volta completa recompõe a logo em N◎DEN TECHNOLOGY HUB.
- **Ícones** na cor do próprio anel (casinha, controle, banco de dados), em todo o site.
- **Jornada** (`Journey.astro`) substitui a faixa de promessas e o "como funciona": uma van percorre a rota com a rolagem e cada parada mostra a etapa e a promessa que acontece nela. Nas divisões usa a cor da divisão e as promessas/etapas editáveis (pareadas pela ordem).
- **Chamada final**: exemplo de conversa no WhatsApp que se escreve ao aparecer (rotulado como exemplo; só promessas confirmadas), com as três marcas orbitando. Uma conversa por divisão.
- **Menos branco**: fundo lavanda com textura de pontos e área de preços na cor da divisão. `--cyan-text` escurecido para manter 5,3:1 no fundo novo.
- Removidos: faixa contínua de serviços, barra de promessas, caminho de nós antigo e o símbolo vetorial com conectores.
- Verificação: `npm run validate` sem erros/avisos; 42 testes unitários; `public-site.cjs` (incluindo jornada, conversa e movimento reduzido) e `inline-editor.cjs` sem falhas.

## Atualização — visual refinado, orçamento e vitrine
- **Redes sociais** com ícones (`SocialIcon.astro`): rodapé, página de links e menu do celular.
- **Visual**: saem bordas pretas grossas, sombras duras e blocos chapados. Entram fundos com luzes desfocadas, vidro, degradês nas cores da logo e botões com brilho. Tema por página (`data-theme`): inicial escura "aurora"; Noden Home clara com céu e ondas de Wi-Fi; Noden Game escura com piso neon e borda RGB animada; Noden Data escura com grade técnica e detalhes em fonte mono. Revelação suave ao rolar (decidida antes da primeira pintura, com salvaguarda de 3 s).
- **Explorador de serviços** (`Solutions.astro`): abas acessíveis (setas, Home/End) com painel grande; em tela estreita, sem JS ou no modo de edição vira lista.
- **Monte seu orçamento** (`Catalog.astro` + `lib/site/quote.ts`): o visitante adiciona itens, vê o total de referência ("a partir de" e itens sob consulta tratados) e envia a lista pronta no WhatsApp. A seleção sobrevive à recarga (sessionStorage).
- **Vitrine** (`Showcase.astro`): portfólio da Noden Data (cartões em moldura de navegador, link do projeto, tecnologias) e galeria de setups da Noden Game (mosaico com ficha técnica). Visualizador com todas as imagens, setas e teclado. Cadastro no próprio site (modal com envio de imagens, descrição obrigatória, publicar/ocultar, ordenar, excluir).
  - Migração `supabase/migrations/20261105185813_showcase.sql` (tabela `showcase_items` com RLS e bucket público `showcase-media`, escrita só de admins). **Aplicada em 05/11/2026 com autorização do responsável** (arquivo renomeado para a versão registrada pelo Supabase). Verificado no banco real, em transação desfeita: admin vê rascunhos e envia imagem; visitante vê só o publicado e não grava; usuário logado sem papel de admin não altera nem envia. Nenhum dado de teste ficou gravado; advisors sem alertas novos. A seção aparece para visitantes quando houver o primeiro item publicado.
  - Testada em PGlite: `scripts/qa/showcase-database.test.mjs` (11 verificações).

### Verificação
- `npm run validate` sem erros/avisos; 48 testes unitários; 3 de rotas; 10 grupos SQL do catálogo e 11 da vitrine.
- `public-site.cjs`: 6 tamanhos sem rolagem lateral, carregamento sem atos sobrepostos, apresentação, jornada, conversa, explorador por teclado, orçamento (soma, mensagem, recarga, limpar), vitrine oculta sem itens, movimento reduzido e sem JavaScript.
- `inline-editor.cjs`: 16 fluxos, incluindo cadastro na vitrine com imagem.

### Pendente
- Cadastrar os primeiros projetos/setups com fotos reais (modo de edição nas páginas Noden Data e Noden Game).
- Testar com login real de administrador (edição, publicação e envio de imagens).
