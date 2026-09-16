# Revisão de apresentação, navegação e configuração — Noden

Data: 15/09/2026. Alvo: site local em `http://localhost:4321/`.

## Resultado principal

A marca possui uma linguagem visual consistente: base escura, gradientes azul/ciano/roxo, símbolo próprio e divisões reconhecíveis. As páginas de serviços explicam melhor a oferta que a abertura institucional. O maior problema confirmado está na navegação da página inicial no celular: os saltos para Home e Contato levam a áreas vazias. Foco em links invisíveis e ausência de destino real para os fragmentos também precisam de correção antes do refinamento visual.

**Atualização após liberação do acesso:** o WSL voltou a responder e o código foi inspecionado no commit `b6646da`. Os documentos foram preparados para integração na raiz, preservando as instruções existentes. A matriz contém agora a cobertura comprovada por leitura de formulários, APIs e repositórios. O painel continua sem teste de persistência: sua última verificação exibiu erro por ausência de `PUBLIC_SUPABASE_URL`. Os achados abaixo não são uma auditoria de segurança ou uma validação integral de produção. Os registros de bloqueio na cobertura inicial descrevem a primeira etapa.

## Complemento de revisão do código

- `src/pages/index.astro`: H1, Quem somos, resumos das divisões, navegação e textos de encerramento são literais no template. A página carrega configuração institucional, áreas atendidas e URL de contato, mas não usa os campos editoriais de `service_pages` para esses textos. Isso confirma uma lacuna de edição da página inicial, distinta das páginas de divisão.
- `src/pages/admin/pages/[division].astro` e sua API: há campos de SEO, canonical, cores, hero, botões, introduções, ressalvas, CTA final e publicação, com validações e atualização de `service_pages`. Não criar um segundo editor para funcionalidades já existentes.
- Configurações: formulário e API gravam identidade, contato e regiões em `site_settings`; redes têm fluxo em `social_links`. Cards institucionais têm formulário e API para `services`. Preços têm `PricingForm.astro` e API via RPC. Persistência real ainda não testada.
- `src/pages/links.astro` e `src/data/links.ts`: bio/título e parte dos cartões são fixos; telefone, áreas e Instagram vêm da configuração. A página de links é parcialmente alimentada pelo backend, não totalmente editável.
- `src/pages/index.astro:1375`: os cliques interceptam o comportamento padrão para saltar na timeline. O CSS móvel em torno da linha 2483 usa opacidade e `pointer-events`, sem retirar por si só os links do foco; isso sustenta NOD-02 e NOD-04.
- `src/config/site.ts:96`: a função central gera `whatsapp://send`; corrigir esse ponto compartilhado, após testar consumidores, em vez de trocar URLs isoladamente.
- `vercel.json`: existe redirecionamento de `/` para `/mobile` baseado em User-Agent móvel. **NOD-01 foi reproduzido na página `/` local com viewport reduzido; não prova que o mesmo fluxo ocorre em celulares na produção.** Validar o redirecionamento e ambas as páginas, incluindo navegadores estreitos com User-Agent desktop. `src/pages/mobile.astro` contém uma apresentação própria com textos fixos; não remover nem substituir sem avaliar essa arquitetura.
- `serviceRepository.ts:600`: busca `service_pages` publicadas; ausência de página sem erro retorna `null`, sem fallback intencional. O fluxo de publicação existe e deve ser testado com backend. Confirmar separadamente o comportamento em falha de consulta.

Essas evidências complementam NOD-03, NOD-14 e NOD-16. Elas não substituem teste de edição, autenticação, persistência ou produção. A falha de posicionamento móvel ainda requer investigação de causa antes de alteração.

## Cobertura e evidência

