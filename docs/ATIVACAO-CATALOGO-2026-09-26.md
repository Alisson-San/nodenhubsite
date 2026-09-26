# Ativação do catálogo — 26/09/2026

## Supabase
Autorização explícita do usuário nesta data. Projeto Nodenhub (nmphuhrdsyuehrknhntn).
Aplicadas com sucesso e registradas no histórico:
- 20260926185005_visual_catalog_editor.sql
- 20260926185012_catalog_media_private.sql
- 20260926185018_campaign_editor_after_catalog.sql

Arquivos locais renomeados para corresponder às versões geradas pelo serviço. SQL preservado.

## Verificações
- PostgreSQL/PGlite: dez grupos passaram.
- Remoto: snapshot, validação, salvar e descartar rascunho nas três divisões passaram em transação revertida.
- Remoto: salvar, publicar e retirar campanha inativa passaram em transação revertida.
- Zero rascunhos e campanhas de teste após a validação.
- Seis tabelas novas com RLS ativa. Anônimo sem permissão de executar salvamento ou edição de campanhas.
- Bucket catalog-media privado.
- Conteúdo preservado: 60 pricing_items e 18 services, hashes antes/depois idênticos.
- Advisors não acrescentaram alertas. Permanecem os alertas anteriores de write_audit_log e proteção de senhas vazadas; sem mudança de autenticação neste trabalho.
  - https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
  - https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Arraste
Código anterior dependia de HTML Drag and Drop numa alça de 28 px, sem tratamento de toque ou marca de destino. Movimentos entre categorias eram ignorados, mas mostravam sucesso.
Correção: eventos de ponteiro para mouse/toque/caneta, alça de 44 px, marca antes/depois, cancelamento e rolagem de borda. Mantidas ordenação dentro da categoria e setas.
Testes cobrem ordem antes/depois, limites de categoria, alvo inválido e histórico.

## Limites
Sem navegador conectado nesta sessão. Não foi possível validar o gesto real de arraste nem salvar/upload/publicar pela sessão HTTP do painel. Testes remotos exercitaram funções com papel authenticated e claims administrativas em transação local, sem alterar credenciais ou permissões de usuários.
Após recarregar /admin/editor, arraste a alça ⠿ na lista lateral até a marca azul; salve o rascunho e publique a divisão para refletir a ordem no site. Busca precisa estar limpa. Categorias não são alteradas pelo arraste.
