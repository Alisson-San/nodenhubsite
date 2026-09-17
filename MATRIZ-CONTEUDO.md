# Matriz de conteúdo e edição — Noden

## Como interpretar

**Nenhuma editabilidade foi validada ponta a ponta nesta revisão.** Após liberação do WSL, formulários, APIs e leitura pública foram inspecionados no commit `b6646da`. O painel local havia falhado por ausência de configuração do Supabase. A tabela inventaria o conteúdo observado e os controles que o agente deve procurar. “Verificar” não significa “o campo não existe”.

## Resultado da inspeção estática após liberação do WSL

| Grupos | Situação comprovada no código | Referências e limite |
|---|---|---|
| C01 | Parcial: identidade editável; marca gráfica é componente | `admin/settings/index.astro`, API `settings/site.ts`; `site_settings` contém identidade, sem fluxo de upload comprovado |
| C02–C04, C06–C07, C22 | Textos e estrutura da página inicial fixos no template | `src/pages/index.astro`; hero, Quem somos, resumos, menu e encerramento não consomem o editor de `service_pages` |
| C05, C08, C11 | Formulário e gravação implementados, não testados | Configurações: telefone, WhatsApp, horário, email, endereço e regiões; API faz upsert em `site_settings`; leitura por `siteRepository.ts` |
| C09 | Parcial | Mensagem padrão em configurações, por divisão no editor de páginas e por preço no `PricingForm`; a mensagem própria de `/links` ainda é literal em `src/data/links.ts` |
| C10 | Formulário/API e leitura implementados, não testados | Rotas `settings/social.ts`, tabela `social_links`, leitor `siteRepository.ts` |
| C12–C13, C21 | Formulário/API e leitura implementados, não testados | `admin/pages/[division].astro` → API correspondente → `service_pages` → `serviceRepository.ts` → `DivisionPage.astro` |
| C14 | Formulário/API implementados, não testados | Título, descrição, features, badge, ordem, ativo; tabela `services`; inclusão/edição e ações em APIs de catálogo |
| C15–C17, C19 | Formulário/API implementados, não testados | `PricingForm.astro`: tipo/valor de preço, comparação, prefixo/rótulo/sufixo, badges, features, nota, CTA, ordem, destaque e ativo; API de preços usa RPC |
| C18 | Interface e APIs de taxonomia encontradas, não testadas | `admin/catalog/taxonomy.astro`, componentes e APIs `taxonomy/save.ts`, `taxonomy/actions.ts`; verificar vínculos e comportamento de remoção |
| C20 | Controle presente no componente, configuração editorial não comprovada | `PricingTable.astro` renderiza controles condicionalmente por `hasInteractiveControls`; investigar condição e inicialização antes de atribuir diferença a cadastro |
| C23 | Parcial | Contatos e áreas têm fonte compartilhada; mapear frases e estrutura restantes no rodapé antes de afirmar edição integral |
| C24 | Parcial confirmado | `links.astro`: H1, bio e metadados literais; `data/links.ts`: cartões principais e descrições em código; telefone, áreas e Instagram dinâmicos |
| C25 | Parcial confirmado | Divisões têm SEO/canonical no editor; inicial usa identidade para título/descrição; links tem valores literais. Upload de imagem social não comprovado |
| C26–C28 | Não comprovado | Nenhum fluxo foi validado nesta inspeção para mídia, cases, FAQ ou processo; procurar implementação antes de criar |
| C29 | Publicação simples implementada, não testada | `is_published` no editor/API; leitor público respeita página não publicada quando consulta retorna sem erro; rascunho/preview/histórico não comprovados |
| C30 | Leitura remota e fallback implementados, comportamento completo não testado | Conferir `siteRepository.ts`, `serviceRepository.ts` e o header `X-Noden-Content-Source` nas divisões; testar atualização após salvar |

Prioridade editorial confirmada: habilitar edição coerente da página inicial e do conteúdo fixo de `/mobile` e `/links`, reutilizando os dados já existentes para contato, regiões e divisões. Não duplicar o editor de páginas das divisões.