| Área | Teste realizado | Resultado |
|---|---|---|
| `/` desktop, 910×698 | Abertura, Quem somos, Noden Home, acesso a `/home` | Conteúdo e transições acessíveis; composição densa em tela baixa |
| `/` desktop, 1440×900 | Abertura, Data, Contato | Seções aparecem; contato visível |
| `/` móvel, 390×844 | Menu, foco, Escape, Home, recarga, Contato | Home/Contato vazios; foco em links ocultos; Escape não fecha |
| `/home` | Conteúdo, preços e busca com 1/0/3 resultados | Busca e limpeza funcionam |
| `/home` móvel | 390×844 e 320×740, menu e `#servicos` | Texto/CTA legíveis; sem overflow horizontal no estado medido a 320 px; menu abre; âncora chega à seção |
| `/game`, `/data` desktop | Conteúdo completo e primeira tela | Divisões e preços renderizados; aparência consistente |
| `/links` | Conteúdo, destinos de contato e links | Links principais presentes; nenhum contato externo foi enviado |
| `/mobile` | Acesso em desktop | Navegador terminou em `/`; comportamento em dispositivo real não testado |
| `/#noden-home` desktop | Abertura direta | Permanece no início, com seção Home invisível |
| `/admin/login` | Acesso local | Erro visível: variável `PUBLIC_SUPABASE_URL` ausente |
| Código/CI/banco/produção | Sem acesso atual | Pendente; não assumir resultado da etapa anterior como validação atual |

Testes móveis usaram tamanho de viewport, não um dispositivo físico. Movimento reduzido, JavaScript desabilitado, leitor de tela, zoom, navegadores alternativos e métricas de desempenho permanecem pendentes.

## Fila de correções

P1: alta prioridade por bloquear acesso, contato ou operação. P2: qualidade e usabilidade. P3: refinamento. “Recomendação” não significa defeito funcional confirmado.

### NOD-01 — P1 — navegação móvel leva a área vazia [CONFIRMADO]

- Local: `/`, 390×844.
- Reprodução: abrir menu → Noden Home; repetir após recarregar. Depois abrir menu → Contato.
- Observado: só cabeçalho e fundo escuro. Home foi reproduzido duas vezes. O menu fecha, mas a informação não entra na tela.
- Medição Home: `scrollY≈5596,8`, topo de `#home-copy≈-5349,3`, topo de `#brand-scene≈-5631,8`. Contato: `scrollY≈12238,4`, botão de contato acima da tela em aproximadamente 11.726 px.
- Evidências: [Home vazio](evidencias/01-mobile-home-vazio.png), [Contato vazio](evidencias/02-mobile-contato-vazio.png).
- Impacto: visitante não encontra os serviços nem o contato pela navegação principal.
- Investigar: interação entre posicionamento da cena, altura de rolagem, breakpoints e animação. A causa no código ainda não foi confirmada.
- Aceitação: todas as seções e CTAs alcançáveis em 320/390/768 px, após entrada direta, recarga, resize e rolagem normal. Conteúdo sem dependência de pinning quebrado; manter alternativa em fluxo normal.

### NOD-02 — P1 — foco chega ao menu móvel invisível [CONFIRMADO]

- Local: `/`, menu fechado a 390×844.
- Reprodução: focar “Abrir menu” e pressionar Tab.
- Observado: foco em `<a href="#quem-somos">`; menu com `opacity:0`, `visibility:visible`, botão com `aria-expanded=false`.
- Impacto: navegação por teclado fica visualmente sem referência; links ocultos permanecem na sequência de navegação.
- Aceitação: links fechados fora da sequência de foco e da exposição acessível adequada; ao abrir, ordem lógica, foco visível e estado atualizado. Repetir Shift+Tab e ativação por Enter/Espaço.

### NOD-03 — P1 — configuração impede a revisão do painel [CONFIRMADO NO AMBIENTE LOCAL]

- Local: `/admin/login`.
- Observado: erro de desenvolvimento por ausência de `PUBLIC_SUPABASE_URL`, originado na criação do cliente por requisição/middleware.
- Evidência: [Erro administrativo](evidencias/04-admin-sem-configuracao.png).
- Impacto: não é possível confirmar o que é editável nem testar salvamento. Não há evidência de que a produção esteja afetada.
- Aceitação: configurar backend de desenvolvimento; login e permissões funcionando; validar presença das demais variáveis sem imprimir seus valores; manter bypass desativado. Mostrar diagnóstico local compreensível e não expor detalhes internos em produção.

