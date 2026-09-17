# Execução do agente Noden

## Ambiente preparado

- Projeto no Ubuntu/WSL: `/home/alisson/Linguagens/Astra/nodenhubsite`.
- Branch de trabalho: `feature/site-review-agent`, criada a partir de `develop`.
- Runtime verificado: Node.js 22.23.2 e npm 10.9.8.
- Dependências instaladas pelo lockfile; servidor local: `http://localhost:4321`.
- Instruções do agente: `AGENTS.md`. `CLAUDE.md` continua apontando para ele.
- Contexto: `REVISAO-NODEN.md`, `MATRIZ-CONTEUDO.md` e `evidencias/`.

## Preparação e validação no terminal Ubuntu

```sh
cd /home/alisson/Linguagens/Astra/nodenhubsite
git branch --show-current
npm run astro -- dev status
```

Se o servidor estiver parado:

```sh
npm run dev -- --background
```

Para validar o projeto e consultar os registros:

```sh
npm run validate
npm run astro -- dev logs
```

Não iniciar uma segunda instância se o servidor já estiver ativo. Em uma instalação nova, usar `npm ci --include=optional` antes da validação. O Zsh já está configurado para localizar a instalação local do Node.js.

## Início da próxima tarefa no Codex

Usar o projeto e a branch acima como diretório de trabalho. O ambiente do site e as instruções estão prontos; não foi instalado um Codex CLI no Ubuntu. A tarefa pode continuar pelo aplicativo Codex que já acessa o WSL.

Prompt sugerido para a execução posterior:

> Leia AGENTS.md, REVISAO-NODEN.md e MATRIZ-CONTEUDO.md. Trabalhe na branch feature/site-review-agent. Reproduza e corrija os problemas de navegação, foco e apresentação que independem do Supabase, mantendo a identidade da Noden. Considere a diferença entre a página inicial responsiva e o redirecionamento de produção para /mobile. Atualize as evidências e os documentos após validar cada correção. Deixe login, persistência, migrações e configuração do Supabase para a etapa seguinte. Use commits pequenos seguindo a convenção do histórico. Não publique nem faça merge sem solicitação.

Este prompt é uma orientação para a próxima execução, não uma indicação de que as correções já começaram.

## Convenções Git observadas

- Branches de funcionalidade: `feature/<descricao-em-kebab-case>`.
- Commits com prefixo semântico e descrição em português: `feat:`, `fix:` e `chore:`.
- Commit desta preparação: `chore: prepara agente de revisao do site`.
- Preservar mudanças alheias e adicionar apenas os arquivos da tarefa.
- `.env`, credenciais, `node_modules`, `.astro`, `dist` e `.vercel` devem continuar fora dos commits conforme o ignore existente.

## Etapa Supabase adiada

O conteúdo público pode usar os dados padrão. Isso não valida conexão, login, edição nem persistência. Não habilitar bypass nem criar chaves fictícias para esconder a pendência. Configurar e testar o backend em uma etapa específica posterior.

## Execução local de correções — 15/09/2026

Etapa 1 implementada: navegação inicial, destinos reais, teclado, fluxo móvel/baixo, movimento reduzido e `/mobile` sem dependência de JS. Consulte o registro atualizado em `REVISAO-NODEN.md`.

- Branch confirmada: `feature/site-review-agent`.
- Preservados os três avisos documentais pendentes e o arquivo não rastreado `VALIDACAO-SUPABASE.md`.
- Node 22.23.2; servidor iniciado por `npm run dev -- --background`, informou `http://localhost:4322`.
- Chromium 153 via `agent-browser`; bibliotecas ausentes extraídas em `/tmp/noden-browser-libs`, sem instalação por sudo. Não fazem parte do projeto.
- Regressão reproduzível: abrir o site no Chromium, obter `agent-browser get cdp-url`, e executar `node scripts/qa/navigation.mjs http://127.0.0.1:PORT http://localhost:4322 /tmp/noden-evidence` com a porta CDP correspondente. Usar sessão de teste sem autenticação.
- Capturas e resultados gerados ficam em `/tmp`, fora dos commits. Nenhum push, merge ou deploy.

## Estado ao concluir as correções locais

