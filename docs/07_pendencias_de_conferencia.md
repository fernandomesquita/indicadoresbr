# Pendências de conferência

O que ficou aberto depois da conferência de 12/10/2026. As divergências numéricas listadas na primeira revisão foram resolvidas na fonte primária e registradas nos commits daquele dia. Ao resolver um item abaixo, corrija o indicador (roteiro em `03_coleta_e_manutencao.md`), registre no commit e apague o item daqui.

## Dados que dependem de fonte ainda não aberta

| Indicador | O que falta | Efeito se mudar |
|---|---|---|
| `quadro-servidores` | Estoque de dezembro de 2010 e de dezembro de 2022 no Painel Estatístico de Pessoal (o painel é interativo e não abriu). Hoje Dilma começa em dezembro de 2011 e dez/2022 é cálculo (571.873 de dez/2023 menos 6.874). | Dilma passaria a cobrir dez/2010 a dez/2015; Bolsonaro e Lula 3 podem mudar alguns décimos. |
| `quadro-servidores`, `ingressos-concurso` | Estoques e ingressos de 2011 a 2022 vêm da Folha Dirigida, que consultou o Painel em outubro de 2022. O Painel revisa a série a cada consulta. | Variações de até 0,3 ponto. |
| `ingressos-concurso` | Ano de 2022 fechado (hoje vai até setembro). | Média de Bolsonaro. |
| `reajuste-ipca` | Publicação do IBGE com o IPC-r de julho a dezembro de 1994 (hoje lido em agregador) e confirmação oficial de que 9% (2025) e 5% (abril de 2026) valeram para as categorias sem acordo próprio. | Só fonte. |
| `desemprego-anual` | Planilha anual do IBGE para confirmar 2018 (a conta dá 12,1497, no limite entre 12,1 e 12,2). | Um décimo em 2018. |
| `partidos-servidor` | Contagem completa por partido na Previdência de 2003 e na Emenda 11 do PLP 39/2020 (a API devolve a lista truncada). PV em 2003 e 2019 e PSDB em 2003 estão fora da conta por isso. Vetos de 2015 e 2020 vêm do Congresso em Foco; buscar o painel da sessão conjunta no portal do Congresso. | Denominador de PV e PSDB. |
| `pec38-assinaturas` | Redação literal do art. 102, § 4º, do Regimento Interno no PDF atualizado da Câmara (a página corta antes do artigo). Relatório de conferência de assinaturas (codteor 3029806). | Só texto. |
| `mvi-estados` | Relatório da Pesquisa Perfil das Instituições de Segurança Pública 2024 (exige login) para conferir os 8.274 bombeiros de São Paulo. | Efetivo de SP. |
| `preocupacao-eleitor` | Relatórios originais da Quaest/Pax (exige cadastro) e do Datafolha. | Só fonte. |
| `efetivo-x-mortes` | Abrir o DOI https://doi.org/10.1162/rest_a_00694 uma vez para confirmar. | Só fonte. |

## Decisões de método já tomadas (12/10/2026)

- **`partidos-servidor`:** 9 votações. O arcabouço fiscal de 2023 saiu (regra fiscal sem efeito direto sobre o servidor); o congelamento de 2020 entra uma vez (veto de agosto de 2020); a PEC 32 entra pela votação da comissão especial, declarada no texto. Siglas de fusão herdam o voto da antecessora com bancada; se as antecessoras votaram em lados diferentes, a votação sai da conta da sigla. A matriz partido x votação, com fonte por votação, está em `data/aux/partidos-servidor_matriz.json`.
- **`periodos-presidenciais`:** cestas por mínimo com o mínimo vigente em dezembro do último ano completo de cada período dividido pela cesta do Dieese em São Paulo no mesmo mês.
- **`reajuste-ipca`:** coluna "Índice mais amplo", com o critério declarado. 1995 fica com 22,07% (o que foi pago em janeiro de 1995); a diferença de 3,17% reconhecida em 2001 fica fora do saldo de FHC e está dita no texto.
- **Governismo (`governismo-governos`, `governismo-camara`, `governismo-2023`):** calculado pelo próprio portal a partir dos arquivos anuais da Câmara (`scripts/governismo.py`, workflow no GitHub Actions), de 2019 a 2026, com a mesma régua para Bolsonaro e Lula 3. Conferido com o Poder360 (2023) e o Radar do Congresso (2019 a 2022). Atualizar em janeiro de 2027 com 2026 completo.

- **Educação básica por estado (`educacao-basica-por-aluno`, `educacao-basica-partido-governador`):** 2017 a 2025, porque o SIOPE em dados abertos começa em 2017. Estados pelo Siconfi (RREO Anexo 2: função Educação com a parte intraorçamentária, menos Ensino Superior, menos os inativos que o estado declara dentro da educação no SIOPE; quando declara em "Inativos" e na subfunção 272, desconta-se a maior das duas). Municípios pelo SIOPE (etapas, administração, merenda, transporte e, até 2020, as linhas por programa do FNDE; o total da educação infantil repetido no código 365 em 2024 e 2025 entra uma vez). Denominador: matrículas estaduais e municipais da Sinopse do Inep. O indicador por partido usa o partido pelo qual o governador foi eleito para o cargo, junta só trocas de nome (PMDB e MDB, PRB e Republicanos, PR e PL, PC do B e PCdoB) e lista os partidos em ordem alfabética. Ele está com `visivel: false` até decisão sobre publicar durante o 2º turno.

## Atualizações com data marcada

- **`senado-2027`:** projeção. Atualizar depois do 2º turno (25/10/2026) e confirmar com a Agência Senado e o TSE.
- **`camara-2027`:** 34 deputados eleitos por partidos que não atingiram a cláusula de desempenho podem trocar de partido até a posse (01/02/2027).