### NOD-04 — P2 — links de seção não funcionam como destinos diretos [CONFIRMADO]

- Local: `/`.
- Observado: os links usam `#quem-somos`, `#noden-home`, `#noden-game`, `#noden-data` e `#contato`, mas esses IDs não existem no DOM observado. Cliques animam a rolagem sem atualizar a URL.
- Reprodução adicional: abrir `/#noden-home` em desktop. Resultado: `scrollY=0`, Home com opacidade 0.
- Evidência: [Entrada por fragmento](evidencias/07-link-direto-home.png).
- Aceitação: fragmento compartilhável, recarga e histórico levam à seção correta; destino real e comportamento progressivo sem JavaScript. Preservar animação quando ela estiver disponível.

### NOD-05 — P1 — contato depende de protocolo de aplicativo [RISCO CONFIRMADO PELO DESTINO]

- Local: `/`, `/home`, `/game`, `/data` e `/links`.
- Observado: CTAs usam `whatsapp://send?...`. Não foi enviado contato nem testada a abertura do aplicativo.
- Risco: a ação exige um manipulador de protocolo; não há alternativa web nesse destino. Não afirmar que falha em todo navegador.
- Aceitação: oferecer destino HTTPS compatível com contato pelo navegador e aplicativo, preservar número/mensagem/contexto e fornecer alternativa visível. Testar com e sem aplicativo, sem enviar mensagens de teste.

### NOD-06 — P2 — abertura apresenta a marca antes da oferta [RECOMENDAÇÃO]

- Local: primeira tela de `/`, desktop e móvel.
- Observado: H1 “BEM-VINDO”, frase institucional e símbolo; serviço, público e CTA de orçamento não aparecem na hierarquia principal do hero. Desktop tem “Contato” no menu; no celular, fica dentro do menu.
- Evidência: [Abertura desktop](evidencias/05-desktop-abertura.png).
- Direção: manter assinatura visual, adicionar uma frase concreta sobre a oferta e acesso direto às divisões e ao atendimento. Exemplo conceitual, sujeito a revisão editorial: tecnologia para sua casa, seu setup e seu negócio.
- Aceitação: teste de compreensão com visitante novo: identificar oferta, área atendida e próximo passo sem precisar descobrir a animação. Não apresentar isso como teste com usuários já realizado.

### NOD-07 — P2 — contraste percebido e textos pequenos merecem revisão [OBSERVAÇÃO VISUAL]

- Local: subtítulo da abertura, rótulos espaçados, navegação, textos secundários.
- Observado: informação pequena e acinzentada sobre fundos escuros; leitura menos imediata nas capturas. Nenhuma razão de contraste foi calculada nesta execução.
- Aceitação: medir cores efetivas sobre gradientes/estados; atingir referência de 4,5:1 para texto normal e 3:1 para texto grande nos casos aplicáveis; melhorar tamanho, espaçamento e quebra de linhas. Não usar apenas aumento de brilho como solução universal.

### NOD-08 — P2 — composição da cena compete com a leitura em telas menores [OBSERVAÇÃO VISUAL]

- Local: `/`, 390×844 e 910×698.
- Observado: elementos decorativos encostam/sobrepõem visualmente a área do título móvel; muito espaço antes da oferta. Em Quem somos na tela de 910×698, os cartões passam da área visível na captura.
- Aceitação: conteúdo totalmente alcançável sem rolagem que apague a seção; espaço do símbolo proporcional à tela; conferir títulos longos, paisagem e zoom. Separar recorte decorativo intencional de perda real de informação.

### NOD-09 — P2 — Escape não fecha o menu principal móvel [CONFIRMADO]

- Reprodução: abrir menu em `/`; com foco em “Fechar menu”, pressionar Escape.
- Observado: botão continua “Fechar menu”, menu aberto. Clique em item fecha normalmente.
- Aceitação proposta: Escape fecha e devolve foco ao acionador; comportamento consistente com o menu das páginas internas. Não classificar automaticamente como falha normativa sem avaliar o padrão adotado.

