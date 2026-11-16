export interface CatalogSkill {
  name: string;
  title: string;
  category: string;
  description: string;
  markdown: string;
}

export const SKILL_CATEGORIES: string[] = ["Código","Web & Frontend","Dados & SQL","DevOps & Deploy","Produto & UX","Marketing & Conteúdo","Automação & Integrações","Segurança & Qualidade"];

/** Catálogo curado de templates SKILL.md, pronto para instalar em um clique. */
export const SKILL_CATALOG: CatalogSkill[] = [
 {
  "name": "revisar-diff",
  "title": "Revisar um diff antes do commit",
  "category": "Código",
  "description": "Leia o diff inteiro, aponte bugs reais, riscos de regressão e o que falta testar. Não reescreva por gosto pessoal.",
  "markdown": "---\nname: revisar-diff\ndescription: Leia o diff inteiro, aponte bugs reais, riscos de regressão e o que falta testar. Não reescreva por gosto pessoal.\n---\n\n# Revisar um diff antes do commit\n\n## Quando usar\nRevisar um diff antes do commit.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Leia o diff inteiro, aponte bugs reais, riscos de regressão e o que falta testar. Não reescreva por gosto pessoal.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "refatorar-funcao",
  "title": "Quebrar função longa em partes testáveis",
  "category": "Código",
  "description": "Identifique responsabilidades, extraia funções puras, preserve comportamento e rode a verificação existente ao final.",
  "markdown": "---\nname: refatorar-funcao\ndescription: Identifique responsabilidades, extraia funções puras, preserve comportamento e rode a verificação existente ao final.\n---\n\n# Quebrar função longa em partes testáveis\n\n## Quando usar\nQuebrar função longa em partes testáveis.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Identifique responsabilidades, extraia funções puras, preserve comportamento e rode a verificação existente ao final.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "depurar-erro",
  "title": "Investigar erro com causa raiz",
  "category": "Código",
  "description": "Reproduza, leia a mensagem completa, localize a linha, corrija a causa e repita a verificação que falhou.",
  "markdown": "---\nname: depurar-erro\ndescription: Reproduza, leia a mensagem completa, localize a linha, corrija a causa e repita a verificação que falhou.\n---\n\n# Investigar erro com causa raiz\n\n## Quando usar\nInvestigar erro com causa raiz.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Reproduza, leia a mensagem completa, localize a linha, corrija a causa e repita a verificação que falhou.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "adicionar-tipos",
  "title": "Tipar código JavaScript sem any",
  "category": "Código",
  "description": "Derive tipos do formato real dos dados, troque any por uniões e interfaces e rode tsc até zerar.",
  "markdown": "---\nname: adicionar-tipos\ndescription: Derive tipos do formato real dos dados, troque any por uniões e interfaces e rode tsc até zerar.\n---\n\n# Tipar código JavaScript sem any\n\n## Quando usar\nTipar código JavaScript sem any.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Derive tipos do formato real dos dados, troque any por uniões e interfaces e rode tsc até zerar.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "escrever-teste",
  "title": "Escrever teste que cobre o bug",
  "category": "Código",
  "description": "Reproduza a falha em um teste antes da correção, faça-o passar e mantenha o teste no repositório.",
  "markdown": "---\nname: escrever-teste\ndescription: Reproduza a falha em um teste antes da correção, faça-o passar e mantenha o teste no repositório.\n---\n\n# Escrever teste que cobre o bug\n\n## Quando usar\nEscrever teste que cobre o bug.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Reproduza a falha em um teste antes da correção, faça-o passar e mantenha o teste no repositório.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "revisar-pr",
  "title": "Revisar pull request com checklist",
  "category": "Código",
  "description": "Verifique escopo, testes, migrações, segredos e compatibilidade antes de aprovar.",
  "markdown": "---\nname: revisar-pr\ndescription: Verifique escopo, testes, migrações, segredos e compatibilidade antes de aprovar.\n---\n\n# Revisar pull request com checklist\n\n## Quando usar\nRevisar pull request com checklist.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Verifique escopo, testes, migrações, segredos e compatibilidade antes de aprovar.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "migrar-versao",
  "title": "Atualizar dependência com segurança",
  "category": "Código",
  "description": "Leia o changelog, ajuste imports e a API alterada, preserve o lockfile e valide build e tipos.",
  "markdown": "---\nname: migrar-versao\ndescription: Leia o changelog, ajuste imports e a API alterada, preserve o lockfile e valide build e tipos.\n---\n\n# Atualizar dependência com segurança\n\n## Quando usar\nAtualizar dependência com segurança.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Leia o changelog, ajuste imports e a API alterada, preserve o lockfile e valide build e tipos.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "documentar-api",
  "title": "Documentar endpoints e contratos",
  "category": "Código",
  "description": "Descreva entrada, saída, erros e exemplos reais, sem inventar campos.",
  "markdown": "---\nname: documentar-api\ndescription: Descreva entrada, saída, erros e exemplos reais, sem inventar campos.\n---\n\n# Documentar endpoints e contratos\n\n## Quando usar\nDocumentar endpoints e contratos.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Descreva entrada, saída, erros e exemplos reais, sem inventar campos.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "otimizar-consulta",
  "title": "Acelerar trecho lento com medição",
  "category": "Código",
  "description": "Meça, identifique o gargalo, corrija, meça de novo e mostre os números.",
  "markdown": "---\nname: otimizar-consulta\ndescription: Meça, identifique o gargalo, corrija, meça de novo e mostre os números.\n---\n\n# Acelerar trecho lento com medição\n\n## Quando usar\nAcelerar trecho lento com medição.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Meça, identifique o gargalo, corrija, meça de novo e mostre os números.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "reduzir-bundle",
  "title": "Diminuir o peso do bundle",
  "category": "Código",
  "description": "Encontre imports pesados, use import dinâmico e compare o tamanho antes e depois.",
  "markdown": "---\nname: reduzir-bundle\ndescription: Encontre imports pesados, use import dinâmico e compare o tamanho antes e depois.\n---\n\n# Diminuir o peso do bundle\n\n## Quando usar\nDiminuir o peso do bundle.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Encontre imports pesados, use import dinâmico e compare o tamanho antes e depois.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "padronizar-erros",
  "title": "Padronizar mensagens de erro",
  "category": "Código",
  "description": "Erros dizem o que aconteceu e o que fazer, sem tom de desculpa e sem detalhe interno sensível.",
  "markdown": "---\nname: padronizar-erros\ndescription: Erros dizem o que aconteceu e o que fazer, sem tom de desculpa e sem detalhe interno sensível.\n---\n\n# Padronizar mensagens de erro\n\n## Quando usar\nPadronizar mensagens de erro.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Erros dizem o que aconteceu e o que fazer, sem tom de desculpa e sem detalhe interno sensível.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "escrever-readme",
  "title": "Escrever README que orienta",
  "category": "Código",
  "description": "Diga o que o projeto faz, como rodar, como testar e o que não está pronto, em inglês técnico quando for repositório público.",
  "markdown": "---\nname: escrever-readme\ndescription: Diga o que o projeto faz, como rodar, como testar e o que não está pronto, em inglês técnico quando for repositório público.\n---\n\n# Escrever README que orienta\n\n## Quando usar\nEscrever README que orienta.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Diga o que o projeto faz, como rodar, como testar e o que não está pronto, em inglês técnico quando for repositório público.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "remover-codigo-morto",
  "title": "Remover código sem uso",
  "category": "Código",
  "description": "Confirme referências com busca, remova em passos pequenos e rode o build entre eles.",
  "markdown": "---\nname: remover-codigo-morto\ndescription: Confirme referências com busca, remova em passos pequenos e rode o build entre eles.\n---\n\n# Remover código sem uso\n\n## Quando usar\nRemover código sem uso.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Confirme referências com busca, remova em passos pequenos e rode o build entre eles.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "layout-responsivo",
  "title": "Ajustar layout para mobile",
  "category": "Web & Frontend",
  "description": "Trabalhe de 390px para cima, use unidades relativas e respeite os pontos de quebra existentes.",
  "markdown": "---\nname: layout-responsivo\ndescription: Trabalhe de 390px para cima, use unidades relativas e respeite os pontos de quebra existentes.\n---\n\n# Ajustar layout para mobile\n\n## Quando usar\nAjustar layout para mobile.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Trabalhe de 390px para cima, use unidades relativas e respeite os pontos de quebra existentes.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "acessibilidade",
  "title": "Auditar acessibilidade básica",
  "category": "Web & Frontend",
  "description": "Contraste, foco visível, rótulos aria, ordem de tabulação e texto alternativo.",
  "markdown": "---\nname: acessibilidade\ndescription: Contraste, foco visível, rótulos aria, ordem de tabulação e texto alternativo.\n---\n\n# Auditar acessibilidade básica\n\n## Quando usar\nAuditar acessibilidade básica.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Contraste, foco visível, rótulos aria, ordem de tabulação e texto alternativo.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "formulario",
  "title": "Criar formulário com validação",
  "category": "Web & Frontend",
  "description": "Valide no cliente e no servidor, mostre erro por campo e preserve o que o usuário digitou.",
  "markdown": "---\nname: formulario\ndescription: Valide no cliente e no servidor, mostre erro por campo e preserve o que o usuário digitou.\n---\n\n# Criar formulário com validação\n\n## Quando usar\nCriar formulário com validação.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Valide no cliente e no servidor, mostre erro por campo e preserve o que o usuário digitou.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "estado-global",
  "title": "Organizar estado global",
  "category": "Web & Frontend",
  "description": "Centralize só o que é compartilhado, mantenha o resto local e evite re-render desnecessário.",
  "markdown": "---\nname: estado-global\ndescription: Centralize só o que é compartilhado, mantenha o resto local e evite re-render desnecessário.\n---\n\n# Organizar estado global\n\n## Quando usar\nOrganizar estado global.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Centralize só o que é compartilhado, mantenha o resto local e evite re-render desnecessário.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "animacao",
  "title": "Adicionar animação discreta",
  "category": "Web & Frontend",
  "description": "Use transform e opacity, 120 a 200 ms, e respeite prefers-reduced-motion.",
  "markdown": "---\nname: animacao\ndescription: Use transform e opacity, 120 a 200 ms, e respeite prefers-reduced-motion.\n---\n\n# Adicionar animação discreta\n\n## Quando usar\nAdicionar animação discreta.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Use transform e opacity, 120 a 200 ms, e respeite prefers-reduced-motion.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "tema-escuro",
  "title": "Implementar tema claro e escuro",
  "category": "Web & Frontend",
  "description": "Tokens de cor em variáveis CSS e contraste validado nos dois temas.",
  "markdown": "---\nname: tema-escuro\ndescription: Tokens de cor em variáveis CSS e contraste validado nos dois temas.\n---\n\n# Implementar tema claro e escuro\n\n## Quando usar\nImplementar tema claro e escuro.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Tokens de cor em variáveis CSS e contraste validado nos dois temas.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "tabela-dados",
  "title": "Construir tabela com ordenação e busca",
  "category": "Web & Frontend",
  "description": "Colunas explícitas, estado vazio, paginação ou virtualização acima de 100 linhas.",
  "markdown": "---\nname: tabela-dados\ndescription: Colunas explícitas, estado vazio, paginação ou virtualização acima de 100 linhas.\n---\n\n# Construir tabela com ordenação e busca\n\n## Quando usar\nConstruir tabela com ordenação e busca.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Colunas explícitas, estado vazio, paginação ou virtualização acima de 100 linhas.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "upload-arquivo",
  "title": "Implementar upload com progresso",
  "category": "Web & Frontend",
  "description": "Valide tipo e tamanho, mostre progresso e trate falha por arquivo.",
  "markdown": "---\nname: upload-arquivo\ndescription: Valide tipo e tamanho, mostre progresso e trate falha por arquivo.\n---\n\n# Implementar upload com progresso\n\n## Quando usar\nImplementar upload com progresso.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Valide tipo e tamanho, mostre progresso e trate falha por arquivo.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "seo-meta",
  "title": "Configurar metadados e Open Graph",
  "category": "Web & Frontend",
  "description": "Título, descrição, imagem e canonical coerentes com o conteúdo real.",
  "markdown": "---\nname: seo-meta\ndescription: Título, descrição, imagem e canonical coerentes com o conteúdo real.\n---\n\n# Configurar metadados e Open Graph\n\n## Quando usar\nConfigurar metadados e Open Graph.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Título, descrição, imagem e canonical coerentes com o conteúdo real.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "pwa",
  "title": "Transformar app em PWA offline",
  "category": "Web & Frontend",
  "description": "Manifest completo, service worker leve e aviso quando houver versão nova.",
  "markdown": "---\nname: pwa\ndescription: Manifest completo, service worker leve e aviso quando houver versão nova.\n---\n\n# Transformar app em PWA offline\n\n## Quando usar\nTransformar app em PWA offline.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Manifest completo, service worker leve e aviso quando houver versão nova.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "i18n",
  "title": "Internacionalizar textos",
  "category": "Web & Frontend",
  "description": "Extraia strings, evite concatenar frases e trate plural e data por locale.",
  "markdown": "---\nname: i18n\ndescription: Extraia strings, evite concatenar frases e trate plural e data por locale.\n---\n\n# Internacionalizar textos\n\n## Quando usar\nInternacionalizar textos.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Extraia strings, evite concatenar frases e trate plural e data por locale.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "canvas",
  "title": "Trabalhar com Canvas 2D",
  "category": "Web & Frontend",
  "description": "Resolva devicePixelRatio, redesenhe em requestAnimationFrame e libere recursos ao desmontar.",
  "markdown": "---\nname: canvas\ndescription: Resolva devicePixelRatio, redesenhe em requestAnimationFrame e libere recursos ao desmontar.\n---\n\n# Trabalhar com Canvas 2D\n\n## Quando usar\nTrabalhar com Canvas 2D.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Resolva devicePixelRatio, redesenhe em requestAnimationFrame e libere recursos ao desmontar.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "video-export",
  "title": "Exportar mídia no navegador",
  "category": "Web & Frontend",
  "description": "Use MediaRecorder, grave áudio pelo AudioContext e teste o arquivo gerado.",
  "markdown": "---\nname: video-export\ndescription: Use MediaRecorder, grave áudio pelo AudioContext e teste o arquivo gerado.\n---\n\n# Exportar mídia no navegador\n\n## Quando usar\nExportar mídia no navegador.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Use MediaRecorder, grave áudio pelo AudioContext e teste o arquivo gerado.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "modelar-tabela",
  "title": "Modelar tabela relacional",
  "category": "Dados & SQL",
  "description": "Chaves, tipos, índices e restrições coerentes com o domínio.",
  "markdown": "---\nname: modelar-tabela\ndescription: Chaves, tipos, índices e restrições coerentes com o domínio.\n---\n\n# Modelar tabela relacional\n\n## Quando usar\nModelar tabela relacional.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Chaves, tipos, índices e restrições coerentes com o domínio.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "escrever-migration",
  "title": "Escrever migração reversível",
  "category": "Dados & SQL",
  "description": "Passos pequenos, idempotentes e com rollback descrito.",
  "markdown": "---\nname: escrever-migration\ndescription: Passos pequenos, idempotentes e com rollback descrito.\n---\n\n# Escrever migração reversível\n\n## Quando usar\nEscrever migração reversível.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Passos pequenos, idempotentes e com rollback descrito.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "indice",
  "title": "Criar índice com critério",
  "category": "Dados & SQL",
  "description": "Meça a consulta antes, crie o índice e confirme o plano de execução depois.",
  "markdown": "---\nname: indice\ndescription: Meça a consulta antes, crie o índice e confirme o plano de execução depois.\n---\n\n# Criar índice com critério\n\n## Quando usar\nCriar índice com critério.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Meça a consulta antes, crie o índice e confirme o plano de execução depois.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "rls-policies",
  "title": "Escrever políticas RLS",
  "category": "Dados & SQL",
  "description": "Uma política por operação, sempre com auth.uid(), testada com dois usuários.",
  "markdown": "---\nname: rls-policies\ndescription: Uma política por operação, sempre com auth.uid(), testada com dois usuários.\n---\n\n# Escrever políticas RLS\n\n## Quando usar\nEscrever políticas RLS.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Uma política por operação, sempre com auth.uid(), testada com dois usuários.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "backup",
  "title": "Planejar backup e restauração",
  "category": "Dados & SQL",
  "description": "Frequência, retenção e um teste real de restauração.",
  "markdown": "---\nname: backup\ndescription: Frequência, retenção e um teste real de restauração.\n---\n\n# Planejar backup e restauração\n\n## Quando usar\nPlanejar backup e restauração.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Frequência, retenção e um teste real de restauração.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "analytics-query",
  "title": "Responder pergunta com SQL",
  "category": "Dados & SQL",
  "description": "Use agregações corretas, explique o resultado e cite a fonte.",
  "markdown": "---\nname: analytics-query\ndescription: Use agregações corretas, explique o resultado e cite a fonte.\n---\n\n# Responder pergunta com SQL\n\n## Quando usar\nResponder pergunta com SQL.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Use agregações corretas, explique o resultado e cite a fonte.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "deduplicar",
  "title": "Deduplicar registros",
  "category": "Dados & SQL",
  "description": "Defina a chave de unicidade, identifique duplicatas e aplique a limpeza com relatório.",
  "markdown": "---\nname: deduplicar\ndescription: Defina a chave de unicidade, identifique duplicatas e aplique a limpeza com relatório.\n---\n\n# Deduplicar registros\n\n## Quando usar\nDeduplicar registros.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Defina a chave de unicidade, identifique duplicatas e aplique a limpeza com relatório.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "seed",
  "title": "Criar dados de exemplo",
  "category": "Dados & SQL",
  "description": "Seed idempotente, realista e restrito ao ambiente de desenvolvimento.",
  "markdown": "---\nname: seed\ndescription: Seed idempotente, realista e restrito ao ambiente de desenvolvimento.\n---\n\n# Criar dados de exemplo\n\n## Quando usar\nCriar dados de exemplo.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Seed idempotente, realista e restrito ao ambiente de desenvolvimento.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "cache",
  "title": "Cachear consulta cara",
  "category": "Dados & SQL",
  "description": "Defina chave, TTL e invalidação explícita; documente o custo evitado.",
  "markdown": "---\nname: cache\ndescription: Defina chave, TTL e invalidação explícita; documente o custo evitado.\n---\n\n# Cachear consulta cara\n\n## Quando usar\nCachear consulta cara.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Defina chave, TTL e invalidação explícita; documente o custo evitado.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "auditoria",
  "title": "Registrar auditoria de mudanças",
  "category": "Dados & SQL",
  "description": "Tabela de eventos com autor, antes e depois e data, sem dados sensíveis.",
  "markdown": "---\nname: auditoria\ndescription: Tabela de eventos com autor, antes e depois e data, sem dados sensíveis.\n---\n\n# Registrar auditoria de mudanças\n\n## Quando usar\nRegistrar auditoria de mudanças.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Tabela de eventos com autor, antes e depois e data, sem dados sensíveis.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "exportar-csv",
  "title": "Exportar consulta para CSV",
  "category": "Dados & SQL",
  "description": "Cabeçalho, escape correto e streaming para bases grandes.",
  "markdown": "---\nname: exportar-csv\ndescription: Cabeçalho, escape correto e streaming para bases grandes.\n---\n\n# Exportar consulta para CSV\n\n## Quando usar\nExportar consulta para CSV.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Cabeçalho, escape correto e streaming para bases grandes.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "retencao",
  "title": "Política de retenção de dados",
  "category": "Dados & SQL",
  "description": "Prazo por tipo de dado, rotina de expurgo e registro do que foi removido.",
  "markdown": "---\nname: retencao\ndescription: Prazo por tipo de dado, rotina de expurgo e registro do que foi removido.\n---\n\n# Política de retenção de dados\n\n## Quando usar\nPolítica de retenção de dados.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Prazo por tipo de dado, rotina de expurgo e registro do que foi removido.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "pipeline-ci",
  "title": "Montar pipeline de CI",
  "category": "DevOps & Deploy",
  "description": "Cache de dependências, jobs paralelos e falha clara com log útil.",
  "markdown": "---\nname: pipeline-ci\ndescription: Cache de dependências, jobs paralelos e falha clara com log útil.\n---\n\n# Montar pipeline de CI\n\n## Quando usar\nMontar pipeline de CI.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Cache de dependências, jobs paralelos e falha clara com log útil.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "release-tag",
  "title": "Publicar release por tag",
  "category": "DevOps & Deploy",
  "description": "Tag versionada, artefatos anexados e notas geradas do histórico.",
  "markdown": "---\nname: release-tag\ndescription: Tag versionada, artefatos anexados e notas geradas do histórico.\n---\n\n# Publicar release por tag\n\n## Quando usar\nPublicar release por tag.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Tag versionada, artefatos anexados e notas geradas do histórico.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "dockerfile",
  "title": "Escrever Dockerfile enxuto",
  "category": "DevOps & Deploy",
  "description": "Multi-stage, usuário sem root e camadas ordenadas por frequência de mudança.",
  "markdown": "---\nname: dockerfile\ndescription: Multi-stage, usuário sem root e camadas ordenadas por frequência de mudança.\n---\n\n# Escrever Dockerfile enxuto\n\n## Quando usar\nEscrever Dockerfile enxuto.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Multi-stage, usuário sem root e camadas ordenadas por frequência de mudança.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "deploy-estatico",
  "title": "Publicar site estático",
  "category": "DevOps & Deploy",
  "description": "Build reproduzível, cache correto e verificação HTTP depois de publicar.",
  "markdown": "---\nname: deploy-estatico\ndescription: Build reproduzível, cache correto e verificação HTTP depois de publicar.\n---\n\n# Publicar site estático\n\n## Quando usar\nPublicar site estático.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Build reproduzível, cache correto e verificação HTTP depois de publicar.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "logs",
  "title": "Instrumentar logs úteis",
  "category": "DevOps & Deploy",
  "description": "Nível adequado, contexto de requisição e nenhum segredo no log.",
  "markdown": "---\nname: logs\ndescription: Nível adequado, contexto de requisição e nenhum segredo no log.\n---\n\n# Instrumentar logs úteis\n\n## Quando usar\nInstrumentar logs úteis.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Nível adequado, contexto de requisição e nenhum segredo no log.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "monitoramento",
  "title": "Configurar alerta de disponibilidade",
  "category": "DevOps & Deploy",
  "description": "Checagem externa, limiar realista e canal de aviso.",
  "markdown": "---\nname: monitoramento\ndescription: Checagem externa, limiar realista e canal de aviso.\n---\n\n# Configurar alerta de disponibilidade\n\n## Quando usar\nConfigurar alerta de disponibilidade.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Checagem externa, limiar realista e canal de aviso.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "secrets",
  "title": "Gerenciar segredos de CI",
  "category": "DevOps & Deploy",
  "description": "Nunca versionar, rotacionar ao vazar e restringir por ambiente.",
  "markdown": "---\nname: secrets\ndescription: Nunca versionar, rotacionar ao vazar e restringir por ambiente.\n---\n\n# Gerenciar segredos de CI\n\n## Quando usar\nGerenciar segredos de CI.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Nunca versionar, rotacionar ao vazar e restringir por ambiente.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "rollback",
  "title": "Preparar rollback",
  "category": "DevOps & Deploy",
  "description": "Versão anterior identificada, passo a passo e critério de decisão.",
  "markdown": "---\nname: rollback\ndescription: Versão anterior identificada, passo a passo e critério de decisão.\n---\n\n# Preparar rollback\n\n## Quando usar\nPreparar rollback.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Versão anterior identificada, passo a passo e critério de decisão.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "env-vars",
  "title": "Documentar variáveis de ambiente",
  "category": "DevOps & Deploy",
  "description": "Nome, finalidade e exemplo sem valor real.",
  "markdown": "---\nname: env-vars\ndescription: Nome, finalidade e exemplo sem valor real.\n---\n\n# Documentar variáveis de ambiente\n\n## Quando usar\nDocumentar variáveis de ambiente.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Nome, finalidade e exemplo sem valor real.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "healthcheck",
  "title": "Criar endpoint de saúde",
  "category": "DevOps & Deploy",
  "description": "Responde rápido, verifica dependências e não expõe detalhes internos.",
  "markdown": "---\nname: healthcheck\ndescription: Responde rápido, verifica dependências e não expõe detalhes internos.\n---\n\n# Criar endpoint de saúde\n\n## Quando usar\nCriar endpoint de saúde.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Responde rápido, verifica dependências e não expõe detalhes internos.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "backup-ci",
  "title": "Versionar artefatos de build",
  "category": "DevOps & Deploy",
  "description": "Nome com versão, retenção definida e download verificado.",
  "markdown": "---\nname: backup-ci\ndescription: Nome com versão, retenção definida e download verificado.\n---\n\n# Versionar artefatos de build\n\n## Quando usar\nVersionar artefatos de build.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Nome com versão, retenção definida e download verificado.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "matriz-build",
  "title": "Build multiplataforma",
  "category": "DevOps & Deploy",
  "description": "Um job por formato, artefatos separados e release dependente de todos.",
  "markdown": "---\nname: matriz-build\ndescription: Um job por formato, artefatos separados e release dependente de todos.\n---\n\n# Build multiplataforma\n\n## Quando usar\nBuild multiplataforma.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Um job por formato, artefatos separados e release dependente de todos.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "escrever-copy",
  "title": "Escrever texto de interface",
  "category": "Produto & UX",
  "description": "Voz ativa, sentence case, botão com verbo e sem jargão.",
  "markdown": "---\nname: escrever-copy\ndescription: Voz ativa, sentence case, botão com verbo e sem jargão.\n---\n\n# Escrever texto de interface\n\n## Quando usar\nEscrever texto de interface.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Voz ativa, sentence case, botão com verbo e sem jargão.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "fluxo-onboarding",
  "title": "Desenhar onboarding curto",
  "category": "Produto & UX",
  "description": "Três passos no máximo, valor antes de cadastro e saída clara.",
  "markdown": "---\nname: fluxo-onboarding\ndescription: Três passos no máximo, valor antes de cadastro e saída clara.\n---\n\n# Desenhar onboarding curto\n\n## Quando usar\nDesenhar onboarding curto.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Três passos no máximo, valor antes de cadastro e saída clara.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "teste-usabilidade",
  "title": "Rodar teste de usabilidade rápido",
  "category": "Produto & UX",
  "description": "Cinco pessoas, tarefa real e observação sem interromper.",
  "markdown": "---\nname: teste-usabilidade\ndescription: Cinco pessoas, tarefa real e observação sem interromper.\n---\n\n# Rodar teste de usabilidade rápido\n\n## Quando usar\nRodar teste de usabilidade rápido.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Cinco pessoas, tarefa real e observação sem interromper.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "priorizar-backlog",
  "title": "Priorizar com critério explícito",
  "category": "Produto & UX",
  "description": "Impacto, esforço e risco declarados, sem empate silencioso.",
  "markdown": "---\nname: priorizar-backlog\ndescription: Impacto, esforço e risco declarados, sem empate silencioso.\n---\n\n# Priorizar com critério explícito\n\n## Quando usar\nPriorizar com critério explícito.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Impacto, esforço e risco declarados, sem empate silencioso.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "empty-state",
  "title": "Criar estados vazios úteis",
  "category": "Produto & UX",
  "description": "Explique o que aparece ali e ofereça a ação inicial.",
  "markdown": "---\nname: empty-state\ndescription: Explique o que aparece ali e ofereça a ação inicial.\n---\n\n# Criar estados vazios úteis\n\n## Quando usar\nCriar estados vazios úteis.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Explique o que aparece ali e ofereça a ação inicial.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "mensagem-erro",
  "title": "Escrever erro acionável",
  "category": "Produto & UX",
  "description": "O que falhou, por quê e o próximo passo.",
  "markdown": "---\nname: mensagem-erro\ndescription: O que falhou, por quê e o próximo passo.\n---\n\n# Escrever erro acionável\n\n## Quando usar\nEscrever erro acionável.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- O que falhou, por quê e o próximo passo.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "acessibilidade-produto",
  "title": "Revisar jornada inclusiva",
  "category": "Produto & UX",
  "description": "Teclado, leitor de tela, contraste e tempo de resposta.",
  "markdown": "---\nname: acessibilidade-produto\ndescription: Teclado, leitor de tela, contraste e tempo de resposta.\n---\n\n# Revisar jornada inclusiva\n\n## Quando usar\nRevisar jornada inclusiva.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Teclado, leitor de tela, contraste e tempo de resposta.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "pesquisa-usuario",
  "title": "Estruturar pesquisa com usuários",
  "category": "Produto & UX",
  "description": "Pergunta de pesquisa, roteiro e como registrar achados.",
  "markdown": "---\nname: pesquisa-usuario\ndescription: Pergunta de pesquisa, roteiro e como registrar achados.\n---\n\n# Estruturar pesquisa com usuários\n\n## Quando usar\nEstruturar pesquisa com usuários.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Pergunta de pesquisa, roteiro e como registrar achados.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "especificacao",
  "title": "Escrever especificação de feature",
  "category": "Produto & UX",
  "description": "Problema, escopo, fora de escopo e critérios de aceite.",
  "markdown": "---\nname: especificacao\ndescription: Problema, escopo, fora de escopo e critérios de aceite.\n---\n\n# Escrever especificação de feature\n\n## Quando usar\nEscrever especificação de feature.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Problema, escopo, fora de escopo e critérios de aceite.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "design-system",
  "title": "Manter design system",
  "category": "Produto & UX",
  "description": "Tokens únicos, componentes pequenos e documentação de uso.",
  "markdown": "---\nname: design-system\ndescription: Tokens únicos, componentes pequenos e documentação de uso.\n---\n\n# Manter design system\n\n## Quando usar\nManter design system.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Tokens únicos, componentes pequenos e documentação de uso.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "metricas",
  "title": "Definir métrica de sucesso",
  "category": "Produto & UX",
  "description": "Uma métrica principal, baseline e meta com prazo.",
  "markdown": "---\nname: metricas\ndescription: Uma métrica principal, baseline e meta com prazo.\n---\n\n# Definir métrica de sucesso\n\n## Quando usar\nDefinir métrica de sucesso.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Uma métrica principal, baseline e meta com prazo.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "changelog",
  "title": "Escrever changelog para o usuário",
  "category": "Produto & UX",
  "description": "O que mudou na prática, em linguagem de quem usa.",
  "markdown": "---\nname: changelog\ndescription: O que mudou na prática, em linguagem de quem usa.\n---\n\n# Escrever changelog para o usuário\n\n## Quando usar\nEscrever changelog para o usuário.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- O que mudou na prática, em linguagem de quem usa.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "roteiro-video",
  "title": "Roteiro de vídeo curto",
  "category": "Marketing & Conteúdo",
  "description": "Gancho em 3 segundos, uma ideia por cena e CTA único.",
  "markdown": "---\nname: roteiro-video\ndescription: Gancho em 3 segundos, uma ideia por cena e CTA único.\n---\n\n# Roteiro de vídeo curto\n\n## Quando usar\nRoteiro de vídeo curto.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Gancho em 3 segundos, uma ideia por cena e CTA único.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "post-social",
  "title": "Post para rede social",
  "category": "Marketing & Conteúdo",
  "description": "Primeira linha forte, corpo curto e chamada clara.",
  "markdown": "---\nname: post-social\ndescription: Primeira linha forte, corpo curto e chamada clara.\n---\n\n# Post para rede social\n\n## Quando usar\nPost para rede social.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Primeira linha forte, corpo curto e chamada clara.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "seo-artigo",
  "title": "Artigo otimizado para busca",
  "category": "Marketing & Conteúdo",
  "description": "Intenção de busca, subtítulos e resposta direta no início.",
  "markdown": "---\nname: seo-artigo\ndescription: Intenção de busca, subtítulos e resposta direta no início.\n---\n\n# Artigo otimizado para busca\n\n## Quando usar\nArtigo otimizado para busca.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Intenção de busca, subtítulos e resposta direta no início.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "email",
  "title": "E-mail com um objetivo",
  "category": "Marketing & Conteúdo",
  "description": "Assunto específico, corpo curto e um único CTA.",
  "markdown": "---\nname: email\ndescription: Assunto específico, corpo curto e um único CTA.\n---\n\n# E-mail com um objetivo\n\n## Quando usar\nE-mail com um objetivo.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Assunto específico, corpo curto e um único CTA.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "landing-page",
  "title": "Landing page de conversão",
  "category": "Marketing & Conteúdo",
  "description": "Promessa clara, prova e ação visível sem rolar.",
  "markdown": "---\nname: landing-page\ndescription: Promessa clara, prova e ação visível sem rolar.\n---\n\n# Landing page de conversão\n\n## Quando usar\nLanding page de conversão.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Promessa clara, prova e ação visível sem rolar.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "newsletter",
  "title": "Edição de newsletter",
  "category": "Marketing & Conteúdo",
  "description": "Uma ideia central, três itens e encerramento pessoal.",
  "markdown": "---\nname: newsletter\ndescription: Uma ideia central, três itens e encerramento pessoal.\n---\n\n# Edição de newsletter\n\n## Quando usar\nEdição de newsletter.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Uma ideia central, três itens e encerramento pessoal.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "briefing",
  "title": "Briefing criativo",
  "category": "Marketing & Conteúdo",
  "description": "Público, mensagem, formato, prazo e referência.",
  "markdown": "---\nname: briefing\ndescription: Público, mensagem, formato, prazo e referência.\n---\n\n# Briefing criativo\n\n## Quando usar\nBriefing criativo.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Público, mensagem, formato, prazo e referência.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "case",
  "title": "Escrever estudo de caso",
  "category": "Marketing & Conteúdo",
  "description": "Contexto, problema, decisão e resultado com número.",
  "markdown": "---\nname: case\ndescription: Contexto, problema, decisão e resultado com número.\n---\n\n# Escrever estudo de caso\n\n## Quando usar\nEscrever estudo de caso.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Contexto, problema, decisão e resultado com número.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "analise-concorrente",
  "title": "Analisar concorrente",
  "category": "Marketing & Conteúdo",
  "description": "Oferta, preço, posicionamento e lacuna explorável.",
  "markdown": "---\nname: analise-concorrente\ndescription: Oferta, preço, posicionamento e lacuna explorável.\n---\n\n# Analisar concorrente\n\n## Quando usar\nAnalisar concorrente.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Oferta, preço, posicionamento e lacuna explorável.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "calendario",
  "title": "Calendário editorial",
  "category": "Marketing & Conteúdo",
  "description": "Cadência realista, tema por semana e reaproveitamento.",
  "markdown": "---\nname: calendario\ndescription: Cadência realista, tema por semana e reaproveitamento.\n---\n\n# Calendário editorial\n\n## Quando usar\nCalendário editorial.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Cadência realista, tema por semana e reaproveitamento.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "copy-anuncio",
  "title": "Anúncio pago",
  "category": "Marketing & Conteúdo",
  "description": "Público, promessa, prova e teste A/B declarado.",
  "markdown": "---\nname: copy-anuncio\ndescription: Público, promessa, prova e teste A/B declarado.\n---\n\n# Anúncio pago\n\n## Quando usar\nAnúncio pago.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Público, promessa, prova e teste A/B declarado.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "documentacao-produto",
  "title": "Documentação para usuário final",
  "category": "Marketing & Conteúdo",
  "description": "Passo a passo numerado, imagem quando necessário e erro comum.",
  "markdown": "---\nname: documentacao-produto\ndescription: Passo a passo numerado, imagem quando necessário e erro comum.\n---\n\n# Documentação para usuário final\n\n## Quando usar\nDocumentação para usuário final.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Passo a passo numerado, imagem quando necessário e erro comum.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "webhook",
  "title": "Receber webhook com segurança",
  "category": "Automação & Integrações",
  "description": "Valide assinatura, responda rápido e processe em segundo plano.",
  "markdown": "---\nname: webhook\ndescription: Valide assinatura, responda rápido e processe em segundo plano.\n---\n\n# Receber webhook com segurança\n\n## Quando usar\nReceber webhook com segurança.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Valide assinatura, responda rápido e processe em segundo plano.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "api-rest",
  "title": "Consumir API REST",
  "category": "Automação & Integrações",
  "description": "Trate status, timeout, retry com backoff e limite de taxa.",
  "markdown": "---\nname: api-rest\ndescription: Trate status, timeout, retry com backoff e limite de taxa.\n---\n\n# Consumir API REST\n\n## Quando usar\nConsumir API REST.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Trate status, timeout, retry com backoff e limite de taxa.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "agendador",
  "title": "Criar tarefa agendada",
  "category": "Automação & Integrações",
  "description": "Idempotência, janela de execução e log do resultado.",
  "markdown": "---\nname: agendador\ndescription: Idempotência, janela de execução e log do resultado.\n---\n\n# Criar tarefa agendada\n\n## Quando usar\nCriar tarefa agendada.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Idempotência, janela de execução e log do resultado.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "fila",
  "title": "Processar fila confiável",
  "category": "Automação & Integrações",
  "description": "Confirmação após sucesso, dead letter e visibilidade de falhas.",
  "markdown": "---\nname: fila\ndescription: Confirmação após sucesso, dead letter e visibilidade de falhas.\n---\n\n# Processar fila confiável\n\n## Quando usar\nProcessar fila confiável.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Confirmação após sucesso, dead letter e visibilidade de falhas.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "composio-toolkit",
  "title": "Conectar ferramenta via Composio",
  "category": "Automação & Integrações",
  "description": "Confira toolkit, conta conectada e argumentos antes de executar.",
  "markdown": "---\nname: composio-toolkit\ndescription: Confira toolkit, conta conectada e argumentos antes de executar.\n---\n\n# Conectar ferramenta via Composio\n\n## Quando usar\nConectar ferramenta via Composio.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Confira toolkit, conta conectada e argumentos antes de executar.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "gmail",
  "title": "Automatizar e-mail com Gmail",
  "category": "Automação & Integrações",
  "description": "Escopo mínimo, rascunho antes de enviar e registro do que foi enviado.",
  "markdown": "---\nname: gmail\ndescription: Escopo mínimo, rascunho antes de enviar e registro do que foi enviado.\n---\n\n# Automatizar e-mail com Gmail\n\n## Quando usar\nAutomatizar e-mail com Gmail.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Escopo mínimo, rascunho antes de enviar e registro do que foi enviado.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "calendar",
  "title": "Automatizar agenda",
  "category": "Automação & Integrações",
  "description": "Conflito de horário, fuso correto e confirmação do usuário.",
  "markdown": "---\nname: calendar\ndescription: Conflito de horário, fuso correto e confirmação do usuário.\n---\n\n# Automatizar agenda\n\n## Quando usar\nAutomatizar agenda.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Conflito de horário, fuso correto e confirmação do usuário.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "github-issue",
  "title": "Criar issue a partir de relato",
  "category": "Automação & Integrações",
  "description": "Título específico, passos para reproduzir e ambiente.",
  "markdown": "---\nname: github-issue\ndescription: Título específico, passos para reproduzir e ambiente.\n---\n\n# Criar issue a partir de relato\n\n## Quando usar\nCriar issue a partir de relato.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Título específico, passos para reproduzir e ambiente.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "notificacao",
  "title": "Enviar notificação útil",
  "category": "Automação & Integrações",
  "description": "Gatilho, canal, frequência e opção de silenciar.",
  "markdown": "---\nname: notificacao\ndescription: Gatilho, canal, frequência e opção de silenciar.\n---\n\n# Enviar notificação útil\n\n## Quando usar\nEnviar notificação útil.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Gatilho, canal, frequência e opção de silenciar.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "scraping",
  "title": "Coletar dados públicos com respeito",
  "category": "Automação & Integrações",
  "description": "Robots, limite de requisições e cache local.",
  "markdown": "---\nname: scraping\ndescription: Robots, limite de requisições e cache local.\n---\n\n# Coletar dados públicos com respeito\n\n## Quando usar\nColetar dados públicos com respeito.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Robots, limite de requisições e cache local.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "pesquisa-web",
  "title": "Pesquisa web com fontes",
  "category": "Automação & Integrações",
  "description": "Combine fontes, cite URL e data, e diga quando não encontrou.",
  "markdown": "---\nname: pesquisa-web\ndescription: Combine fontes, cite URL e data, e diga quando não encontrou.\n---\n\n# Pesquisa web com fontes\n\n## Quando usar\nPesquisa web com fontes.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Combine fontes, cite URL e data, e diga quando não encontrou.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "planilha",
  "title": "Automatizar planilha",
  "category": "Automação & Integrações",
  "description": "Cabeçalho estável, tipos consistentes e validação de linhas.",
  "markdown": "---\nname: planilha\ndescription: Cabeçalho estável, tipos consistentes e validação de linhas.\n---\n\n# Automatizar planilha\n\n## Quando usar\nAutomatizar planilha.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Cabeçalho estável, tipos consistentes e validação de linhas.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "pdf",
  "title": "Gerar PDF a partir de dados",
  "category": "Automação & Integrações",
  "description": "Layout fixo, paginação e fonte embutida.",
  "markdown": "---\nname: pdf\ndescription: Layout fixo, paginação e fonte embutida.\n---\n\n# Gerar PDF a partir de dados\n\n## Quando usar\nGerar PDF a partir de dados.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Layout fixo, paginação e fonte embutida.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "auditoria-segredos",
  "title": "Auditar vazamento de chaves",
  "category": "Segurança & Qualidade",
  "description": "Busque padrões de chave no código e no bundle; rotacione o que vazar.",
  "markdown": "---\nname: auditoria-segredos\ndescription: Busque padrões de chave no código e no bundle; rotacione o que vazar.\n---\n\n# Auditar vazamento de chaves\n\n## Quando usar\nAuditar vazamento de chaves.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Busque padrões de chave no código e no bundle; rotacione o que vazar.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "xss",
  "title": "Prevenir XSS",
  "category": "Segurança & Qualidade",
  "description": "Nunca injete HTML de terceiro; escape e use sanitização confiável.",
  "markdown": "---\nname: xss\ndescription: Nunca injete HTML de terceiro; escape e use sanitização confiável.\n---\n\n# Prevenir XSS\n\n## Quando usar\nPrevenir XSS.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Nunca injete HTML de terceiro; escape e use sanitização confiável.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "path-traversal",
  "title": "Bloquear path traversal",
  "category": "Segurança & Qualidade",
  "description": "Normalize caminhos e recuse .. antes de ler arquivo.",
  "markdown": "---\nname: path-traversal\ndescription: Normalize caminhos e recuse .. antes de ler arquivo.\n---\n\n# Bloquear path traversal\n\n## Quando usar\nBloquear path traversal.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Normalize caminhos e recuse .. antes de ler arquivo.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "allowlist-command",
  "title": "Restringir execução de comandos",
  "category": "Segurança & Qualidade",
  "description": "Allowlist de binários, sem encadeamento e timeout curto.",
  "markdown": "---\nname: allowlist-command\ndescription: Allowlist de binários, sem encadeamento e timeout curto.\n---\n\n# Restringir execução de comandos\n\n## Quando usar\nRestringir execução de comandos.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Allowlist de binários, sem encadeamento e timeout curto.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "rate-limit",
  "title": "Limitar abuso de endpoint",
  "category": "Segurança & Qualidade",
  "description": "Limite por usuário, resposta 429 e cabeçalho de retry.",
  "markdown": "---\nname: rate-limit\ndescription: Limite por usuário, resposta 429 e cabeçalho de retry.\n---\n\n# Limitar abuso de endpoint\n\n## Quando usar\nLimitar abuso de endpoint.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Limite por usuário, resposta 429 e cabeçalho de retry.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "lgpd",
  "title": "Revisar dados pessoais",
  "category": "Segurança & Qualidade",
  "description": "Base legal, minimização, retenção e direito de exclusão.",
  "markdown": "---\nname: lgpd\ndescription: Base legal, minimização, retenção e direito de exclusão.\n---\n\n# Revisar dados pessoais\n\n## Quando usar\nRevisar dados pessoais.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Base legal, minimização, retenção e direito de exclusão.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "checklist-release",
  "title": "Checklist antes de publicar",
  "category": "Segurança & Qualidade",
  "description": "Testes, migrações, segredos, rollback e comunicação.",
  "markdown": "---\nname: checklist-release\ndescription: Testes, migrações, segredos, rollback e comunicação.\n---\n\n# Checklist antes de publicar\n\n## Quando usar\nChecklist antes de publicar.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Testes, migrações, segredos, rollback e comunicação.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "dependency-audit",
  "title": "Auditar dependências vulneráveis",
  "category": "Segurança & Qualidade",
  "description": "Rode a auditoria do gerenciador e trate o que tem correção.",
  "markdown": "---\nname: dependency-audit\ndescription: Rode a auditoria do gerenciador e trate o que tem correção.\n---\n\n# Auditar dependências vulneráveis\n\n## Quando usar\nAuditar dependências vulneráveis.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Rode a auditoria do gerenciador e trate o que tem correção.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "sessao",
  "title": "Proteger sessão do usuário",
  "category": "Segurança & Qualidade",
  "description": "Token curto, refresh seguro e logout que limpa tudo.",
  "markdown": "---\nname: sessao\ndescription: Token curto, refresh seguro e logout que limpa tudo.\n---\n\n# Proteger sessão do usuário\n\n## Quando usar\nProteger sessão do usuário.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Token curto, refresh seguro e logout que limpa tudo.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "cors",
  "title": "Configurar CORS com precisão",
  "category": "Segurança & Qualidade",
  "description": "Origem explícita, métodos necessários e sem curinga com credenciais.",
  "markdown": "---\nname: cors\ndescription: Origem explícita, métodos necessários e sem curinga com credenciais.\n---\n\n# Configurar CORS com precisão\n\n## Quando usar\nConfigurar CORS com precisão.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Origem explícita, métodos necessários e sem curinga com credenciais.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "validacao-entrada",
  "title": "Validar entrada do usuário",
  "category": "Segurança & Qualidade",
  "description": "Esquema estrito, tipo, tamanho e mensagem de erro clara.",
  "markdown": "---\nname: validacao-entrada\ndescription: Esquema estrito, tipo, tamanho e mensagem de erro clara.\n---\n\n# Validar entrada do usuário\n\n## Quando usar\nValidar entrada do usuário.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Esquema estrito, tipo, tamanho e mensagem de erro clara.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "teste-carga",
  "title": "Testar carga básica",
  "category": "Segurança & Qualidade",
  "description": "Cenário realista, latência p95 e ponto de saturação.",
  "markdown": "---\nname: teste-carga\ndescription: Cenário realista, latência p95 e ponto de saturação.\n---\n\n# Testar carga básica\n\n## Quando usar\nTestar carga básica.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Cenário realista, latência p95 e ponto de saturação.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 },
 {
  "name": "post-mortem",
  "title": "Escrever post-mortem",
  "category": "Segurança & Qualidade",
  "description": "Linha do tempo, causa, impacto e ações com dono e prazo.",
  "markdown": "---\nname: post-mortem\ndescription: Linha do tempo, causa, impacto e ações com dono e prazo.\n---\n\n# Escrever post-mortem\n\n## Quando usar\nEscrever post-mortem.\n\n## Passos\n1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.\n2. Faça a menor mudança que resolve o pedido por completo.\n3. Verifique com o comando que prova o comportamento, não com suposição.\n4. Relate o que foi feito, o que foi verificado e o que ficou de fora.\n\n## Regras\n- Linha do tempo, causa, impacto e ações com dono e prazo.\n- Nunca invente caminho, API ou versão: confirme no projeto.\n- Nada de TODO silencioso: entregue completo ou diga o que faltou.\n"
 }
];