Referências de rotas administrativas vêm da inspeção realizada na preparação anterior: `/admin/settings`, `/admin/pages/[division]`, `/admin/catalog/[division]`, `/admin/catalog/[division]/prices` e `/admin/catalog/taxonomy`. São pontos de partida, não prova de capacidade atual. Reconfirmar a estrutura.

## Inventário

| ID | Informação ou controle | Onde aparece | O que verificar no editor e na origem | Prioridade |
|---|---|---|---|---|
| C01 | Nome da marca, assinatura e logotipo | Cabeçalhos, abertura, rodapé, links | Fonte compartilhada; variações do logo; texto alternativo; opção de alteração se fizer parte do escopo editorial | P2 |
| C02 | H1, subtítulo e frase de apoio da abertura | `/` | Campos próprios e reflexo imediato; não confundir editor de divisões com editor da página inicial | P1 |
| C03 | CTA principal e secundário da abertura | `/` | Texto, destino, visibilidade e validação de URL; hoje o hero prioriza cumprimento e animação | P1 |
| C04 | Quem somos: título, descrição e rótulos | `/` | Edição do bloco completo, limites de tamanho e preview em desktop/mobile | P1 |
| C05 | Cidades e modalidade de atendimento | `/`, rodapés, `/links` | Lista única, ordenação, texto de exibição, inclusão/remoção; evitar cópias divergentes | P1 |
| C06 | Resumos das três divisões | `/` | Título, descrição, bullets, rótulo, ordem, CTA e referência à divisão | P1 |
| C07 | Navegação pública | Cabeçalhos e rodapés | Rótulos, destinos e visibilidade; âncoras válidas; não permitir esconder o único caminho para conteúdo ativo | P2 |
| C08 | Telefone/WhatsApp | Todos os contatos | Número canônico único, formato de exibição, destino web/app e validação de número | P1 |
| C09 | Mensagem de contato por contexto | Hero, cards, CTA final, `/links` | Template padrão com sobrescrita por divisão/serviço; encoding; preservar nome do serviço | P1 |
| C10 | Redes sociais | Rodapés e `/links` | Nome, URL, ícone, ordem e ativação; tratamento de URL vazia/inválida | P2 |
| C11 | Agendamento, horário e área atendida | Rodapés/contato | Campos para condições reais; horário só se confirmado; distinguir remoto de presencial | P1 |
| C12 | Títulos, subtítulos e badges de divisão | `/home`, `/game`, `/data` | Conferir editor de páginas; editar todos os elementos do hero e validar títulos longos | P1 |
| C13 | Introdução dos blocos de soluções | Páginas de divisão | Rótulo, título e descrição do bloco, não apenas itens do catálogo | P2 |
| C14 | Seis cards de soluções de cada divisão | Páginas de divisão | CRUD, bullets, destaque, ordem, ativo/inativo; relação com catálogo e preço | P1 |
| C15 | Itens do catálogo | Bloco de preços das divisões | Nome, resumo, itens incluídos, observações, divisão, categoria, ordem e estado publicado | P1 |
| C16 | Tipos de preço | Catálogos | Fixo, a partir de, gratuito, sob consulta; moeda; valor zero; valor inválido; separar preço oculto de gratuito | P1 |
| C17 | Restrições e itens excluídos | Cards e nota geral | Campo por item e por divisão; persistência de backup, peças, licenças, deslocamento etc. | P1 |
| C18 | Categorias e tipos | Catálogos | Nome, descrição, ordem, ícone, ativo; vínculo referencial dos itens ao remover/renomear | P2 |
| C19 | Badges “Mais procurado” e similares | Cards | Texto e critério editorial; ativação/ordem; não derivar alegação comercial sem base | P2 |
| C20 | Busca e filtros | Home; ausentes no estado observado de Game/Data | Regra por divisão, campo de ativação, categorias/tipos, texto vazio e contador acessível | P2 |
| C21 | CTA final das divisões | `/home`, `/game`, `/data` | Rótulo, título, parágrafo, botão principal/secundário, mensagem e destino | P1 |
| C22 | Encerramento da página inicial | `/` | Texto, canais, botão e informações úteis; não presumir que usa os mesmos campos do rodapé | P1 |
| C23 | Rodapé | Divisões | Descrição, frase final, contatos, links, região e informação de agendamento centralizados | P2 |
| C24 | Página de links | `/links` | Título, bio, handle, cartões, descrição de cada link, ordem, ativação e domínio exibido | P1 |
| C25 | SEO por página | Todas as páginas públicas | Título, descrição, imagem social, canonical e indexação; localizar implementação antes de criar campos | P2 |
| C26 | Imagens e acessibilidade | Marca e futuros cases | Upload/seleção, dimensões, compressão, texto alternativo, imagem ausente e permissões de armazenamento | P2 |
| C27 | Cases, fotos e depoimentos | Não encontrados nas páginas revisadas | Confirmar necessidade e disponibilidade real; depois definir publicação e campos; não fabricar conteúdo | P3 |
| C28 | FAQ, processo e condições de atendimento | Sem bloco próprio observado | Confirmar interesse editorial; perguntas, respostas, ordem e visibilidade se implementado | P2 |
| C29 | Estado de publicação | Conteúdo editorial | Saber se salvar publica imediatamente; rascunho/preview quando necessário; sucesso/erro e alterações não salvas | P1 |
| C30 | Sincronização público/painel | Todo conteúdo remoto | Cache, atualização após salvar, relação com fallback e comportamento quando serviço indisponível | P1 |