- Navegação/fluxo normal e animação aprimorada; oferta/contato/rodapé compartilhados; sete campos institucionais preparados para edição. Persistência desses campos ainda requer teste autorizado isolado.
- Dependências auditadas e atualizadas de forma direcionada: Astro 7.3.2; restam três alertas altos da cadeia do adaptador, descritos no relatório.
- Preview de produção para repetição: `npm run build`, depois `node --env-file=.env scripts/qa/preview-production.mjs`. Escuta somente `127.0.0.1:4323`, permite GET/HEAD e simula a regra móvel do `vercel.json`; não é deploy nem emulador completo da Vercel.
- Navegação: `node scripts/qa/navigation.mjs http://127.0.0.1:PORT http://127.0.0.1:4323 /tmp/noden-production-final`. Medição: `node scripts/qa/measure-production.mjs http://127.0.0.1:PORT`. PORT é o CDP retornado pelo navegador de testes, não a porta do site.
- Ambiente: já havia processo em 4321, preservado. Instância 4322 iniciada nesta execução foi encerrada; após atualização, o comando Astro de status não a reconhecia e ela foi encerrada pelo PID confirmado. Preview4323 é temporário para QA.
- Não reaplicar seeds/migrações para testar a nova apresentação. Novos campos usam `site.identity.home` no JSON existente e defaults de leitura; nenhuma escrita foi feita no banco real.


## Retomada local — 15/09/2026

C06 avançou: doze campos dos resumos em Configurações, compartilhados por inicial/mobile, sem ampliar consultas ou alterar dados reais. Conteúdo longo aciona fluxo normal no desktop para preservar leitura e CTA. Testes de conteúdo incluem multipart/CRLF; QA de navegação agora também compara as duas aberturas e verifica o CTA com texto no limite. Artefatos desta etapa: `/tmp/noden-resume-content-final`, validação em `/tmp/noden-resume-validate-content.log`. Persistência autenticada permanece pendente de ambiente isolado/autorização específica.


## Dependências na retomada — 16/09/2026

Os três alertas restantes foram removidos com override restrito de `path-to-regexp` 6.3.0 sob `@vercel/routing-utils`. `npm audit` agora informa zero vulnerabilidades; manter a ressalva temporal e revisar o override ao atualizar o adaptador. `npm run validate`, testes de rotas geradas e regressão no preview passaram. Nenhum deploy, escrita Supabase ou alteração de autenticação/política foi realizado.


## Animação em notebooks — 16/09/2026

Após relato do usuário no servidor 4322, corrigida a restrição excessiva de altura de 800px. A animação agora pode funcionar a partir de 1100×550 com cartões compactos até 799px, desde que o conteúdo caiba. QA passou a exigir movimento dos anéis ao rolar, além de leitura e navegação. Testes/capturas em `/tmp/noden-animation-dev` e `/tmp/noden-animation-production`; veja a causa e os limites em `REVISAO-NODEN.md`. Recarregar a página local para aplicar a mudança.


## Verificação visual da sequência — 16/09/2026

Corrigidas sobreposição dos anéis na abertura e montagem da marca: texto com espaço reservado, palavra NODEN completa centralizada antes de subir e encaixe baseado no centro real da cena. Resize conserva o momento da sequência. Regressão visual reproduzível: `node scripts/qa/animation.mjs http://127.0.0.1:PORT http://127.0.0.1:4323 /tmp/noden-composition-production-final`. Validar também `scripts/qa/navigation.mjs`; a existência de movimento isoladamente não comprova boa composição.


## Correção NOD-RESP-01 — 16/09/2026

Agente de responsividade: diagnóstico do GSAP confirmado no navegador em 1362×768 (desvio de aproximadamente 204,354 px em ambos os eixos); correção mínima com percentuais explícitos de centralização em `src/pages/index.astro` e precisão fracionária no encaixe final. Pós-correção: encaixe com desvio inferior a 0,001 px, largura e centro coincidentes. Adicionadas 1102×650 e 1362×768 à matriz de regressão em `scripts/qa/animation.mjs`. `npm run validate` e `git diff --check` aprovados. Preservadas alterações locais preexistentes; sem commit, deploy ou escrita no backend. A matriz automatizada ampliada ainda depende de execução integral; os testes adicionais de resize, contato e celular são verificados separadamente pelo agente principal.


Complemento NOD-RESP-02/03: corrigidos corte de Quem somos em notebook baixo e cartões estreitos no fallback 768×650. Pós-correção validado visualmente em 1280×550 (animação ativa, conteúdo dentro da cena), 768×650 e 1024×650 (cartões centralizados). `npm run validate` final aprovado; scripts QA ampliados e sintaxe aprovada, sem execução integral da matriz CDP nesta rodada. Nenhuma alteração em banco, deploy ou dependências.


Complemento NOD-RESP-04/05/06: entrada direta Data em 1229×584 reproduziu rolagem interna da cena e sobreposição do símbolo; aplicada contenção por `overflow:clip` e geometria adaptativa baseada no SVG e na área útil. Reservado espaço vertical para cartões das divisões após reprodução do topo sob cabeçalho em 1280×550. Testes geométricos ampliados sem execução integral da matriz automatizada. Sem banco, deploy, commit ou mudança de dependências.
