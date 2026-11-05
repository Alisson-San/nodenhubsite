## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Agente de qualidade e apresentação Noden

### Missão

Produzir uma experiência visual memorável, clara e fácil de usar para quem procura suporte residencial, serviços gamer ou soluções de software e dados. Em poucos segundos, o visitante deve entender o que a Noden oferece, identificar a divisão certa e encontrar serviços, condições e contato.

O impacto visual deve vir de composição, tipografia, identidade e movimento bem executados. Conteúdo e navegação precisam continuar acessíveis sem depender de uma sequência de animação. Preservar a marca Noden, o símbolo com três elementos e a diferenciação cromática das divisões, salvo orientação posterior do usuário.

### Como iniciar

1. Ler `REVISAO-NODEN.md` e `MATRIZ-CONTEUDO.md`; distinguir evidência, recomendação e item não verificado.
2. Ler o estado atual do projeto, instruções aplicáveis, scripts, lockfile e alterações locais. Os dados da auditoria são uma referência datada, não uma descrição garantida do código atual.
3. Confirmar Node.js conforme `package.json`, instalar pelo lockfile quando necessário e executar os scripts existentes. Não trocar o gerenciador nem atualizar todas as dependências por conveniência.
4. Usar os comandos `npm run validate`, `npm run dev -- --background`, `npm run astro -- dev status` e `npm run astro -- dev logs`, se continuarem definidos.
5. Verificar a presença das variáveis necessárias sem imprimir valores sensíveis. Não inferir que o backend funciona porque o frontend apresenta dados padrão.
6. Na fase de revisão, documentar. Na fase de correção autorizada pelo usuário, implementar os itens priorizados, com alterações pequenas e verificáveis. Não iniciar correções apenas porque este documento existe.

### Ordem de execução das correções

1. Conteúdo inacessível e navegação quebrada, especialmente no celular.
2. Foco, teclado, links diretos e consistência do contato.
3. Configuração local e validação do painel com backend de desenvolvimento.
4. Clareza da oferta, hierarquia, leitura e conteúdo comercial.
5. Cobertura editorial, persistência e atualização das páginas.
6. Desempenho, metadados, acabamento e consistência entre resoluções.

### Regras de apresentação

- A abertura deve explicar a oferta e apresentar uma ação útil. Um cumprimento genérico não deve ocupar sozinho a principal hierarquia.
- Oferecer acesso evidente às três divisões, aos serviços/preços e ao contato.
- Manter textos legíveis, sem colisão com ilustrações ou cabeçalhos e sem depender de hover.
- Dar prioridade ao conteúdo na tela estreita; oferecer fluxo normal de leitura quando a animação fixada não couber.
- Conferir cabeçalho, botões, cartões, rodapé, linguagem e ícones entre todas as páginas.
- Manter animações discretas e uma alternativa para movimento reduzido. Validar também falha ou atraso do JavaScript.
- Não inventar depoimentos, parceiros, certificações, resultados, prazos, garantias ou métricas. Solicitar conteúdo real quando necessário.
- Explicitar a diferença entre valor fixo, “a partir de”, gratuito e “sob consulta”; preservar ressalvas e itens não incluídos.

### Protocolo de verificação

Cobrir `/`, `/home`, `/game`, `/data`, `/links`, a função da rota `/mobile` e o painel existente. Revalidar as rotas antes de presumir que continuam disponíveis.

- Tamanhos: 320×740, 390×844, 768×1024, 910×698 e 1440×900; incluir uma tela baixa em paisagem.
- Navegação: clique, toque simulado, Tab/Shift+Tab, Enter/Espaço, Escape, voltar/avançar, recarga e URL com fragmento.
- Menu fechado: nenhum link invisível deve receber foco. Menu aberto: foco visível, sequência coerente e fechamento previsível.
- Conteúdo: títulos, textos longos, cards, preços, filtros, resultado vazio, imagem ausente, carregamento e erro.
- Backend: visitante, usuário sem papel administrativo e administrador; salvar, recarregar e verificar a página pública em dados de teste.
- Links externos: verificar destino e contexto sem enviar mensagens ou efetuar contatos de teste.
- Acessibilidade: contraste calculado, foco, nomes acessíveis, ordem de leitura, zoom, reflow e movimento reduzido. Não declarar conformidade completa com base apenas em uma ferramenta.
- Desempenho: medir build de produção local, não usar o servidor de desenvolvimento como referência final. Registrar ambiente, ferramenta e resultados reais, sem inventar notas.

Usar como referência os critérios do W3C para [ordem do foco](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html), [contraste](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) e [tamanho dos alvos](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Adotar alvo de toque de 44×44 px como preferência do projeto, sem confundir isso com o mínimo de 24×24 px e as exceções do critério 2.5.8.

### Auditoria de conteúdo editável

Para cada linha da matriz, localizar: componente público → origem dos dados → campo no formulário → validação no servidor → armazenamento → leitura pública. Não classificar como “editável” apenas pela existência de uma rota administrativa.

Marcar como concluído somente após testar edição, salvamento, recarga e reflexo no site. Diferenciar: implementado e testado; implementado mas não testado; parcial; ausente comprovado; bloqueado.

Priorizar uma fonte compartilhada para telefone, WhatsApp, cidades, redes, textos e preços reutilizados. Evitar que os dados padrão escondam erros de configuração ou sobrescrevam alterações reais.

### Configuração e limites

- Não expor chaves secretas no navegador, Git, logs ou documentação.
- Não usar desativação de autenticação como correção para a falta de configuração.
- Não executar seed, migrações, mudanças de preços reais, deploy ou alterações em produção sem escopo autorizado específico.
- Preservar trabalho local e o vínculo de `CLAUDE.md` com este arquivo quando existir.
- Atualizações de dependências devem ter motivo, análise de compatibilidade e validação; não executar correção forçada indiscriminada.

### Critério para concluir

Registrar para cada correção: ID do achado, causa confirmada, arquivos alterados, teste de reprodução, resultado depois da mudança e captura quando visual. Executar a validação do projeto e os fluxos afetados. Atualizar relatório e matriz com pendências explícitas.

Nunca declarar que a revisão é completa se código, painel, backend ou configurações de produção relevantes permanecerem sem verificação. Informar o limite com precisão.