## Fluxo obrigatório de validação

Para cada grupo de campos, em backend de desenvolvimento e dados de teste:

1. Localizar componente público e fonte exata do valor.
2. Localizar campo do formulário, validação da API e coluna/estrutura persistida.
3. Registrar o valor de teste inicial; editar um texto com acentos e um título longo.
4. Salvar e verificar a mensagem da interface.
5. Recarregar o painel e confirmar persistência.
6. Abrir a página pública e conferir texto, links, layout e preço quando aplicável.
7. Testar campo vazio, tamanho excessivo e destino inválido. Confirmar erro legível e nenhum salvamento parcial inesperado.
8. Para listas, testar inclusão, edição, ordenação, ocultação e remoção somente em registros de teste.
9. Reverter os valores de teste; registrar o resultado e as capturas.
10. Testar recusa de alteração para usuário sem permissão sem usar ou expor chaves administrativas no cliente.

Não realizar esses testes em registros reais de produção apenas para preencher a matriz.

## Registro que o agente deverá completar

Para cada Cxx, registrar:

```
ID:
Status: implementado e testado | implementado não testado | parcial | ausente comprovado | bloqueado
Componente público:
Origem dos dados:
Tela/campo administrativo:
Validação no servidor:
Persistência:
Teste executado:
Resultado público:
Lacuna confirmada:
Correção proposta:
Evidência:
```

## Controles que não devem ser confundidos com conteúdo comum

Credenciais Supabase, papel administrativo, regras de acesso, parâmetros de deploy e bypass de autenticação não são campos editoriais para aparecer livremente no painel de conteúdo. Rever configuração e permissões separadamente.

A escolha de tornar cores, durações de animação ou estrutura de layout editáveis exige justificativa: o objetivo é autonomia editorial sem permitir quebrar a leitura. Preferir controles limitados e previsíveis a um editor visual irrestrito.

## Atualização das correções locais — 15/09/2026

O texto inicial desta matriz descreve a primeira inspeção. Conexão/login e o item comercial temporário foram validados posteriormente conforme `VALIDACAO-SUPABASE.md`. Nesta execução não houve gravação no Supabase real.

