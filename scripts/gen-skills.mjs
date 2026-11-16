import { writeFileSync } from "node:fs";

// categoria | nome | título | regra principal
const rows = `Código|revisar-diff|Revisar um diff antes do commit|Leia o diff inteiro, aponte bugs reais, riscos de regressão e o que falta testar. Não reescreva por gosto pessoal.
Código|refatorar-funcao|Quebrar função longa em partes testáveis|Identifique responsabilidades, extraia funções puras, preserve comportamento e rode a verificação existente ao final.
Código|depurar-erro|Investigar erro com causa raiz|Reproduza, leia a mensagem completa, localize a linha, corrija a causa e repita a verificação que falhou.
Código|adicionar-tipos|Tipar código JavaScript sem any|Derive tipos do formato real dos dados, troque any por uniões e interfaces e rode tsc até zerar.
Código|escrever-teste|Escrever teste que cobre o bug|Reproduza a falha em um teste antes da correção, faça-o passar e mantenha o teste no repositório.
Código|revisar-pr|Revisar pull request com checklist|Verifique escopo, testes, migrações, segredos e compatibilidade antes de aprovar.
Código|migrar-versao|Atualizar dependência com segurança|Leia o changelog, ajuste imports e a API alterada, preserve o lockfile e valide build e tipos.
Código|documentar-api|Documentar endpoints e contratos|Descreva entrada, saída, erros e exemplos reais, sem inventar campos.
Código|otimizar-consulta|Acelerar trecho lento com medição|Meça, identifique o gargalo, corrija, meça de novo e mostre os números.
Código|reduzir-bundle|Diminuir o peso do bundle|Encontre imports pesados, use import dinâmico e compare o tamanho antes e depois.
Código|padronizar-erros|Padronizar mensagens de erro|Erros dizem o que aconteceu e o que fazer, sem tom de desculpa e sem detalhe interno sensível.
Código|escrever-readme|Escrever README que orienta|Diga o que o projeto faz, como rodar, como testar e o que não está pronto, em inglês técnico quando for repositório público.
Código|remover-codigo-morto|Remover código sem uso|Confirme referências com busca, remova em passos pequenos e rode o build entre eles.
Web & Frontend|layout-responsivo|Ajustar layout para mobile|Trabalhe de 390px para cima, use unidades relativas e respeite os pontos de quebra existentes.
Web & Frontend|acessibilidade|Auditar acessibilidade básica|Contraste, foco visível, rótulos aria, ordem de tabulação e texto alternativo.
Web & Frontend|formulario|Criar formulário com validação|Valide no cliente e no servidor, mostre erro por campo e preserve o que o usuário digitou.
Web & Frontend|estado-global|Organizar estado global|Centralize só o que é compartilhado, mantenha o resto local e evite re-render desnecessário.
Web & Frontend|animacao|Adicionar animação discreta|Use transform e opacity, 120 a 200 ms, e respeite prefers-reduced-motion.
Web & Frontend|tema-escuro|Implementar tema claro e escuro|Tokens de cor em variáveis CSS e contraste validado nos dois temas.
Web & Frontend|tabela-dados|Construir tabela com ordenação e busca|Colunas explícitas, estado vazio, paginação ou virtualização acima de 100 linhas.
Web & Frontend|upload-arquivo|Implementar upload com progresso|Valide tipo e tamanho, mostre progresso e trate falha por arquivo.
Web & Frontend|seo-meta|Configurar metadados e Open Graph|Título, descrição, imagem e canonical coerentes com o conteúdo real.
Web & Frontend|pwa|Transformar app em PWA offline|Manifest completo, service worker leve e aviso quando houver versão nova.
Web & Frontend|i18n|Internacionalizar textos|Extraia strings, evite concatenar frases e trate plural e data por locale.
Web & Frontend|canvas|Trabalhar com Canvas 2D|Resolva devicePixelRatio, redesenhe em requestAnimationFrame e libere recursos ao desmontar.
Web & Frontend|video-export|Exportar mídia no navegador|Use MediaRecorder, grave áudio pelo AudioContext e teste o arquivo gerado.
Dados & SQL|modelar-tabela|Modelar tabela relacional|Chaves, tipos, índices e restrições coerentes com o domínio.
Dados & SQL|escrever-migration|Escrever migração reversível|Passos pequenos, idempotentes e com rollback descrito.
Dados & SQL|indice|Criar índice com critério|Meça a consulta antes, crie o índice e confirme o plano de execução depois.
Dados & SQL|rls-policies|Escrever políticas RLS|Uma política por operação, sempre com auth.uid(), testada com dois usuários.
Dados & SQL|backup|Planejar backup e restauração|Frequência, retenção e um teste real de restauração.
Dados & SQL|analytics-query|Responder pergunta com SQL|Use agregações corretas, explique o resultado e cite a fonte.
Dados & SQL|deduplicar|Deduplicar registros|Defina a chave de unicidade, identifique duplicatas e aplique a limpeza com relatório.
Dados & SQL|seed|Criar dados de exemplo|Seed idempotente, realista e restrito ao ambiente de desenvolvimento.
Dados & SQL|cache|Cachear consulta cara|Defina chave, TTL e invalidação explícita; documente o custo evitado.
Dados & SQL|auditoria|Registrar auditoria de mudanças|Tabela de eventos com autor, antes e depois e data, sem dados sensíveis.
Dados & SQL|exportar-csv|Exportar consulta para CSV|Cabeçalho, escape correto e streaming para bases grandes.
Dados & SQL|retencao|Política de retenção de dados|Prazo por tipo de dado, rotina de expurgo e registro do que foi removido.
DevOps & Deploy|pipeline-ci|Montar pipeline de CI|Cache de dependências, jobs paralelos e falha clara com log útil.
DevOps & Deploy|release-tag|Publicar release por tag|Tag versionada, artefatos anexados e notas geradas do histórico.
DevOps & Deploy|dockerfile|Escrever Dockerfile enxuto|Multi-stage, usuário sem root e camadas ordenadas por frequência de mudança.
DevOps & Deploy|deploy-estatico|Publicar site estático|Build reproduzível, cache correto e verificação HTTP depois de publicar.
DevOps & Deploy|logs|Instrumentar logs úteis|Nível adequado, contexto de requisição e nenhum segredo no log.
DevOps & Deploy|monitoramento|Configurar alerta de disponibilidade|Checagem externa, limiar realista e canal de aviso.
DevOps & Deploy|secrets|Gerenciar segredos de CI|Nunca versionar, rotacionar ao vazar e restringir por ambiente.
DevOps & Deploy|rollback|Preparar rollback|Versão anterior identificada, passo a passo e critério de decisão.
DevOps & Deploy|env-vars|Documentar variáveis de ambiente|Nome, finalidade e exemplo sem valor real.
DevOps & Deploy|healthcheck|Criar endpoint de saúde|Responde rápido, verifica dependências e não expõe detalhes internos.
DevOps & Deploy|backup-ci|Versionar artefatos de build|Nome com versão, retenção definida e download verificado.
DevOps & Deploy|matriz-build|Build multiplataforma|Um job por formato, artefatos separados e release dependente de todos.
Produto & UX|escrever-copy|Escrever texto de interface|Voz ativa, sentence case, botão com verbo e sem jargão.
Produto & UX|fluxo-onboarding|Desenhar onboarding curto|Três passos no máximo, valor antes de cadastro e saída clara.
Produto & UX|teste-usabilidade|Rodar teste de usabilidade rápido|Cinco pessoas, tarefa real e observação sem interromper.
Produto & UX|priorizar-backlog|Priorizar com critério explícito|Impacto, esforço e risco declarados, sem empate silencioso.
Produto & UX|empty-state|Criar estados vazios úteis|Explique o que aparece ali e ofereça a ação inicial.
Produto & UX|mensagem-erro|Escrever erro acionável|O que falhou, por quê e o próximo passo.
Produto & UX|acessibilidade-produto|Revisar jornada inclusiva|Teclado, leitor de tela, contraste e tempo de resposta.
Produto & UX|pesquisa-usuario|Estruturar pesquisa com usuários|Pergunta de pesquisa, roteiro e como registrar achados.
Produto & UX|especificacao|Escrever especificação de feature|Problema, escopo, fora de escopo e critérios de aceite.
Produto & UX|design-system|Manter design system|Tokens únicos, componentes pequenos e documentação de uso.
Produto & UX|metricas|Definir métrica de sucesso|Uma métrica principal, baseline e meta com prazo.
Produto & UX|changelog|Escrever changelog para o usuário|O que mudou na prática, em linguagem de quem usa.
Marketing & Conteúdo|roteiro-video|Roteiro de vídeo curto|Gancho em 3 segundos, uma ideia por cena e CTA único.
Marketing & Conteúdo|post-social|Post para rede social|Primeira linha forte, corpo curto e chamada clara.
Marketing & Conteúdo|seo-artigo|Artigo otimizado para busca|Intenção de busca, subtítulos e resposta direta no início.
Marketing & Conteúdo|email|E-mail com um objetivo|Assunto específico, corpo curto e um único CTA.
Marketing & Conteúdo|landing-page|Landing page de conversão|Promessa clara, prova e ação visível sem rolar.
Marketing & Conteúdo|newsletter|Edição de newsletter|Uma ideia central, três itens e encerramento pessoal.
Marketing & Conteúdo|briefing|Briefing criativo|Público, mensagem, formato, prazo e referência.
Marketing & Conteúdo|case|Escrever estudo de caso|Contexto, problema, decisão e resultado com número.
Marketing & Conteúdo|analise-concorrente|Analisar concorrente|Oferta, preço, posicionamento e lacuna explorável.
Marketing & Conteúdo|calendario|Calendário editorial|Cadência realista, tema por semana e reaproveitamento.
Marketing & Conteúdo|copy-anuncio|Anúncio pago|Público, promessa, prova e teste A/B declarado.
Marketing & Conteúdo|documentacao-produto|Documentação para usuário final|Passo a passo numerado, imagem quando necessário e erro comum.
Automação & Integrações|webhook|Receber webhook com segurança|Valide assinatura, responda rápido e processe em segundo plano.
Automação & Integrações|api-rest|Consumir API REST|Trate status, timeout, retry com backoff e limite de taxa.
Automação & Integrações|agendador|Criar tarefa agendada|Idempotência, janela de execução e log do resultado.
Automação & Integrações|fila|Processar fila confiável|Confirmação após sucesso, dead letter e visibilidade de falhas.
Automação & Integrações|composio-toolkit|Conectar ferramenta via Composio|Confira toolkit, conta conectada e argumentos antes de executar.
Automação & Integrações|gmail|Automatizar e-mail com Gmail|Escopo mínimo, rascunho antes de enviar e registro do que foi enviado.
Automação & Integrações|calendar|Automatizar agenda|Conflito de horário, fuso correto e confirmação do usuário.
Automação & Integrações|github-issue|Criar issue a partir de relato|Título específico, passos para reproduzir e ambiente.
Automação & Integrações|notificacao|Enviar notificação útil|Gatilho, canal, frequência e opção de silenciar.
Automação & Integrações|scraping|Coletar dados públicos com respeito|Robots, limite de requisições e cache local.
Automação & Integrações|pesquisa-web|Pesquisa web com fontes|Combine fontes, cite URL e data, e diga quando não encontrou.
Automação & Integrações|planilha|Automatizar planilha|Cabeçalho estável, tipos consistentes e validação de linhas.
Automação & Integrações|pdf|Gerar PDF a partir de dados|Layout fixo, paginação e fonte embutida.
Segurança & Qualidade|auditoria-segredos|Auditar vazamento de chaves|Busque padrões de chave no código e no bundle; rotacione o que vazar.
Segurança & Qualidade|xss|Prevenir XSS|Nunca injete HTML de terceiro; escape e use sanitização confiável.
Segurança & Qualidade|path-traversal|Bloquear path traversal|Normalize caminhos e recuse .. antes de ler arquivo.
Segurança & Qualidade|allowlist-command|Restringir execução de comandos|Allowlist de binários, sem encadeamento e timeout curto.
Segurança & Qualidade|rate-limit|Limitar abuso de endpoint|Limite por usuário, resposta 429 e cabeçalho de retry.
Segurança & Qualidade|lgpd|Revisar dados pessoais|Base legal, minimização, retenção e direito de exclusão.
Segurança & Qualidade|checklist-release|Checklist antes de publicar|Testes, migrações, segredos, rollback e comunicação.
Segurança & Qualidade|dependency-audit|Auditar dependências vulneráveis|Rode a auditoria do gerenciador e trate o que tem correção.
Segurança & Qualidade|sessao|Proteger sessão do usuário|Token curto, refresh seguro e logout que limpa tudo.
Segurança & Qualidade|cors|Configurar CORS com precisão|Origem explícita, métodos necessários e sem curinga com credenciais.
Segurança & Qualidade|validacao-entrada|Validar entrada do usuário|Esquema estrito, tipo, tamanho e mensagem de erro clara.
Segurança & Qualidade|teste-carga|Testar carga básica|Cenário realista, latência p95 e ponto de saturação.
Segurança & Qualidade|post-mortem|Escrever post-mortem|Linha do tempo, causa, impacto e ações com dono e prazo.`;