### NOD-10 — P2 — busca aparece em Home, mas não nas outras divisões [CONFIRMADO; INTENÇÃO NÃO VERIFICADA]

- Observado: Home mostra busca e contador com três itens. Game e Data também têm três itens, mas sem busca no DOM observado.
- Aceitação: confirmar regra editorial/configurável; padronizar quando o comportamento deveria ser igual. Se a diferença for deliberada, documentar e validar a opção do painel. Não acrescentar filtros sem benefício para catálogos pequenos.

### NOD-11 — P2 — seis serviços apresentados, três itens com preço por divisão [CONFIRMADO; OPORTUNIDADE DE CONTEÚDO]

- Observado: as três páginas detalham seis soluções e mostram três itens no catálogo de valores. Isso pode ser intencional, não prova de cadastro perdido.
- Impacto: visitante pode não saber o formato de cobrança para todas as soluções.
- Aceitação: permitir ligar solução a item de catálogo ou informar claramente “sob consulta”; deixar itens incluídos/excluídos e condições acessíveis. Conferir matriz editorial para não duplicar descrições divergentes.

### NOD-12 — P2 — encerramento institucional tem menos informações úteis [CONFIRMADO; RECOMENDAÇÃO]

- Observado: `/` termina com logotipo e contato; as páginas internas têm telefone, cidades, links e condição de agendamento no rodapé.
- Evidência: [Contato desktop](evidencias/06-desktop-contato.png).
- Aceitação: manter encerramento visual, mas oferecer canais e informações essenciais com a mesma fonte das páginas internas. Não exigir a passagem por outra divisão para achar telefone ou região.

### NOD-13 — P2 — falta evidência visual de experiência real [RECOMENDAÇÃO EDITORIAL]

- Observado: predominam símbolo, ícones e descrições; nas páginas revisadas não foram encontrados casos com resultados verificáveis, fotos de trabalhos ou depoimentos identificados.
- Direção: apresentar processo de atendimento e exemplos reais para ajudar decisão; especialmente casos de software/dados e montagem/manutenção.
- Aceitação: conteúdo autêntico, autorizado e editável, com imagens acessíveis. Se ainda não houver provas publicáveis, usar explicação honesta do processo; nunca inventar indicadores ou clientes.

### NOD-14 — P2 — cobertura editorial ainda não demonstrada [BLOQUEADO]

- A existência anterior de rotas de configurações, páginas, catálogo e taxonomia indica estrutura administrativa, mas não comprova campos, validações ou persistência.
- Aceitação: concluir cada linha de `MATRIZ-CONTEUDO.md`; produzir evidência de editar → salvar → recarregar → refletir no público. Identificar ausências reais antes de criar novos formulários.

### NOD-15 — P1 — vulnerabilidades das dependências precisam de triagem [EVIDÊNCIA HISTÓRICA]

- Na preparação anterior, `npm ci` informou 12 vulnerabilidades: 1 moderada, 10 altas e 1 crítica. Não foi executada nova auditoria nesta revisão.
- Aceitação: repetir auditoria com o lockfile atual; registrar pacotes/caminhos afetados, alcance em runtime ou build e atualização compatível. Executar validação após mudança. Não aplicar `--force` indiscriminadamente nem afirmar exploração confirmada.

### NOD-16 — P2 — auditoria de configuração/produção incompleta [PENDENTE]

- Conferir backend de desenvolvimento separado, validação de ambiente, fallback de dados, autorização por papel, tratamento de erros e invalidação/atualização de dados.
- Conferir configuração de build/adaptador, versão Node em desenvolvimento/CI/deploy e dependências atuais. A preparação anterior concluiu check/build, mas isso não substitui verificação depois das correções.
- Conferir indexação de páginas públicas, canonical, metadados sociais, favicon, sitemap, tratamento de 404 e exclusão de páginas administrativas/de desenvolvimento da indexação conforme a intenção do projeto.
- Conferir a finalidade de `/mobile`, que redirecionou a `/` no desktop; não assumir que seja uma alternativa móvel funcional.

