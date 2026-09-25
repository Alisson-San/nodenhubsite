# Catálogo visual, editor e campanhas Noden

Estado: proposta concreta para revisão. Não autoriza migração remota ou publicação.
Base: feature/site-review-agent, HEAD 8f51fa7, incluindo correções locais de 24/09/2026 que devem ser preservadas.

## Objetivo e decisões do usuário
Divulgar visuais de Power BI na Noden Data e oferecer ajuda de uso, imagens, vídeos e informações detalhadas. Distribuição pelo catálogo Microsoft, sem checkout, licenciamento ou hospedagem dos visuais na Noden.
Editar vendo o resultado: campos nos cards, arrastar para ordenar e prévia fiel. Cobrir Home, Game e Data, preservando a identidade moderna.
Permitir destaques para novidades, promoções e computadores à venda. Exibição na entrada e frequência configuráveis no painel.

## Decisões propostas
A implementação é dividida em entregas pequenas: fundação editorial, apresentação pública, editor visual, campanhas e integração final. Não transformar o site em um construtor irrestrito.
Página própria é a fonte completa e compartilhável; modal oferece apresentação rápida. O editor usa os mesmos componentes públicos e um modelo de rascunho explícito.
Manter Astro e Supabase existentes; adicionar JavaScript apenas nas áreas interativas. Não trocar framework nem ampliar bibliotecas sem necessidade demonstrada.

## Experiência pública
- Cards com capa, nome, resumo, categoria e CTA claro; destaque visual por divisão.
- Clique em Detalhes abre modal acessível, com resumo e galeria. Link Ver detalhes completos abre /produtos/[slug].
- A página completa oferece apresentação, galeria, recursos, instruções de instalação/uso, perguntas frequentes e versão/data de atualização quando cadastradas.
- Conteúdo vazio é omitido, sem abas vazias ou promessas inventadas.
- Visual Power BI: botão Ver no catálogo Microsoft, URL HTTPS validada e nome do destino explícito. Sem inferir gratuidade a partir da distribuição externa.
- Produtos físicos: preço/condições e contato existentes; disponibilidade disponível, reservado ou vendido. Vendido desativa CTA de compra e campanhas vinculadas. Não apagar histórico automaticamente.
- Outros serviços continuam com CTA de contato e preços atuais; detalhe enriquecido é opcional.

## Contrato de conteúdo
Reutilizar pricing_items como identidade comercial, sem copiar preços para uma segunda fonte.
Extensão 1:1 de detalhe por item: slug único estável, modalidade physical/digital/service, disponibilidade, CTA contact/microsoft/external, URL externa, blocos de recursos/ajuda/FAQ, versão.
Galeria ordenada: imagem com alt, legenda e dimensões; vídeo com URL de provedor permitido, título e thumbnail. Sem HTML/iframe arbitrário.
Primeira versão: imagens JPEG/PNG/WebP até 8 MB, até 12 mídias por produto; vídeos YouTube/Vimeo por link, carregados sob demanda e sem autoplay com som. Propostas de limites ajustáveis antes da implementação.
Proibir javascript:, data: e hosts disfarçados; validar URLs no servidor. Não buscar URLs arbitrárias no servidor.
Slugs publicados não mudam sem redirecionamento explícito. Não redirecionar rascunhos para conteúdo público.

## Rascunhos e publicação
Criar revisões administrativas separadas dos registros públicos, com payload validado, schema_version e revision inteiro.
Salvar rascunho mantém público intacto. Publicar valida e aplica item, detalhe, mídia e ordenação em transação; falha mantém versão publicada anterior.
Checar revisão esperada e versão pública de origem: edição concorrente retorna 409, sem sobrescrever silenciosamente.
Ordenação por divisão/categoria, gravada com IDs estáveis em transação. Arrastar no catálogo completo; desativar arraste durante busca/filtro para evitar ordem ambígua.
Desfazer/refazer no estado da edição atual; rascunho persistido só por ação Salvar rascunho, com aviso ao sair com mudanças.
Prévia administrativa em /admin/editor, privada, sem cache compartilhado e sem indexação; sem token público de rascunho.
O editor antigo continua disponível até a migração da área. A gravação antiga deve invalidar/bloquear publicação de rascunho baseado em versão anterior; não manter duas fontes conflitantes.

