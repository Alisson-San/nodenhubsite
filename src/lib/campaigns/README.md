# Campanhas
- Editar em /admin/campaigns. Salvar cria um rascunho privado; publicar copia o rascunho para campaigns em transação.
- Datas exibidas em America/Sao_Paulo e enviadas como UTC. Início inclusivo, fim exclusivo. Rotas com campanhas usam no-store.
- Toda visita significa cada carga da página. Sessão usa sessionStorage; uma vez e intervalo usam localStorage. Sem armazenamento disponível, só o banner é mostrado. A frequência vale por navegador.
- Alterar texto não reinicia a frequência. Reiniciar exibição incrementa displayVersion do rascunho; precisa publicar.
- Produto relacionado deve estar ativo, em divisão publicada, disponível. Vendido/reservado/indisponível não aparece; uma referência removida também não.
- Publicação e rascunhos usam optimistic revision: conflito exige recarga e preserva o texto local. Nenhuma sobrescrita automática.
- Prévia permite explorar conteúdo mesmo antes da instalação; salvar/publicar ficam desabilitados. Não existem campanhas demonstrativas como fallback.
- Migração local 20260926185018_campaign_editor_after_catalog.sql depende da fundação visual_catalog_editor. Aplicada remotamente em 26/09/2026 com autorização do usuário.
- Testes de lógica: node --import tsx --test src/lib/campaigns/campaigns.test.ts.