### NOD-17 — P2 — desempenho e alternativas à animação não medidos [PENDENTE]

- Medir build de produção em desktop e mobile, rede/CPU reduzidas, estabilidade do layout, peso de fontes/assets e responsividade da rolagem.
- Testar movimento reduzido, zoom, falha/atraso do JS e elementos fora da tela que continuam expostos a leitores de tela.
- Registrar métricas reais; não foi produzido score Lighthouse/Core Web Vitals nesta revisão.

### NOD-18 — P3 — consistência editorial e tom [RECOMENDAÇÃO]

- Padronizar capitalização e termos entre seções e páginas. Exemplo observado na seção Data: “Soluções de Software, evoluindo processos.” e combinação de rótulos ingleses com texto em português.
- Preferir benefício concreto ao jargão, especialmente para público residencial e pequenos negócios.
- Manter textos de CTA contextuais; não apagar as boas explicações de escopo e preços já existentes.

## O que preservar

- Identidade visual coerente entre as divisões.
- Títulos das páginas de serviço que explicam finalidade e público.
- Distinção entre “a partir de”, “sem custo” e “sob consulta”.
- Descrição do que está incluído e de custos avaliados separadamente.
- Mensagens de WhatsApp contextualizadas por serviço, preservando-as ao rever o tipo de URL.
- Busca Home: “formatação” retorna um item; termo inexistente retorna estado vazio; limpar retorna três.
- Fluxo normal e leitura do catálogo móvel Home, como referência para recuperar a página institucional.

## Direção de apresentação para o agente

1. Abertura: marca + benefício claro + CTA + escolha da divisão, com animação como apoio.
2. Quem somos: explicar rapidamente as três frentes e onde atendem.
3. Divisões: benefício, problemas atendidos, exemplos e link direto para serviços/condições.
4. Processo: como solicitar, diagnóstico/levantamento, orçamento, execução e acompanhamento, usando somente condições confirmadas.
5. Confiança: provas reais quando disponíveis.
6. Encerramento: contato, área, agendamento e navegação útil consistentes com as páginas internas.

Essa direção é uma proposta para orientar a próxima etapa, não um redesign já aplicado.

## Critérios finais para aprovação

- NOD-01 a NOD-05 reproduzidos e corrigidos, ou explicitamente reclassificados com evidência.
- Navegação pública e contato alcançáveis por teclado e em todas as resoluções-alvo.
- Comparação visual antes/depois sem cortes de informação ou regressões nos catálogos.
- Matriz editorial preenchida com origem real dos dados e testes de persistência.
- Check/build executados no código final; falhas remanescentes discriminadas.
- Backend, produção e limites de teste descritos com precisão.

## Referências de aceitação

- [W3C — ordem de foco](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html): sequência que preserve sentido e operação.
- [W3C — contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): referência para medir texto, considerando tamanho e exceções.
- [W3C — tamanho mínimo de alvo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): avaliar tamanho e espaçamento; não inferir conformidade por captura.

## Correções locais — etapa 1 (15/09/2026)

Esta seção atualiza os achados históricos acima. A validação autenticada anterior permanece em `VALIDACAO-SUPABASE.md`; nenhum registro real foi alterado nesta execução.