## Editor visual
/admin/editor: seletor Home/Game/Data, lista de blocos, canvas central e propriedades laterais.
Modo editar e modo prévia explícitos: clicar no CTA em edição seleciona configuração e não abre WhatsApp.
Campos no card usam inputs/textarea acessíveis, evitando contenteditable HTML livre.
Arraste por alça; botões mover acima/abaixo e anúncio acessível da nova posição.
Prévia desktop e mobile com componentes compartilhados; títulos longos e mídias ausentes não quebram layout.
Barra com alterações pendentes, desfazer/refazer, salvar rascunho, prévia e publicar. Erros junto ao campo e resumo acessível.
Primeira entrega cobre cards de soluções e catálogo das três divisões, detalhes e campanhas. Hero, rodapé, cores globais e editor livre de páginas ficam para uma etapa posterior.
Taxonomias existentes continuam no painel atual; novos cards usam seus valores sem duplicar cadastros.

## Campanhas
Campanha pode referenciar produto ou ter conteúdo próprio: título, resumo, mídia, label e destino.
Configuração: ativo, páginas (início/Home/Game/Data), formato banner/modal/ambos, início/fim opcionais, prioridade e frequência.
Frequências propostas: toda visita, uma vez por sessão, uma vez por campanha e repetir após N dias. Padrão: uma vez por campanha; ativação sempre explícita.
Definição: visita = nova carga de página elegível; sessão = sessão de aba; por campanha = navegador, sem rastreamento entre dispositivos. Se armazenamento indisponível, não abrir automaticamente modal; banner segue disponível.
Datas editadas em America/Sao_Paulo e persistidas em UTC; início inclusivo e fim exclusivo, relógio do servidor para elegibilidade.
No máximo um modal por carga. Escolha determinística por prioridade, início e ID. Nunca interromper formulário em edição, login, painel, outro modal ou página de ajuda de produto.
Modal permite fechar, Escape, foco contido e retorno ao acionador/contexto; respeita movimento reduzido.
Editar texto não reinicia frequência; ação explícita Reiniciar exibição incrementa versão da campanha.
Ao marcar produto vendido/inativo, desativar exibição vinculada sem excluir campanha.
Não implementar agendador obrigatório: seleção no servidor por datas; cache não pode manter campanha além do próximo limite. Não inserir script externo de marketing.

## Mídias e acesso
Storage para imagens com escrita administrativa, limites de MIME/tamanho e nomes gerados. Mídia de rascunho privada com URLs temporárias; somente mídia publicada é pública.
Remover mídia da galeria não deve apagar arquivo ainda referenciado. Limpeza de órfãos é posterior e revisável.
Manter autenticação existente, RLS, checagem de papel e Origin nas mutações. Nunca expor service_role. Não desativar autenticação para fazer prévia.
Migrações aditivas, criadas via CLI e testadas em banco isolado; não executar seed/DDL no banco real durante desenvolvimento.

## Compatibilidade e saída de escopo
Preservar serviços, preços, categorias, selos, ordem e URLs atuais. Dados antigos sem detalhe enriquecido seguem renderizando normalmente.
Sem checkout, cobrança, licenças, envio de emails, uploads de .pbiviz, incorporação autenticada de Power BI, editor HTML livre ou redesign das animações institucionais.
Usar conteúdo real fornecido pelo usuário para lançamento; fixtures claramente identificadas apenas no ambiente de teste.

## Aceitação transversal
- 320/390/768/910/1440 px e paisagem: sem perda de conteúdo ou overflow horizontal.
- Mouse, toque e teclado; foco visível, Escape, movimento reduzido, modal com retorno de foco.
- Salvar rascunho, recarregar, publicar, abrir público; negar visitante e não administrador.
- Conflito entre duas abas e editor antigo não perde dados.
- Galeria com imagem ausente, alt, vídeo inválido e título longo; nenhuma mídia pesada carregada antes de necessária.
- Campanhas antes/no/depois dos limites, frequências, armazenamento negado, várias elegíveis e produto vendido.
- npm run validate, testes existentes e testes das novas regras; revisão visual com evidência.
- Deploy, alteração remota de schema e ativação de campanhas reais somente após resultado revisável e autorização específica.

## Organização da execução
Implementador principal mantém contratos e integração. Subagentes podem revisar segurança, testar visual ou implementar unidades independentes depois de contratos definidos. Não dividir simultaneamente alterações de schema/publicação entre agentes.
Usar feature/visual-catalog-editor a partir do estado local preservado; primeiro separar as correções anteriores em commit próprio. Não usar reset/stash destrutivo e não fazer push automaticamente.
