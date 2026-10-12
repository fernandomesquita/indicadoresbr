# Coleta e manutenção dos dados

Este é o roteiro de trabalho. Serve para pessoas e para qualquer agente de IA.
O catálogo com a fonte, a periodicidade e o endereço de atualização de cada indicador está em `docs/catalogo_de_fontes.md` (gerado pelo build).

## Princípios

1. **Fonte primária primeiro.** O dado vem do órgão que o produz (IBGE/SIDRA, Banco Central/SGS, Câmara/dados abertos, TSE, FBSP, Ipea, Tesouro, Sebrae, Serasa). Imprensa só para contexto ou para fato sem registro oficial, e citada como imprensa.
2. **Confira antes de publicar.** Todo valor novo é comparado com a publicação original. Registre a conferência em `checagem` e a data em `atualizacao.ultima_conferencia`.
3. **Mudou um número publicado? Diga.** No commit: valor antigo, valor novo, origem de cada um e o motivo (revisão da fonte, erro nosso, série nova).
4. **Cálculo próprio é explicado.** Médias por governo, taxas por habitante e variações dizem a conta no `como_ler`.
5. **Mesma régua para todos.** Ver `docs/06_estilo_editorial.md`.

## Rotina 1: atualizar a série de um indicador

1. Abra `docs/catalogo_de_fontes.md` e veja o `onde_buscar` do indicador.
2. Baixe o dado novo direto da fonte. Exemplos de acesso:
   - **Banco Central (SGS):** `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json&dataInicial=01/01/2025&dataFinal=31/12/2026`. Peça intervalos curtos; resumidores automáticos erram em séries longas.
   - **IBGE (SIDRA):** `https://apisidra.ibge.gov.br/values/t/{tabela}/n1/all/v/{variavel}/p/all`. Quando a API vier vazia, use o comunicado oficial da Agência de Notícias do IBGE.
   - **Câmara dos Deputados:** `https://dadosabertos.camara.leg.br/api/v2/...` (votações, orientações, proposições) e os arquivos anuais em `https://dadosabertos.camara.leg.br/arquivos/`. Quando o ambiente não alcança o site da Câmara, rode o workflow do GitHub Actions (aba Actions do repositório): ele baixa os arquivos, calcula e grava o resultado na branch `dados-governismo`.
   - **Relatórios anuais em documento (Anuário do FBSP, Raio-X, notas técnicas):** transcreva a tabela inteira, com página e número da tabela.
3. Se a série for estável (só um ponto novo): antes de editar, rode `python3 scripts/sync.py baixar` para trazer qualquer ajuste feito no admin. Edite `linhas` em `data/indicadores/<id>.json`.
4. Atualize os textos que citam o último valor (`subtitulo`, `como_ler`, `contexto`) e o período no subtítulo.
5. Preencha `checagem` (pelo menos 3 valores, incluindo o novo) e `atualizacao.ultima_conferencia`.
6. `python3 scripts/build.py` (precisa terminar sem ERRO).
7. Publicar no banco: o push na `main` dispara o workflow **Sincronizar banco**, que envia os indicadores alterados (precisa dos segredos descritos em `04_publicacao.md`). Com a chave secreta no ambiente local, também dá para rodar `python3 scripts/sync.py enviar <id>`.
8. Opcional: `python3 scripts/gerar_og.py <id>` para atualizar a prévia de link.
9. Commit com a mensagem `dados(<id>): <o que mudou>` e a origem de cada valor alterado.

**Sem a chave secreta?** Rode o build e cole `supabase/seed.sql` no SQL Editor do Supabase. O seed atualiza todos os indicadores, sem apagar reports, sugestões e contatos.

## Rotina 2: criar um indicador

1. Confirme que o dado existe em fonte primária e que dá para manter atualizado (periodicidade conhecida).
2. Copie o exemplo de `docs/02_modelo_de_dados.md` para `data/indicadores/<id>.json`, com `visivel: false`.
3. Preencha os dados e todos os textos. Contexto em dois ou três parágrafos: o que mede e como é calculado; o que explica os movimentos, com datas e eventos; por que importa no dia a dia.
4. Liste no mínimo 3 fontes em `fontes`, cada uma com `o_que_sustenta`.
5. `python3 scripts/build.py`, revise localmente (`python3 -m http.server 8000`) e só então mude para `visivel: true`.
6. `python3 scripts/sync.py enviar <id>`, `python3 scripts/gerar_og.py <id>`, `python3 scripts/build.py`, commit.

## Rotina 3: tratar reports de erro

1. Em `/admin`, aba **Reports de erro**, filtro **Novos**.
2. Para cada report: abra o indicador, compare o valor apontado (`ponto`) com a fonte primária.
3. Mude a situação para **Em análise** enquanto confere.
4. Erro confirmado: corrija (no admin ou pela Rotina 1), registre na `nota_interna` o valor antigo, o novo e a fonte, marque **Resolvido**. Se o leitor deixou e-mail, responda.
5. Erro não confirmado: explique na `nota_interna` por que o valor está certo e marque **Descartado**. Se o report revelar que o texto confundiu o leitor, melhore o `como_ler`.
6. Se a correção foi feita no admin, rode `python3 scripts/sync.py baixar` e faça o commit, para o repositório guardar a versão.

## Rotina 4: sugestões e contatos

- **Sugestões:** avalie se há fonte primária e periodicidade. Viável: crie o indicador (Rotina 2) e marque **Resolvido**; se o leitor deixou e-mail, avise. Inviável: anote o motivo e marque **Descartado**.
- **Contatos:** responda pelo e-mail informado e marque **Resolvido**.

## Rotina 5: revisão periódica

- **Mensal:** abra `docs/catalogo_de_fontes.md`, veja quais indicadores tiveram divulgação no mês e atualize (Rotina 1).
- **Antes de eleições e grandes datas:** releia os textos que citam governos, partidos ou candidatos com a régua de `docs/06_estilo_editorial.md`.
- **Depois de mudanças de bancada** (posse em 1º de fevereiro, janelas partidárias): atualize Câmara e Senado.

## Instrução pronta para pedir a um agente

> Leia AGENTS.md e docs/03_coleta_e_manutencao.md. Atualize o indicador `<id>` com o dado mais recente da fonte indicada em docs/catalogo_de_fontes.md. Confira ao menos 3 valores contra a fonte primária, registre em `checagem`, atualize os textos que citam o último valor, rode o build e o sync, e me diga quais números mudaram, com a origem de cada um.
