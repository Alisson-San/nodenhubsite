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

## Dependências — etapa 3 (15/09/2026)

**NOD-15 parcialmente resolvido:** auditoria atual reproduziu 12 alertas (1 crítico, 10 altos, 1 moderado). Astro estava em 7.1.3 no lockfile. Atualização direcionada na mesma versão principal resultou em Astro 7.3.2/Sharp 0.35.4; Node continua compatível (>=22.12.0). Motivo: [aviso oficial de AVIF/Sharp](https://github.com/advisories/GHSA-26w7-cxv4-gfx2) e correção de limites de caminho no Astro. Não foi comprovada exploração neste projeto.

Também atualizadas somente as transitivas apontadas pelo audit, nas faixas admitidas: brace-expansion 5.0.12, fast-uri 3.1.8, js-yaml 4.3.2, nanoid 3.3.19, postcss 8.5.28, smol-toml 1.8.0 e svgo 4.1.0. São ferramentas de parsing/build/editor/otimização; o projeto não oferece entrada pública de YAML/TOML/SVG para essas ferramentas. Isso reduz alcance aparente, sem declarar ausência de risco.

Resultado: **3 alertas altos, zero críticos/moderados**, todos associados à cadeia `@astrojs/vercel@11.0.3 → @vercel/routing-utils@5.3.3 → path-to-regexp@6.1.0` ([aviso ReDoS](https://github.com/advisories/GHSA-9wv6-86v2-598j)). `npm audit fix --force` sugere downgrade para adaptador 8.0.4; não aplicado por incompatibilidade com a geração atual. Próximo passo: atualização upstream compatível ou override 6.3.x com testes específicos de geração das rotas. Nenhum override improvisado ou atualização indiscriminada.

Arquivos: `package.json`, `package-lock.json`. `npm run validate` passou após atualização; regressão de 65 verificações também passou no build compilado servido localmente. Auditorias JSON locais em `/tmp/noden-audit.json` e `/tmp/noden-audit-final.json`; não versionadas.

## Estabilidade, revisão e build de produção — etapa 4 (15/09/2026)

**NOD-17:** medição do build compilado encontrou salto visual ao ativar a cena desktop depois da primeira pintura: CLS 1,0015 / 1 / 0 em três execuções. Corrigido reservando a cena antes da pintura, mantendo oferta/CTAs imediatamente visíveis. Se o bundle falhar ou demorar mais de 2,5 s, o documento passa para fluxo normal e recupera o fragmento. JavaScript totalmente desabilitado continua usando o fluxo normal desde o início.

Medição posterior (Chromium 153, Ubuntu WSL, Node 22.23.2, build Astro 7.3.2, cache desabilitado, três carregamentos por cenário; observadores PerformanceObserver/CDP):

| Cenário | LCP mediano | CLS observado | TTFB mediano | JS externo transferido |
|---|---:|---:|---:|---:|
| `/`, 1440×900, sem limitação | 612 ms | 0 / 0 / 0,00114 | 89,7 ms | 141.424 bytes |
| `/` → `/mobile`, 390×844, CPU 4×, 1,6 Mbps, latência 150 ms | 704 ms | 0 nas três execuções | 226,1 ms | 0 bytes externos (há scripts inline) |

A medição observa o carregamento e mais 1,8 s; não representa sessões reais, interação prolongada, INP, pontuação Lighthouse ou produção na Vercel. O preview usa o handler compilado e simula somente a regra de User-Agent de `vercel.json`; não reproduz CDN, edge, compressão ou configuração de produção. Registros em `/tmp/noden-production-metrics.json`. Scripts reproduzíveis: `scripts/qa/preview-production.mjs`, `scripts/qa/measure-production.mjs`.

Revisão independente encontrou e confirmou a correção de mais dois casos:

- **NOD-04:** resize de desktop para celular preservava hash mas perdia posição; cleanup agora reaplica o fragmento após o reflow. Revalidado: Home em aproximadamente 96 px e `inert=false`.
- **NOD-02:** label acessível fixo do CTA sobrepunha o novo texto editável. Removido; nome acessível e texto visível agora coincidem. Demais cenas ocultas ficam fora do foco.

Título de 119 caracteres e descrição de aproximadamente 310 foram simulados somente no DOM desktop; CTAs permaneceram dentro da tela. Nenhum registro foi salvo nesse teste.

### Limites e decisões restantes

- Persistência dos sete campos novos, erros de salvamento, usuário autenticado não administrador e demais fluxos da matriz precisam de ambiente isolado ou autorização específica. A validação anterior de login/item inativo continua válida dentro de seu alcance.
- C06 (resumos), conteúdo próprio de `/links`, mídia, FAQ e provas reais ainda não têm cobertura editorial completa. Decidir relação entre resumos institucionais e hero de cada divisão; fornecer conteúdo real para cases/depoimentos.
- Os três alertas do adaptador, permissões de `write_audit_log` e proteção de senhas continuam pendentes. Nenhuma política, autenticação, migração ou configuração remota foi alterada.
- Sem teste em dispositivo físico, Safari/Firefox ou leitor de tela. Contraste foi medido nos pares documentados; não se declara conformidade WCAG completa.
- Sem push, merge ou deploy. Capturas e relatórios brutos permanecem em `/tmp`, fora do Git.

Resultado final: `npm run validate` sem erros/avisos, três testes locais do conteúdo institucional e **69 checks de navegador aprovados** no build de produção local, incluindo toque simulado. Cabeçalho `/home`: HTTP 200 e `X-Noden-Content-Source: supabase`, confirmado sem escrita. Capturas finais em `/tmp/noden-production-final/`. Revisão independente revalidou resize e nome acessível após as correções.


## Retomada — resumos editáveis (C06), 15/09/2026

- Causa confirmada: títulos, descrições e bullets duplicados e divergentes em `index.astro` e `mobile.astro`. Os editores existentes de páginas não alimentavam esses blocos.
- Correção: conteúdo próprio da abertura centralizado em `homeContent.ts`, preservando os textos da inicial; doze campos organizados por divisão em Configurações. As duas páginas leem título/descrição/destaques da mesma origem; complemento continua somente na inicial. Sem nova tabela, consulta ou migração. Destinos, rótulos de CTA e ordem continuam fixos.
- Validação de listas: de 1 a 6 itens com até 100 caracteres cada; normaliza linhas vazias/CRLF antes de guardar. Teste inclui o percurso de serialização multipart do navegador. Formulários antigos sem todos os campos são recusados.
- Caso visual adicional confirmado: título100 + descrição260 +6 destaques100 produziam cartão de1075px em viewport1440×900, botão em y914 fora da tela. `ResizeObserver` agora desfaz a cena animada quando um cartão excede a altura útil, preservando fluxo, âncora e foco. Animação permanece para conteúdo que cabe.
- Arquivos: `src/lib/site/homeContent.ts`, teste correspondente, páginas inicial/mobile, `admin/settings/index.astro`, `scripts/qa/navigation.mjs`.
- Evidência: `npm run validate` (zero erros/avisos), cinco testes de conteúdo; Chromium153 nas seis resoluções, teclado, links, ausência de JS, falha do bundle, redirecionamento móvel simulado e comparação dos resumos. Capturas/resultados locais em `/tmp/noden-resume-content-final`; conteúdo máximo simulado apenas no DOM, sem gravação.
- Limite: o formulário autenticado e a persistência dos novos campos não foram testados no banco real. Usar banco isolado ou autorização específica. Não altera o estado da validação anterior em `VALIDACAO-SUPABASE.md`.


## Retomada — dependência transitiva (NOD-15), 16/09/2026

- `npm audit` confirmou três alertas altos herdados de `@astrojs/vercel@11.0.3` → `@vercel/routing-utils@5.3.3` → `path-to-regexp@6.1.0`, todos ligados ao [GHSA-9wv6-86v2-598j](https://github.com/advisories/GHSA-9wv6-86v2-598j). A presença do pacote foi confirmada; não foi demonstrada exploração nas rotas atuais.
- O código de `routing-utils` executava 6.1.0 e usava o alias 6.3.0 apenas para comparação. Mesmo a versão 6.6.0 consultada no registro npm ainda declarava 6.1.0. Aplicado override restrito a `@vercel/routing-utils` → `path-to-regexp:6.3.0`, versão corrigida da mesma major. Alterados somente `package.json` e a entrada correspondente do lockfile; sem downgrade do adaptador ou atualização geral.
- Compatibilidade: comparação profunda dos redirects transformados e das rotas de `.vercel/output/config.json` antes/depois resultou idêntica. `scripts/qa/routing.test.mjs` mantém dois testes reproduzíveis para regra móvel, exclusão das outras rotas e destinos públicos/administrativos/dinâmicos gerados. Executar após o build: `node --test scripts/qa/routing.test.mjs`.
- `npm run validate`: zero erros/avisos e build concluído. `npm audit`: zero vulnerabilidades nesta consulta. Logs em `/tmp/noden-resume-validate-deps.log` e `/tmp/noden-resume-audit-final.json`; capturas e regressão Chromium em `/tmp/noden-resume-deps-final`.
- Manutenção: revisar/remover o override quando o pacote upstream eliminar 6.1.0; reexecutar testes de rotas e audit ao atualizar o adaptador. A versão 6.3.0 não protege expressões regulares personalizadas inseguras; não foram introduzidas novas expressões. Preview local não valida a infraestrutura remota da Vercel.


## Correção após relato de animação ausente — 16/09/2026

- **NOD-01/NOD-06, regressão confirmada:** em `http://localhost:4322/`, a sequência rodava em 1440×900, mas era desativada em 1366×768, 1366×650 e 1280×577. O critério de altura mínima de 800px introduzido na correção anterior excluía notebooks comuns; os testes verificavam conteúdo acessível, mas não exigiam movimento nessas resoluções.
- Ajustados conjuntamente o preflight e o `gsap.matchMedia` para largura mínima de 1100px e altura de 550px, com composição compacta entre 550 e799px (cartão mais largo, espaçamento menor e texto principal preservado). Cartões que excedem a altura útil continuam acionando fluxo normal; a reserva vertical de 128px mantém o conteúdo abaixo do cabeçalho. Celulares, paisagem muito baixa e movimento reduzido mantêm leitura normal.
- `scripts/qa/navigation.mjs` agora exige alteração real do transform dos anéis ao rolar e verifica posição/CTA/foco de Home, Game e Data em 1280×550, 1280×577, 1366×650 e 1366×768. Confirmadas também as cenas inicial/Quem somos/contato por inspeção e capturas locais. Não basta verificar presença da classe de animação.
- `npm run validate` concluído sem erros/avisos; log `/tmp/noden-animation-validate.log`. Capturas e resultados de navegação em `/tmp/noden-animation-dev` e `/tmp/noden-animation-production`. Sem alterações de dados, rotas de produção ou deploy.


## Composição da abertura e montagem NODEN — 16/09/2026

- **NOD-06/NOD-01:** sobreposição confirmada por captura em 1366×650: círculo Home ocupava o kicker e o título da abertura. Os textos maiores haviam mantido a posição antiga do círculo superior. A composição agora reserva faixas laterais calculadas a partir dos limites reais do texto; escala inclui espessura do traço e margem para movimento de repouso.
- Montagem completa ganha uma pausa central antes de subir para Quem somos. Destinos e tempos de navegação foram deslocados juntos, mantendo âncoras diretas. O símbolo usa o centro da cena, sem incluir a barra de rolagem: o desvio horizontal reproduzido era de aproximadamente 7,5px em 1366px. Escala usa largura fracionária real; encaixe medido com tolerância de 1px.
- Resize reconstrói os cálculos da sequência, preservando seu tempo atual em vez de voltar ao início/fragmento antigo. Cleanup encerra também tweens de repouso criados após o retorno ao topo. Revisão independente identificou esses dois cuidados; incorporados antes de concluir.
- Novo `scripts/qa/animation.mjs`: abertura sem colisão (inclui espessura do traço), anéis dentro da cena, transição enquanto texto está legível, marca completa centralizada, encaixe quando sobe, rolagem de volta e resize no meio da montagem. Tamanhos: 1280×550, 1280×577, 1366×650, 1366×768, 1440×900, 1920×1080. Artefatos em `/tmp/noden-composition-production-final`; usar porta CDP como no teste de navegação. Capturas são evidência local, não entram no Git.
- Fluxos gerais continuam cobertos por `scripts/qa/navigation.mjs`, incluindo `/mobile`, teclado, telas baixas e movimento reduzido. `npm run validate` registrado em `/tmp/noden-layout-validate.log`. Não foi alterado conteúdo do Supabase nem realizado deploy.


## NOD-RESP-01 — centralização da montagem sob zoom (16/09/2026)

- Causa confirmada: a largura responsiva do símbolo produz pixels fracionários. A inferência automática de `translate(-50%, -50%)` no GSAP compara medidas arredondadas de modos diferentes e, em larguras como 1362 px, perde os percentuais de centralização ao aplicar `x: 0, y: 0`. Mudar o zoom altera a largura calculada e pode mascarar a falha.
- Reprodução no navegador, viewport 1362×768: símbolo deslocado aproximadamente 204,354 px nos dois eixos em relação ao espaço reservado entre N e DEN.
- Correção em `src/pages/index.astro`: declarar `xPercent: -50` e `yPercent: -50` explicitamente na inicialização do símbolo; preservar largura fracionária também no cálculo de escala do encaixe final.
- Verificação após correção em 1362×768: diferenças entre símbolo e espaço reservado inferiores a 0,001 px, largura coincidente e conjunto centralizado. Capturas de antes/depois registradas no workspace da tarefa.
- Regressão: matriz de `scripts/qa/animation.mjs` ampliada com 1102×650 e 1362×768, que expõem a falha de arredondamento. A ampliação do script não equivale à execução integral de sua matriz nesta rodada.
- `npm run validate`: 81 arquivos verificados, zero erros, avisos ou hints; build concluído. `git diff --check` aprovado.
- Limites: esta correção trata a animação inicial e a precisão do símbolo; não constitui auditoria completa de todas as rotas, do backend ou da produção. Sem deploy, commit ou alterações de dados.


## NOD-RESP-02 e NOD-RESP-03 — telas baixas e paisagem (16/09/2026)

- NOD-RESP-02: o conteúdo de Quem somos ultrapassava o limite inferior em 1280×577 (bottom 591,975 px em viewport de aproximadamente 578 px). A proteção anterior observava apenas os cartões das divisões. Compactados espaçamentos e padding de Quem somos em desktop com altura de 550 a 799 px, preservando o tamanho das fontes; o ResizeObserver agora também verifica se esse conteúdo cabe, oferecendo fluxo normal quando necessário.
- Pós-correção, recarga em 1280×550: animação ativa, Quem somos entre y=203,637 e 533,35 dentro da cena de 550,4 px.
- NOD-RESP-03: em 768×650, a regra de paisagem mantinha o wrapper das divisões com 46vw mesmo no fallback, produzindo cartões estreitos à esquerda (~317,94 px). O fallback agora explicita width:100% no wrapper. Pós-correção: cartões com 677,512 px e margem esquerda 37,637 px, ocupando 90% da cena e centralizados. Em 1024×650, navegação coube e cartões mediram 907,9 px, margem 50,437 px.
- Regressões acrescentadas aos scripts de animação/navegação para verificar limites de Quem somos e largura/centro do fallback em paisagem. Sintaxe dos scripts aprovada; matriz CDP completa não executada nesta rodada. Verificação visual e de DOM realizada pelo navegador suportado.
- Validação final após os ajustes de espaçamento: `npm run validate` aprovado (81 arquivos, zero erros/avisos/hints, build completo); `git diff --check` aprovado. Cobertura limitada às dimensões/fluxos registrados, sem alegar verificação de todos os dispositivos ou da produção.

- Complemento de navegador: 1536×730 manteve animação ativa, Quem somos com bottom 616,94 px e sem overflow; resize controlado de 1024 para 1280×550 com #quem-somos também preservou posicionamento (scene.scrollTop=0). Deslocamento interno observado somente durante HMR não foi reproduzido no fluxo normal; nenhuma alteração especulativa de overflow aplicada.


## NOD-RESP-04/05/06 — divisões e zoom de navegador (16/09/2026)

- NOD-RESP-04: a entrada direta em `/#noden-data`, em nova aba de 1229×584, produziu `scene.scrollTop=35,2` sem HMR. `overflow:hidden` permitia que a navegação por fragmento rolasse internamente a cena fixada. Substituído por `overflow:clip`, mantendo o corte visual sem criar uma área de rolagem interna. Isto confirma o mecanismo que antes só havia aparecido durante HMR; a observação anterior continua sendo o registro daquela rodada limitada.
- NOD-RESP-05: mesmo sem rolagem interna, o símbolo Data invadia a região do cabeçalho e do cartão em 1229×584. O alvo fixo `x:-205, y:42, scale:1.42` não considerava proporção da janela, altura ou largura do cartão. Agora um envelope circular calculado a partir das posições, raios e espessuras dos anéis SVG limita a escala e posiciona o conjunto no espaço livre à esquerda do cartão e abaixo do cabeçalho. Mantidas as rotações, proporções, ícones e escala máxima anterior.
- Verificação visual/geométrica após o encaixe: Home, Game e Data em 1229×584, 1280×550 e 1536×730; Game e Data em 1920×650. Anéis dentro da área útil e separados de cabeçalho/cartão; `scene.scrollTop=0`.
- NOD-RESP-06: Data em 1280×550 tinha cartão com topo 64,787 px sob cabeçalho de 68 px. O wrapper agora reserva 88 px no topo e 24 px no fundo ao centralizar o cartão; o fallback em fluxo normal mantém padding zero.
- Regressão `scripts/qa/animation.mjs`: incluídos 1229×584 e 1920×650, entrada direta nas três divisões e asserções dos limites reais dos círculos com `getScreenCTM`, espaço do cabeçalho/cartão, limites do cartão e ausência de rolagem interna. A matriz automatizada inteira não foi executada nesta rodada; a verificação foi feita no navegador suportado.

- Pós-correção do padding, Data em 1280×550: cartão entre 96,787 e 517,613 px, cabeçalho com 68 px; anéis e cartão dentro da área útil, sem rolagem interna. A medição no navegador usou centro observado e raio SVG multiplicado pela escala calculada; `getScreenCTM` fica no script QA, pois não estava disponível na superfície de inspeção utilizada.
