# Modelo de dados

## `data/site.json`

```json
{
  "site": {
    "nome": "Indicadores BR",
    "atualizado": "2026-10-12",
    "destaques": ["ipca-anual", "camara-2027", "mvi-anual"],
    "governos": [{ "de": 1995, "ate": 2002, "rotulo": "FHC" }, "..."]
  },
  "categorias": [{ "id": "economia", "nome": "Economia", "descricao": "...", "ordem": 1 }]
}
```

- `destaques`: indicadores da seção "Para começar" da página inicial.
- `governos`: faixas desenhadas atrás das séries anuais quando o indicador tem `faixasGoverno: true`. Quando um governo termina no ano em que outro começa (2016), a divisa fica no meio daquele ano.
- O `id` de uma categoria vira endereço (`/categoria/economia`). Não mude depois de publicado.

## `data/indicadores/<id>.json`

Um arquivo por indicador. O nome do arquivo é o `id`.

| Campo | Tipo | Obrigatório | Para que serve |
|---|---|---|---|
| `id` | texto | sim | Endereço `/indicador/<id>`. Minúsculas, números e hífen. Não muda depois de publicado. |
| `categoria` | texto | sim | `id` de uma categoria de `site.json`. |
| `ordem` | número | não | Posição dentro da categoria. |
| `visivel` | sim/não | não | `false` esconde do site público (rascunho). |
| `titulo` | texto | sim | Frase curta que diga o que o gráfico mostra ("Mortes violentas no Brasil"). |
| `subtitulo` | texto | sim | Medida, unidade e período ("Mortes violentas intencionais por 100 mil habitantes, de 2012 a 2025"). |
| `tipo` | texto | sim | `colunas`, `barras` (horizontais), `linha`, `dispersao`, `tabela` ou `mapa`. O `mapa` pinta as cinco grandes regiões do Brasil pela primeira série: a coluna `x` traz o nome da região exatamente como em `assets/mapa-br.js` (Norte, Nordeste, Sudeste, Sul, Centro-Oeste). |
| `colunas` | lista | sim | Nomes das colunas dos dados. |
| `linhas` | lista de listas | sim | Uma lista por linha, na ordem das colunas. Números como número (`10.67`), sem aspas; vazio como `null`. |
| `x` | texto | sim (exceto tabela) | Coluna do eixo ou dos rótulos. Na dispersão, o eixo horizontal. |
| `series` | lista | sim (exceto tabela) | Colunas de valores. Linha aceita várias; os outros tipos usam a primeira. |
| `rotulo` | texto | dispersão | Coluna com o nome de cada ponto. |
| `tendencia` | sim/não | dispersão | Desenha a linha de tendência (mínimos quadrados). |
| `barra` | texto | tabela | Coluna que ganha barra animada. |
| `destaque` | lista | não | Rótulos pintados com a cor de destaque (colunas, barras, dispersão). |
| `faixasGoverno` | sim/não | não | Faixas de governo atrás de séries anuais (linha e colunas). |
| `prefixo`, `sufixo` | texto | não | Unidade nos valores (`"R$ "`, `"%"`, `" mi"`). |
| `casas` | número | não | Casas decimais nos rótulos do gráfico. |
| `sobrepor` | sim/não | não | Só em `colunas` com duas séries: a primeira (ex.: orçamento previsto) vira barra clara ao fundo e a segunda (ex.: executado) fica na frente, com legenda e o percentual executado no detalhe. |
| `ultimo` | texto | não | Rótulo do dado mais recente no carrossel "Últimos dados" da página inicial, quando o último ponto é parcial ou o eixo não é de anos (ex.: "agosto de 2026", "12 meses até agosto de 2026", "Lula 3, até setembro de 2026"). Séries anuais completas entram no carrossel sem ele; tabelas e gráficos cujo eixo não é de anos só entram com ele. |
| `ymin`, `ymax` | número | não | Limites mínimos do eixo vertical no gráfico de linha (por exemplo 0 e 100 para porcentagens), para o eixo não exagerar variações pequenas. |
| `fonte` | `{nome, url}` | sim | Fonte principal. Vai no rodapé da ficha e na imagem PNG. |
| `fontes` | lista de `{nome, url, o_que_sustenta}` | sim (mínimo 3) | Todas as fontes usadas no texto, cada uma dizendo o que sustenta. |
| `como_ler` | texto | sim | Um parágrafo autocontido: o que cada barra ou linha representa, unidade, período e cuidados. |
| `contexto` | lista de parágrafos | sim | Dois ou três parágrafos: o que mede, o que explica os movimentos, por que importa. |
| `glossario` | lista de `{termo, definicao}` | não | Termos técnicos usados na página. |
| `atualizacao` | objeto | sim | `periodicidade`, `onde_buscar` (link ou API exatos), `proxima`, `ultima_conferencia` (AAAA-MM-DD). |
| `checagem` | lista | não | Registro da última conferência: `{valor_no_portal, valor_na_fonte, fonte, ok}`. Não aparece no site. |

### Exemplo mínimo

```json
{
  "id": "exemplo",
  "categoria": "economia",
  "ordem": 20,
  "visivel": false,
  "titulo": "Título do gráfico",
  "subtitulo": "O que é medido, em que unidade, de quando a quando",
  "tipo": "linha",
  "x": "Ano",
  "series": ["Valor"],
  "faixasGoverno": true,
  "prefixo": "", "sufixo": "%", "casas": 1,
  "fonte": { "nome": "IBGE, nome da pesquisa", "url": "https://..." },
  "fontes": [{ "nome": "...", "url": "https://...", "o_que_sustenta": "..." }],
  "como_ler": "...",
  "contexto": ["...", "..."],
  "glossario": [{ "termo": "...", "definicao": "..." }],
  "atualizacao": { "periodicidade": "...", "onde_buscar": "https://...", "proxima": "...", "ultima_conferencia": "2026-10-12" },
  "colunas": ["Ano", "Valor"],
  "linhas": [
    [2024, 4.83],
    [2025, 4.26]
  ]
}
```

## Tabelas de envio do público

| Tabela | Campos preenchidos pelo leitor | Campos da equipe |
|---|---|---|
| `reports` | `indicador_id`, `ponto` (a linha da tabela, quando o report é de um valor), `motivo` (5+ palavras), `email` (opcional), `pagina` | `status`, `nota_interna` |
| `sugestoes` | `texto` (3+ palavras), `categoria`, `onde`, `email` | `status`, `nota_interna` |
| `contatos` | `nome`, `email`, `assunto`, `mensagem` | `status`, `nota_interna` |

`status`: `novo`, `em_analise`, `resolvido` ou `descartado`.
