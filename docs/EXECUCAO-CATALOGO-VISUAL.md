# Execução — catálogo visual
Data: 24/09/2026. Branch: feature/visual-catalog-editor. Base: 2d778d2.
Plano: docs/PLANO-EVOLUCAO-CATALOGO.md.
Especificação: docs/superpowers/specs/2026-09-24-catalogo-visual-design.md.

## Entrega local
- Editor /admin/editor: campos no card, reordenação dentro da categoria, desfazer/refazer, seleção Home/Game/Data, prévia autenticada desktop/mobile.
- Produtos: apresentação, imagens, vídeos YouTube/Vimeo, instruções, FAQ, versão, disponibilidade, modal e página /produtos/[slug]. Microsoft distribui os visuais; o site oferece o link.
- Destaques /admin/campaigns: prévia editável, banner/modal, destino, produto associado, páginas, agendamento São Paulo, frequência e prioridade.
- Rascunhos separados da publicação, histórico, publicação atômica, proteção contra revisões concorrentes e alterações pelo painel tradicional. Endereços publicados preservados.
- Mídias privadas antes da publicação; validação de formato, tamanho e provedor.
- Sem migrações remotas, push ou publicação de exemplos. Notas anteriores do projeto preservadas.

## Verificação realizada
- npm run validate: 114 arquivos, zero erros/avisos/hints; build concluído.
- 17 testes de validação, mídia, histórico, ordenação e campanhas passaram.
- 2 testes de rotas do build passaram.
- 10 grupos de testes com PostgreSQL/PGlite passaram usando o SQL real das migrações: RLS, permissões, mídia privada/publicada, publicação atômica, conflito, rollback parcial, inatividade, descarte, slugs e campanhas.
- npm audit --omit=dev: zero vulnerabilidades.
- Navegador autenticado: troca para Data por teclado; criação de card local inativo; edição, desfazer/refazer; prévia real; modal e Escape; destino Microsoft; largura 390 sem overflow horizontal. Aparência desktop do editor e painel de destaques conferida.
- Nenhum exemplo persistido. A aba do editor pode conter uma prévia temporária de teste; recarregar descarta essas alterações.

## Limites e próxima etapa
Salvar, enviar mídia e publicar ficam desabilitados até instalar as três migrações abaixo. A prévia já funciona com os dados existentes.
O teste SQL usa stubs de Auth/Storage: não substitui teste final no Supabase de upload, URL assinada, sessão HTTP e concorrência entre conexões reais.
Ainda validar após ativação: salvar/reabrir/publicar item inativo de teste autorizado; upload; página pública; campanhas com frequência/agendamento no navegador. Não considerar a ativação em produção concluída.

## Ativação no Supabase
Antes de aplicar, conferir backup e histórico remoto de migrações. Aplicar em ordem:
1. supabase/migrations/20260926185005_visual_catalog_editor.sql
2. supabase/migrations/20260926185012_catalog_media_private.sql
3. supabase/migrations/20260926185018_campaign_editor_after_catalog.sql
As mudanças são aditivas; criam armazenamento editorial, políticas e funções. Exigem confirmação específica conforme o escopo acordado antes de executar no banco real.
Reversão preferida: voltar o código da aplicação, mantendo tabelas e histórico. Não executar remoção destrutiva após publicações. Restaurar conteúdo por novo rascunho revisado a partir do histórico.

## Reproduzir teste SQL isolado
Com @electric-sql/pglite instalado fora do projeto:
```sh
PGLITE_MODULE=/tmp/noden-qa-db/node_modules/@electric-sql/pglite/dist/index.js node scripts/qa/catalog-database.test.mjs
```
Não usa credenciais nem o banco real.

## Atualização — 26/09/2026
Migrações aplicadas com autorização explícita. As pendências de instalação descritas acima são históricas. Ver docs/ATIVACAO-CATALOGO-2026-09-26.md para testes remotos e limites atuais.