- **NOD-01 — corrigido e testado:** `overflow-x: hidden` em `html/body` criava um ancestral de rolagem que impedia a cena sticky de acompanhar a janela. Reprodução atual: Home em 390×844 com `scrollY=5597`, cena em `-5597` e conteúdo em `-5350`. Alterar temporariamente para `clip` trouxe a cena a `0` e o conteúdo a `247`, confirmando a causa. `index.astro` agora usa `clip` e fluxo normal por padrão; GSAP só aprimora telas a partir de 1100×800 sem movimento reduzido. Após correção: Home em `96px`, sem overflow horizontal.
- **NOD-02/NOD-09 — corrigidos e testados:** navegação fechada tem `visibility:hidden` e `inert`; menu independente do carregamento do GSAP, Escape devolve foco, saída do cabeçalho fecha o menu. Testados Tab, Shift+Tab, Enter e Espaço. Alvo do acionador: 44×44.
- **NOD-04 — corrigido e testado:** destinos HTML reais, ordem de leitura começando pelo H1, fragmento/histórico na animação e âncoras nativas no fluxo normal. Links diretos Home/Contato passaram em 320×740, 390×844, 768×1024, 910×698, 1440×900 e 844×390. Sem JS, Home permanece acessível na inicial e em `/mobile`. Incluído link para pular ao conteúdo.
- **NOD-16/NOD-17 — parcialmente tratados:** `/mobile` deixa de retornar à raiz por largura, evitando conflito entre tablet largo e o redirecionamento por User-Agent do `vercel.json`, que permanece intacto. Conteúdo móvel visível sem JS; entrada em tela tem apenas movimento opcional. Movimento reduzido na inicial usa fluxo normal. A regra da Vercel não é executada pelo servidor Astro local; produção não foi acessada.

Arquivos: `src/pages/index.astro`, `src/pages/mobile.astro`, `scripts/qa/navigation.mjs`. Validação: `npm run validate` sem erros/avisos e build concluído; teste Chromium via CDP, com as seis resoluções, rotas `/mobile`, `/home`, `/game`, `/data`, `/links`, histórico, teclado, movimento reduzido, JS desligado e redirecionamento de visitante de `/admin` para login. Capturas locais: `/tmp/noden-evidence/`; comparação anterior: `/tmp/noden-before-home.png`. Não são evidência de dispositivo físico, leitor de tela ou validação completa do backend.

## Correções locais — etapa 2 (15/09/2026)

- **NOD-05:** URL compartilhada corrigida para `https://wa.me/…?text=…`; número e mensagens contextuais preservados, incluindo acentos/`&`/`+`. Inspecionados destinos HTTPS nas três divisões; nenhum contato enviado. Abertura em aplicativo instalado não foi testada.
- **NOD-06/NOD-08:** abertura agora comunica suporte residencial, gamer e software/dados, com contato e três acessos diretos. H1 e textos têm fonte compartilhada com `/mobile`; símbolo e cores preservados. Correção adicional confirmada nas capturas: `placeIntroNode` calculava deslocamento em pixels e aplicava em unidades SVG; conversão pela escala do viewBox impede anéis sobre o texto. Tela estreita usa leitura normal, e os anéis permanecem na abertura.
- **NOD-07:** texto secundário novo `#b4c3d8` sobre `#02050a`: 11,41:1; labels `#a9bad2`: 10,34:1; links `#e6efff` sobre `#0c1729`: 15,51:1. Rodapés antigos `#57677d` e `#65758c` sobre `#02050a` mediam 3,54:1 e 4,35:1; substituídos por `#91a1b8`. Medições de pares sólidos, não auditoria completa de todos os gradientes/estados.
- **NOD-10/NOD-11:** reclassificados com o catálogo atual. Busca é exibida com mais de um item; vazio e limpar testados nas três divisões. Contagens antigas de três itens eram fallback; não justificam criar filtros ou preços novos. Nenhum preço ou condição comercial alterado.
- **NOD-12:** `SiteFooter` compartilhado em `/` e `/mobile`, oferecendo telefone, regiões, horários, canais e links com a mesma origem das divisões.
- **NOD-14:** sete campos de apresentação preparados no editor existente, API, tipo e leitor público; testes locais de validação/defaults aprovados. Persistência remota permanece não testada por limite de escopo. Mapeamento e revisão pré-publicação em `MATRIZ-CONTEUDO.md`.

Arquivos principais: `homeContent.ts` e teste, `types/site.ts`, `config/site.ts`, `siteRepository.ts`, formulário/API de configurações, inicial, mobile, links, cabeçalho e rodapé compartilhados. Capturas: `/tmp/noden-evidence-final/`, `/tmp/noden-hero-final.png` e `/tmp/noden-mobile-hero-final.png`. Evidências são locais e não entram no Git como arquivos gerados.