| IDs | Estado atual | Cadeia comprovada e limite |
|---|---|---|
| C02–C04, C22 | Implementado; leitura e validação locais testadas; salvamento remoto não testado | `/` e `/mobile` → `site.home` → `admin/settings` (sete campos) → `parseHomeContentForm` na API `settings/site.ts` → JSON `site_settings`, chave `site.identity`, propriedade `home` → `buildSiteConfig/readHomeContent`. Título/descrição inicial, título/texto Quem somos, título/texto/label contato. Campos obrigatórios; limites 50/120/320/600; formulário antigo incompleto é recusado para não sobrescrever conteúdo com defaults. Sem migração necessária. Salvar publica imediatamente, conforme aviso no formulário. |
| C03, C07 | Parcial | CTA de contato usa destino compartilhado e label editável; acessos diretos às divisões e âncoras corrigidos. Destinos/ordem da navegação continuam definidos em código. |
| C05, C08–C11, C23 | Leitura pública implementada e testada; edição remota não repetida | `SiteFooter` agora também em `/` e `/mobile`, consumindo a mesma configuração das divisões. Telefone, regiões, horário, email e redes usam os campos existentes. `getWhatsAppUrl` agora produz HTTPS com mensagem codificada; teste local verificou acentos e caracteres especiais. A mensagem própria de `/links` continua contextual em código. |
| C06 | Implementado em parte; leitura/validação locais testadas, persistência remota pendente | Resumos próprios compartilhados por `/` e `/mobile`: título, descrição e destaques; complemento na inicial desktop. Doze campos em Configurações → `parseHomeContentForm` → `site.identity.home` → `readHomeContent`. Mantido texto existente da inicial como default, sem consulta adicional ou migração. Marca, ordem, destino e label do CTA continuam em código. Não confundir com publicação/hero de C12/C13. |
| C12–C19, C21 | Implementado; escopo de persistência conforme validação anterior | Editores existentes preservados; nenhum serviço/preço alterado. Sem duplicação de formulários. |
| C20 | Implementado e testado no catálogo atual | `hasInteractiveControls = items.length > 1`; busca, vazio e limpar passaram em Home/Game/Data. Não é um toggle editorial por divisão. |
| C24–C25 | Parcial | Bio de `/links` usa descrição institucional existente; títulos/cartões ainda parcialmente fixos. Canonical absoluto em `/` e `/mobile`, favicon na inicial. Sem editor novo para metadados de links. |
| C26–C28 | Pendente de escopo e conteúdo real | Não implementados upload, cases/depoimentos ou FAQ. Não foram inventadas provas comerciais nem condições de atendimento. |
| C29–C30 | Parcial | Publicação imediata dos novos campos preparada; defaults só para campos ausentes/ilegíveis. Erros de conexão ainda seguem o fallback já existente do repositório. Persistência dos novos campos exige teste isolado ou autorização específica para registro de teste. |

Testes locais: `node --import tsx src/lib/site/homeContent.test.ts` (defaults legados, acentos, vazio, campo ausente, tamanho excedido); validação Astro e navegação Chromium. Esses testes **não** equivalem a editar → salvar → recarregar no banco real.

### Revisão necessária antes de publicar os novos campos

1. Em banco isolado, abrir Configurações, editar os sete textos institucionais e os doze campos dos resumos, salvar, recarregar e conferir ambas as páginas públicas. Testar título de 120 caracteres e descrição máxima.
2. Conferir que identidade, contato e regiões existentes continuam iguais; a API mantém a estrutura de upsert existente, sem nova política ou autenticação.
3. Testar usuário não administrador e feedback de erro de gravação. Nenhuma conta ou permissão foi criada nesta execução.
4. Resumos C06 agora têm copy própria compartilhada nas duas aberturas; não acompanham automaticamente o hero ou a publicação de `service_pages`. Revisar essa política editorial e aprovar escopo de links, mídia, cases e FAQ antes de ampliar o editor.


## Complemento de responsividade — 16/09/2026

NOD-RESP-01: corrigida a perda de centralização do símbolo na montagem NODEN em larguras fracionárias decorrentes de viewport/zoom. Reprodução e pós-correção medidos em 1362×768; detalhes e limites em `REVISAO-NODEN.md`. Esta alteração visual não modifica campos editoriais, origem de dados nem o estado de validação da persistência desta matriz.


Complemento NOD-RESP-02/03: espaçamentos de Quem somos adaptados para notebooks baixos e fallback de divisões corrigido em paisagem; proteção de conteúdo alto estendida a Quem somos. Sem mudanças editoriais ou de persistência. Reprodução, medições e limites em `REVISAO-NODEN.md`.


Complemento NOD-RESP-04/05/06: corrigidos rolagem interna indevida da cena por fragmento, encaixe do símbolo em telas baixas/zoom e centralização dos cartões abaixo do cabeçalho. São correções de apresentação sem alteração do contrato editorial ou de persistência. Evidências e limites em `REVISAO-NODEN.md`.
