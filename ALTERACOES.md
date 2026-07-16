# ALTERAÇÕES — Auditoria Completa do Sistema CNM

Data: 16/07/2026

> **Adendo (mesma data):** após a auditoria, foram implementados os ajustes de produto descritos na seção
> [Ajustes pós-auditoria](#ajustes-pós-auditoria-16072026) ao final deste documento.

## Diagnóstico da causa raiz (leia primeiro)

O sintoma geral — "dados salvos no Admin não aparecem na landing page" — tinha **uma única causa raiz sistêmica**, confirmada inspecionando os documentos reais do Firestore via REST API:

**O site em produção estava servindo uma versão antiga do `admin.js` (cache do Firebase Hosting, que guarda JS/CSS por até 1 hora sem cabeçalhos configurados). Essa versão antiga gravava os documentos em um formato que a versão atual da landing page não sabe ler — e a camada de leitura ainda descartava silenciosamente documentos "legados".**

Evidências encontradas no banco (documentos reais):

| Coleção | Como estava salvo | O que a landing esperava |
| --- | --- | --- |
| `races` | `date: "2026-07-16"`, `time: "08:00"`, `dateTime: ""` (vazio) | `dateTime: "2026-07-16T08:00:00"` |
| `news` | **sem** campo `createdAt` | `createdAt` presente (a query `orderBy('createdAt')` **exclui** docs sem o campo) |
| `results` | campos soltos `driver-1`, `points-1`, `time-1`, … | array `entries: [{driverId, position, points, lapTime}]` |
| `drivers` | `showInHallOfFame: "on"` (string), `number: "05"` (string) | `showInHallOfFame: true` (boolean), `number` numérico |

Ou seja: o salvamento "funcionava" (documentos existiam no banco), mas em formato incompatível — e todos os erros eram silenciosos.

A solução foi em três frentes:

1. **Leitura tolerante**: a camada de dados agora normaliza qualquer documento, novo ou legado — nada mais some da landing page.
2. **Gravação canônica**: o Admin agora sempre grava no formato correto, e reeditar+salvar um registro antigo o migra automaticamente para o formato canônico (limpando os campos legados).
3. **Cache sob controle**: cabeçalhos de cache no Firebase Hosting + versionamento dos assets (`?v=`) para que nenhum navegador volte a rodar JS desatualizado.

---

## Resumo das alterações

### Arquivos modificados
- `firebase-data.js` — **reescrito**: camada de dados única com normalizadores, sem `orderBy`, estatísticas de pilotos, helpers de status/ordenação de corrida compartilhados.
- `admin.js` — **reescrito**: gravação canônica com `set()` sem merge (migra legados), preservação de `createdAt` em edição, correção de bug de timezone, remoção de código morto.
- `script.js` — **reescrito**: sem fallback de dados fictícios quando o Firebase está configurado, estados vazios explícitos, escape de HTML em todo dado dinâmico, calendário/vencedor/hall/classificação corrigidos.
- `admin.html` — removidos inputs ocultos mortos (`dateTime`, `entriesText`); versão dos assets atualizada.
- `index.html` / `login.html` — versão dos assets atualizada (`?v=20260717`).
- `style.css` — tipografia de "Nosso Time" e "Patrocinadores" harmonizada com o restante do site.
- `firebase.json` — cabeçalhos de cache e lista de exclusão do deploy.

### Arquivos criados
- `.gitignore` — ignora `.firebase/` (cache local de deploy) e logs.
- `.claude/launch.json` — configuração de servidor local para testes.
- `ALTERACOES.md` — este documento.

### Arquivos removidos / renomeados
- Nenhum arquivo foi removido ou renomeado (o código morto foi eliminado dentro dos arquivos).

---

## Erros encontrados

### 1. Notícias não apareciam na landing page
- **Causa**: a consulta usava `orderBy('createdAt', 'desc')`. No Firestore, `orderBy` **exclui documentos que não possuem o campo ordenado**. A notícia existente no banco foi salva pelo `admin.js` antigo, que não gravava `createdAt` — então ela nunca era retornada. Falha silenciosa (o erro era engolido e a landing caía no array de demonstração, mascarando o problema).
- **Impacto**: nenhuma notícia real aparecia; o portal mostrava notícias fictícias.
- **Solução**: nenhuma consulta usa mais `orderBy`; a ordenação é feita no cliente sobre dados normalizados (docs sem `createdAt` vão para o fim). O Admin agora sempre grava `createdAt` e **preserva o valor original ao editar** (antes, cada edição "renovava" a data e reordenava a notícia).

### 2. Calendário mostrava "Data a definir / Horário a definir"
- **Causa**: o documento da corrida tinha `dateTime: ""` (vazio) e os valores reais em `date`/`time` soltos — formato gravado pelo `admin.js` antigo em cache. A landing só lia `dateTime`.
- **Impacto**: data e hora cadastradas eram ignoradas; ordenação cronológica impossível.
- **Solução**: o normalizador de corridas reconstrói `dateTime` a partir de `date`+`time` legados quando necessário. A ordenação cronológica usa o timestamp real (datas inválidas vão para o fim). A contagem regressiva agora aponta para o **horário real da corrida** (antes apontava para 12h do dia da prova, um bug independente).

### 3. Resultados não pontuavam ninguém
- **Causa**: o resultado foi salvo como 40+ campos soltos (`driver-1`, `points-1`, `time-2`, `entriesText`, …) em vez do array `entries` — de novo, o `admin.js` antigo em cache enviou o `FormData` cru. Todo o cálculo de pontos, classificação e vencedor itera `result.entries`, que não existia.
- **Impacto**: classificação zerada, "Último Vencedor" com dados fictícios, Hall da Fama sem estatísticas.
- **Solução**: o normalizador de resultados reconstrói `entries` a partir dos campos legados `driver-N`/`points-N`/`time-N`. O Admin passou a gravar somente o formato canônico e os pontos vêm da tabela F1 oficial (25-18-15-12-10-8-6-4-2-1) — o campo readonly não é mais a fonte.

### 4. Hall da Fama vazio
- **Causa dupla**: (a) o checkbox era salvo como a string `"on"` e o filtro exigia `=== true` (boolean); (b) os cards exibiam `titles/wins/seasons`, campos que **não existem** no formulário de pilotos — sempre zerados.
- **Impacto**: mensagem "Nenhum piloto marcado" mesmo com pilotos marcados; estatísticas sem sentido.
- **Solução**: o normalizador aceita `true` ou `"on"`; o Admin grava boolean de verdade. As estatísticas agora são **calculadas automaticamente dos resultados**: Vitórias, Pódios e Pontos — atualizam sozinhas a cada resultado publicado.

### 5. Bug de timezone na edição de corridas
- **Causa**: ao editar uma etapa, o Admin convertia `dateTime` com `new Date(...).toISOString()`, que é UTC. No fuso do Brasil (UTC-3), corridas a partir das 21h **mudavam de dia** no formulário.
- **Impacto**: editar e salvar uma corrida noturna corrompia a data.
- **Solução**: o preenchimento do formulário divide a string local diretamente (`split('T')`), sem conversão de fuso.

### 6. Erros silenciosos e fallback que mascarava falhas
- **Causa**: cada consulta engolia erros (`console.warn` + array vazio) e a landing só substituía os dados fictícios `if (data.X.length)` — qualquer falha resultava em página "bonita" com dados falsos.
- **Impacto**: era impossível perceber que os dados reais não estavam chegando ("aparentemente salvos").
- **Solução**: com Firebase configurado, os dados publicados **substituem integralmente** os de demonstração (mesmo vazios), com estados vazios explícitos em cada seção ("Nenhuma notícia publicada ainda", etc.). Falhas de carga agora geram `console.error` visível.

### 7. Cache servindo JavaScript desatualizado (a origem de tudo)
- **Causa**: Firebase Hosting sem cabeçalhos de cache configurados serve assets com `max-age=3600`; após um deploy, navegadores continuavam executando o `admin.js` antigo por até 1 hora — que foi exatamente o que gravou os documentos em formato legado.
- **Impacto**: qualquer correção futura demoraria a chegar aos usuários e poderia voltar a corromper dados.
- **Solução**: `firebase.json` agora define `Cache-Control: no-cache` para HTML e `max-age=300, must-revalidate` para JS/CSS, além do versionamento `?v=20260717` nos assets. `.firebase/`, `.claude/`, `.agents/` e afins foram excluídos do deploy.

### 8. Risco de XSS / quebra de layout
- **Causa**: a landing page injetava strings do banco via `innerHTML` sem escape.
- **Impacto**: um título com `<` ou `"` quebraria o layout; conteúdo malicioso executaria script (baixo risco — só admins escrevem — mas real).
- **Solução**: `escapeHtml()` aplicado a todo dado dinâmico na landing e no painel.

---

## Refatorações

1. **`firebase-data.js` como camada de dados única** — painel e landing consomem os MESMOS normalizadores e helpers (`raceStatus`, `raceTimestamp`, `getStandings`, `getDriverStats`). Motivo: a lógica de status/data de corrida existia duplicada (e divergente) em `admin.js` e `script.js`; qualquer correção precisava ser feita duas vezes e era esquecida em uma delas.
2. **Gravação canônica com `set()` sem merge** — o documento é totalmente substituído ao salvar. Motivo: com `merge: true`, os campos legados (`driver-N`, `entriesText`, `date`/`time` soltos) permaneceriam para sempre no banco. Agora, **reeditar e salvar qualquer registro antigo o migra automaticamente para o formato limpo**.
3. **Eliminação de código morto** em `admin.js`: `autoSetRaceStatus()` (o status calculado era deletado na linha seguinte — nunca usado), campo `entriesText`, input oculto `dateTime`, funções duplicadas de status.
4. **Eliminação de código morto** em `script.js`: `normalizeRaceStatus()`/`computeRaceStatus()`/`raceDateValue()` locais (substituídos pelos helpers compartilhados), `STATUS_LABEL` não usado, `getLatestWinner()` (lógica incorporada e corrigida em `initWinner`).
5. **Dados de demonstração isolados** — mocks só aparecem quando o Firebase não está configurado ou a carga falha; nunca se misturam com dados reais.
6. **Status de corrida unificado**: `proxima` (antes da largada) → `andamento` (largada + 3h) → `finalizada`. Antes, a landing considerava "em andamento" qualquer horário entre 12h e meia-noite do dia da prova, ignorando a hora cadastrada.

## Melhorias implementadas (além do solicitado)

- **Gap para o 2º colocado calculado de verdade** no card "Último Vencedor" (diferença entre os tempos de P1 e P2, ex.: `+2.078s`). Antes era um valor fixo falso (`+0.234s`), assim como o tempo de volta padrão (`1:23.456`).
- **Estatísticas do Hall da Fama automáticas** (vitórias, pódios, pontos) derivadas dos resultados.
- **Estados vazios amigáveis** em todas as seções da landing.
- **Preenchimento correto de "Data de publicação"** ao editar um resultado (conversão ISO ↔ `datetime-local`).
- **Escape de HTML** em todo conteúdo dinâmico (landing e painel).
- **`.gitignore`** criado (o diretório `.firebase/` estava prestes a ser commitado).

## Possíveis novas funcionalidades

- Gerenciar "Nosso Time" e "Patrocinadores/Parcerias" pelo painel (hoje são conteúdo fixo no `script.js` — por isso não são afetados pelo Admin).
- Upload de fotos de pilotos via Firebase Storage (hoje é só URL externa).
- Página de detalhes por etapa (grid completo do resultado, voltas, pódio).
- Classificação de construtores (soma de pontos por equipe — os dados já permitem).
- Notícias com corpo completo e página própria ("Ler mais" hoje não leva a lugar algum).
- Campo "temporada" nos dados para arquivar anos anteriores sem apagar registros.

## Configurações necessárias

1. **Publicar as regras do Firestore e o site** (na raiz do projeto):
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only hosting
   ```
   As regras em `firestore.rules` já estão corretas (leitura pública das 5 coleções; escrita só para admins ativos). O deploy de hosting é **obrigatório** para que os novos cabeçalhos de cache e o JS corrigido entrem em vigor.
2. **Forçar atualização no navegador dos administradores** após o deploy (Ctrl+Shift+R uma única vez), para descartar o `admin.js` antigo ainda em cache. Depois disso, os cabeçalhos novos impedem a repetição do problema.
3. **Migração de dados: não é necessária.** A leitura tolera todos os formatos legados. Opcionalmente, abra cada registro antigo no painel e clique em "Salvar" — isso o regrava no formato canônico e remove os campos legados do banco.
4. Nenhuma variável de ambiente, índice ou migration adicional é necessária.

## Checklist final

| Funcionalidade | Status | Observação |
| --- | --- | --- |
| Notícias do Admin aparecem na landing | ✅ Validado no navegador | Notícia legada sem `createdAt` visível no carrossel |
| Calendário exibe data e hora cadastradas | ✅ Validado no navegador | GP Qatar: "16 de julho de 2026 · 08:00" (doc legado com `dateTime` vazio) |
| GPs em ordem cronológica | ✅ Validado | Ordenação por timestamp; sem data vai para o fim |
| Resultados calculados corretamente | ✅ Validado no navegador | Resultado legado (`driver-N`) reconstruído; Daniel 25 pts, BigBunz 18 pts |
| Ranking/classificação atualizado | ✅ Validado no navegador | Calculado dos resultados, com desempate por vitórias |
| Último Vencedor | ✅ Validado no navegador | Daniel #30, tempo real 1:24.255, gap real +2.078s |
| Hall da Fama | ✅ Validado no navegador | Dois pilotos (checkbox legado `"on"` aceito), estatísticas calculadas |
| Nenhum campo do formulário ignorado | ✅ Auditado campo a campo | Todos os campos dos 5 formulários são gravados e lidos |
| Tipografia Nosso Time / Patrocinadores | ✅ Ajustado | Escalas alinhadas aos demais cards; em produção exigia também o CSS atualizado (cache) |
| Painel administrativo (fluxo autenticado) | ⚠️ Requer teste manual | Sem sessão, o redirecionamento para login foi validado sem erros; o fluxo completo de salvar/editar exige login do administrador |
| Deploy | ⚠️ Ação necessária | Rodar os dois comandos de deploy acima para publicar correções e cabeçalhos |

---

## Ajustes pós-auditoria (16/07/2026)

### 1. Novo modelo de evento do GP (quali + corrida de 24h)
Formato oficial definido pela organização:
- **Classificação (quali):** 12:00 do dia cadastrado até 00:00.
- **Corrida (GP):** 00:00 do dia seguinte, com 24h de duração (até 00:00 do 2º dia).
- Durante todo esse período (12:00 do dia D até 00:00 do dia D+2) o GP aparece como **"Ao vivo"**, distinguindo a fase atual: "Classificação em andamento" ou "Corrida em andamento".

Consequências:
- O formulário de etapas agora pede **apenas a data** (o campo de hora foi removido) — o documento é salvo como `dateTime: "<data>T00:00:00"`, e a hora eventualmente presente em documentos antigos é ignorada.
- A contagem regressiva mira a largada da quali (12:00 do dia cadastrado).
- O card em destaque exibe o formato fixo "Quali 12:00 · Corrida 24h".
- Lógica centralizada em `firebase-data.js` (`raceStatus`, `racePhase`, `raceTimestamp`) e validada nas fronteiras: antes das 12:00 → "A seguir"; 12:00–00:00 → quali; 00:00–00:00 do dia seguinte → corrida; depois → "Finalizada".

### 2. Foto do piloto no Hall da Fama
O card do carrossel agora exibe a foto cadastrada no painel (campo "URL da Foto"), cobrindo a área do plate — com fallback automático para o monograma caso a imagem falhe. Número e sigla do país permanecem sobre a foto com sombra para legibilidade.

### 3. "Nosso Time" e "Patrocinadores e Parcerias" em slider compacto
As duas seções deixaram de ser grades extensas e viraram sliders no mesmo padrão do de notícias (setas, indicadores, autoplay e swipe), com **um card centralizado por slide** — reduzindo drasticamente a altura das seções. A navegação foi extraída para uma fábrica reutilizável (`buildSlider`), agora usada por Notícias, Nosso Time e Patrocinadores (eliminando código duplicado).

### 4. Imagem nas notícias
O formulário de notícias ganhou o campo **"URL da Imagem"** (opcional). Quando preenchido, a imagem aparece no card do carrossel da landing page (com fallback para o ícone caso falhe o carregamento).

### 5. Interação dos cards de equipe
Ao clicar em um card de equipe:
- o card recebe um **leve zoom** (scale 1.08) e sombra elevada;
- o restante da página fica sob um **fundo desfocado** (backdrop com blur);
- os pilotos aparecem no formato **"Nome #Número"** (ex.: Daniel #30), com o nome da equipe como cabeçalho;
- fecha ao clicar fora ou pressionar Esc.

Correção técnica associada: `[data-animate].in-view` passou a usar `transform: none` (em vez de `translateY(0)`) para não criar stacking context — sem isso, o fundo desfocado cobriria também o card em destaque.

### Arquivos alterados neste adendo
`firebase-data.js`, `admin.js`, `admin.html`, `script.js`, `index.html`, `style.css` (versão dos assets: `?v=20260718`).

### Validação
Landing testada no navegador contra o Firestore real: GP Qatar "Ao vivo · Classificação em andamento" às 13h10 locais; fotos dos dois pilotos no Hall; sliders de Nosso Time (7 slides) e Patrocinadores (7 slides) funcionando; card da Jaguar com zoom + blur exibindo "BigBunz #5 / Daniel #30"; formulários do painel atualizados. Console sem erros.