const entries = rows.split("\n").map((line) => {
  const [category, name, title, description] = line.split("|");
  const markdown = `---
name: ${name}
description: ${description}
---

# ${title}

## Quando usar
${title}.

## Passos
1. Entenda o contexto real antes de mexer: arquivos, dados e versões envolvidas.
2. Faça a menor mudança que resolve o pedido por completo.
3. Verifique com o comando que prova o comportamento, não com suposição.
4. Relate o que foi feito, o que foi verificado e o que ficou de fora.

## Regras
- ${description}
- Nunca invente caminho, API ou versão: confirme no projeto.
- Nada de TODO silencioso: entregue completo ou diga o que faltou.
`;
  return { name, title, category, description, markdown };
});

const categories = [...new Set(entries.map((entry) => entry.category))];

const file = `export interface CatalogSkill {
  name: string;
  title: string;
  category: string;
  description: string;
  markdown: string;
}

export const SKILL_CATEGORIES: string[] = ${JSON.stringify(categories)};

/** Catálogo curado de templates SKILL.md, pronto para instalar em um clique. */
export const SKILL_CATALOG: CatalogSkill[] = ${JSON.stringify(entries, null, 1)};
`;

writeFileSync("lib/skills-catalog.ts", file);
console.log(`skills=${entries.length} categories=${categories.length}`);
