# Pendências de conferência

Divergências encontradas na pesquisa e na revisão de 12/10/2026 que dependem de decisão editorial ou de uma fonte que não foi possível abrir. Nenhum valor abaixo foi alterado: o portal mostra o número antigo até alguém decidir. Ao resolver um item, corrija o indicador (roteiro em `03_coleta_e_manutencao.md`), registre no commit e apague o item daqui.

## Números com fonte divergente

| Indicador | No portal | O que a conferência achou | O que fazer |
|---|---|---|---|
| `desemprego-anual` | 2021: 14,0% | Média dos quatro trimestres (Sidra 4099): 13,2%. A retrospectiva do IBGE explica que o número anual usa a base por visita (5ª visita em 2020 a 2022), mas não traz o valor em texto. | Confirmar na planilha anual da PNAD Contínua. O `como_ler` já explica a diferença. |
| `ingressos-concurso` | FHC: 6.452 por ano | Boletim Estatístico de Pessoal: 45.657 ingressos de 1995 a 2002, média de 5.707. | Achar a origem do 6.452 ou trocar pelo Boletim. |
| `quadro-servidores` | FHC −17,3% | Sem o dado de dezembro de 1994; de dezembro de 1995 a 2002, −14,4%. | Achar a base de 1994 (Comunicado Ipea 110 não abriu). |
| `quadro-servidores` | Lula 1 e 2 +18,8% | Revista do Serviço Público cita mais de 600 mil servidores em 2010 (daria mais de +23%). | Conferir a cobertura das duas séries. |
| `quadro-servidores` | Lula 3 +0,7% | Fontes dão entre +0,3% (jun/2026 contra 2022) e +0,5% (saldo até 15/03/2026). | Atualizar com o Painel Estatístico de Pessoal. |
| `quadro-servidores` | Bolsonaro estimado a partir de dez/2023 | Existe dado de 2022 (567.296, Painel Estatístico de Pessoal). | Usar o dado de 2022 ou explicar a conta da estimativa. |
| `pec38-assinaturas` | MDB 23, PP 26, Republicanos 20 | Lista da Direção Concursos: MDB 24, PP 24, Republicanos 19 (lista com um nome repetido; total 171 confere). | Conferir na ficha oficial da PEC 38/2025 na Câmara. |
| `periodos-presidenciais` | Cestas Lula 3: 1,76 (cesta de setembro de 2026) | Os outros períodos usam o último ano completo. Com dezembro de 2025: 1,79. A cesta de setembro de 2026 (R$ 922,51) está sem fonte listada. | Escolher um critério único e citar a cesta usada. |
| `reajuste-ipca` | 22,07% em 1995 | Só confirmado em imprensa; verificar se o índice foi definido ainda no governo Itamar. | Achar o ato oficial. |
| `abertura-empresas` | 2023: 3,7 mi; 2024: 4,1 mi | Comunicados de janeiro de 2025: cerca de 3,78 mi e 4,16 mi. | Já explicado no `como_ler`; trocar se o Sebrae confirmar revisão. |

## Decisões de método

- **`partidos-servidor`:** votar contra o arcabouço fiscal de 2023 conta como posição a favor do servidor (dá ponto ao PL e tira do PT); o congelamento de 2020 entra com duas votações (peso dobrado); a PEC 32/2020 entra pela votação da comissão especial, com poucos deputados por partido. União Brasil e PRD aparecem com 11 votações, o que pressupõe herança do histórico das legendas antecessoras. O `como_ler` já declara as três primeiras escolhas. Decidir se o método fica, e listar o link de cada uma das 11 votações em `fontes`.
- **`reajuste-ipca`:** a coluna mistura revisão geral por lei (1995, 2002, 2003, 2023) e índices negociados que cobriram a maioria das categorias (Dilma, Temer, Lula 3 em 2025 e 2026). O `como_ler` declara isso. Alternativa mais rígida: mostrar só a revisão geral do art. 37, X, da Constituição.
- **`governismo-2023`:** só existe o dado de 2023. Para a mesma régua, acrescentar a série do Poder360 de 2019 a 2022 com o mesmo método. Declarar também por que o MDB (42 deputados em 2023) não aparece.
- **`senado-2027`:** projeção. Atualizar depois do 2º turno (25/10/2026) e confirmar com a Agência Senado e o TSE.
- **`camara-2027`:** 34 deputados eleitos por partidos que não atingiram a cláusula de desempenho podem trocar de partido até a posse (01/02/2027).

## Fontes a trocar por versões primárias

- `mvi-estados`, `deficit-policial`: art. 144 da Constituição citado pelo Politize!; preferir o Planalto. Identificar a "Pesquisa Perfil" que dá os 8.274 bombeiros militares de São Paulo.
- `pec38-assinaturas`: art. 102, § 4º, do Regimento Interno citado por blog; usar o RICD no site da Câmara. Fala de Esther Dweck: citar o JOTA.
- `preocupacao-eleitor`: Quaest e Datafolha citados por veículos secundários; buscar os relatórios dos institutos.
- `ingressos-concurso`, `quadro-servidores`: dados do Ministério da Gestão citados por escritório de advocacia; buscar a fonte do ministério.
- `juros-selic`: Atlas Público e tabela da UFMS no lugar dos comunicados do Copom.
- `petroleo-brent`, `dolar-fim-ano`: dado de 2008 citado pelo Olhar Direto; trocar pela EIA e pelo Banco Central.
- `reajuste-ipca`: IPCA citado por agregador; usar o Sidra (tabela 1737).
- `efetivo-x-mortes`: citar Chalfin e McCrary pela Review of Economics and Statistics (2018).
