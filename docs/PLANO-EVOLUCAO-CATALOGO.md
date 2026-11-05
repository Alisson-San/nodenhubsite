# Evolução do catálogo Noden — etapas e execução

Data: 24/09/2026.
Especificação: [catálogo visual](superpowers/specs/2026-09-24-catalogo-visual-design.md).
Estado: organização das entregas para revisão; não é autorização de deploy nem plano de código já em execução.
Estratégia: entregas sequenciais com revisão independente pontual. Evitar vários agentes alterando o mesmo contrato ou banco.

## Etapa 0 — preservar e preparar
- [ ] Separar correções já validadas (aspas documentadas, contato móvel, largura, devalue) em commit próprio, sem incluir alterações alheias.
- [ ] Criar feature/visual-catalog-editor a partir do estado preservado.
- [ ] Confirmar ambiente isolado para schema, Storage e testes de publicação. Não usar produção como banco de teste.
- [ ] Registrar baseline do catálogo atual: valores, categorias, ordem, CTAs e contagem por divisão; não versionar dados pessoais/segredos.
Entrega: base recuperável, branch identificada e fixtures locais independentes dos produtos reais.

## Etapa 1 — contratos editoriais e publicação
Arquivos existentes: src/types/services.ts, src/types/database.types.ts, src/lib/services/serviceRepository.ts, src/lib/admin/pricing.ts, APIs /api/admin/catalog/[division].
Novas unidades propostas: src/lib/catalog/editorTypes.ts, editorValidation.ts, draftRepository.ts; rotas /api/admin/editor/drafts e /api/admin/editor/publish.
Migrações aditivas geradas pelo comando oficial da CLI: extensão de detalhe, revisões privadas, mídias, versões e publicação transacional.
- [ ] Definir CatalogDraft {id, division, revision, baseRevision, schemaVersion, items, serviceCards, order}.
- [ ] Definir saveDraft(id, expectedRevision, payload) e publishDraft(id, expectedRevision), ambos autenticados, com retorno JSON {revision} ou erro por campo; conflitos HTTP 409.
- [ ] Incluir tanto services quanto pricing_items no contrato; não confundir cards de soluções com itens comerciais.
- [ ] Publicar uma divisão atomicamente; validar referências e preços antes de alterar estado público.
- [ ] Adaptar gravações antigas para incrementar versão de origem; conflito exige recarga/comparação, nunca sobrescrita automática.
- [ ] Testar rascunho invisível ao público, falha parcial com rollback, duas abas, item removido, preço zero/gratuito/sob consulta e autorização visitante/não admin/admin.
Entrega: salvar e recarregar rascunho sem mudar o site; publicar de modo verificável e reversível por nova revisão.

## Etapa 2 — produtos e apresentação pública
Novas unidades: src/components/catalog/ProductCard.astro, ProductDetails.astro, ProductGallery.astro, ProductDialog.astro; src/pages/produtos/[slug].astro; src/lib/catalog/productRepository.ts.
Modificar PricingTable.astro para compor cards compartilhados, evitando duplicar suas regras de filtros/preços.
- [ ] Produto enriquecido continua ligado ao UUID comercial, com slug único global.
- [ ] Implementar CTA Microsoft externo, mantendo WhatsApp nos demais itens e explicitando o destino.
- [ ] Criar galeria ordenada de imagens e vídeo por link permitido; upload de imagem pelo fluxo administrativo com limites e RLS.
- [ ] Usar ProductDetails tanto na página quanto no modal; links diretos continuam funcionando sem abrir modal.
- [ ] Ajuda estruturada: etapas de uso, recursos, FAQ, versão e atualização; omitir blocos ausentes.
- [ ] Implementar indisponibilidade/reservado/vendido sem excluir produto.
- [ ] Testar links inválidos, slug inexistente/privado, mídia ausente, alt, vídeo não permitido, texto longo, teclado e carregamento sob demanda.
Entrega: demonstrar produto e consultar ajuda com URL compartilhável, sem checkout.

## Etapa 3 — editor visual Home/Game/Data
Novas unidades: src/pages/admin/editor/index.astro; src/components/admin/editor/EditorShell.astro, EditorCanvas.astro, PropertyPanel.astro; src/lib/admin/editor/editorState.ts, editorController.ts.
- [ ] Canvas utiliza os componentes da etapa 2 e cards de soluções compartilhados.
- [ ] Edição de campos no contexto; lateral para mídia, link, preço, categoria e propriedades avançadas.
- [ ] Modo prévia abre CTAs; modo edição seleciona o campo sem executar contato.
- [ ] Alças de arraste e mover acima/abaixo; ordem determinística por IDs, restrita ao grupo/divisão.
- [ ] Desabilitar reordenação em resultados filtrados e explicar como limpar filtro.
- [ ] Histórico local desfazer/refazer, alterações pendentes e aviso de saída.
- [ ] Salvar rascunho / publicar separados, feedback por campo e manutenção do estado em falha de rede.
- [ ] Prévia desktop/mobile e prévia do detalhe; não expor dados privados em rota pública.
- [ ] Testar edição de texto, mídia e ordem; recarga, perda de rede, conflito, teclado e equivalência preview/público.
Entrega: editar vendo o resultado e publicar sem depender do formulário antigo.

## Etapa 4 — destaques e campanhas
Novas unidades: src/lib/campaigns/types.ts, eligibility.ts, frequency.ts, repository.ts; src/components/campaigns/CampaignBanner.astro, CampaignDialog.astro; src/pages/admin/campaigns/index.astro; API /api/admin/campaigns.
Integração pública em index.astro, mobile.astro e DivisionPage.astro.
- [ ] Campos: produto opcional/conteúdo próprio, páginas, formato, datas, prioridade, frequência, ativo e versão de exibição.
- [ ] Reaproveitar o sistema de rascunho/publicação; campanha não aponta para produto não publicado.
- [ ] Implementar frequência configurável: toda visita, sessão, uma vez por campanha e intervalo em dias; reset só por ação explícita.
- [ ] Escolher no máximo um modal elegível por carga. Banner pode existir sem modal.
- [ ] Validar horário UTC com edição São Paulo e limite de cache no próximo início/fim.
- [ ] Sem campanhas de exemplo como fallback em erro do banco.
- [ ] Produto vendido/inativo torna campanha inelegível imediatamente; respeitar páginas permitidas.
- [ ] Testar início/fim exatos, várias campanhas, armazenamento indisponível, produto removido/vendido, edição sem reset, Escape e foco.
Entrega: ativar uma novidade no painel, prever onde/quando aparece e encerrá-la sem mexer no código.

## Etapa 5 — acabamento e validação integrada
- [ ] Aplicar linguagem visual compartilhada: hierarquia de títulos, espaçamento, capas proporcionais, estados de foco/seleção e transições curtas com movimento reduzido.
- [ ] Evitar vídeo automático, cards com excesso de informações e animações que atrasem o acesso.
- [ ] Testar o caminho completo em fixtures: criar produto -> mídia -> ajuda -> rascunho -> prévia -> publicar -> campanha -> marcar vendido -> conferir público.
- [ ] Repetir em 320x740, 390x844, 768x1024, 910x698, 1440x900 e paisagem.
- [ ] Executar npm run validate, node --import tsx src/lib/site/homeContent.test.ts, node --test scripts/qa/routing.test.mjs, testes das novas regras, npm audit e git diff --check.
- [ ] Revisão independente de permissões/rascunhos e teste visual no navegador suportado.
- [ ] Registrar evidências e instruções curtas de uso; preparar migração e rollback revisáveis antes de solicitar aplicação remota.
Entrega: versão demonstrável e documentação para operação.

## Estratégia de agentes
Agente principal: contratos, migrações locais, publicação e integração.
Subagente de interface: componentes públicos, depois que o contrato estiver estável.
Subagente revisor: casos de conflito/permissão e avaliação visual; não alterar dados reais.
Executar no máximo duas frentes de implementação independentes. Não editar os mesmos arquivos em paralelo. Revisões podem ocorrer enquanto a próxima unidade independente é preparada.
Nenhuma tarefa recorrente ou trabalho em segundo plano foi criado por este documento.

## Ordem dos planos executáveis
Produzir planos detalhados de código por entrega depois da revisão da especificação:
1. Fundação editorial e publicação.
2. Produto/mídia + editor, compartilhando contrato aprovado.
3. Campanhas.
4. Integração final.
Essa divisão evita um plano gigante se tornar obsoleto antes de testar o primeiro fluxo.

## Critério de andamento
Marcar caixa somente com evidência. Cada entrega termina com teste e commit coeso no padrão existente: feat:, fix:, test:, docs: em português.
Não fazer push/deploy nem aplicar DDL remoto implicitamente. A entrega de planejamento não representa uma implementação iniciada.
