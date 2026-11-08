# Pendências de conferência

O que ficou aberto depois da conferência de 12/10/2026. As divergências numéricas listadas na primeira revisão foram resolvidas na fonte primária e registradas nos commits daquele dia. Ao resolver um item abaixo, corrija o indicador (roteiro em `03_coleta_e_manutencao.md`), registre no commit e apague o item daqui.

## Dados que dependem de fonte ainda não aberta

| Indicador | O que falta | Efeito se mudar |
|---|---|---|
| `quadro-servidores` | Estoque de dezembro de 2010 e de dezembro de 2022 no Painel Estatístico de Pessoal (o painel é interativo e não abriu). Hoje Dilma começa em dezembro de 2011 e dez/2022 é cálculo (571.873 de dez/2023 menos 6.874). | Dilma passaria a cobrir dez/2010 a dez/2015; Bolsonaro e Lula 3 podem mudar alguns décimos. |
| `quadro-servidores` | Estoques de 2011 a 2022 vêm da Folha Dirigida, que consultou o Painel em outubro de 2022. O Painel revisa a série a cada consulta (em `ingressos-concurso`, a consulta de 28/10/2026 já substituiu a de 2022). | Variações de até 0,3 ponto. |
| `reajuste-ipca` | Publicação do IBGE com o IPC-r de julho a dezembro de 1994 (hoje lido em agregador) e confirmação oficial de que 9% (2025) e 5% (abril de 2026) valeram para as categorias sem acordo próprio. | Só fonte. |
| `desemprego-anual` | Planilha anual do IBGE para confirmar 2018 (a conta dá 12,1497, no limite entre 12,1 e 12,2). | Um décimo em 2018. |
| `partidos-servidor` | Contagem completa por partido na Previdência de 2003 e na Emenda 11 do PLP 39/2020 (a API devolve a lista truncada). PV em 2003 e 2019 e PSDB em 2003 estão fora da conta por isso. Vetos de 2015 e 2020 vêm do Congresso em Foco; buscar o painel da sessão conjunta no portal do Congresso. | Denominador de PV e PSDB. |
| `pec38-assinaturas` | Redação literal do art. 102, § 4º, do Regimento Interno no PDF atualizado da Câmara (a página corta antes do artigo). Relatório de conferência de assinaturas (codteor 3029806). | Só texto. |
| `mvi-estados` | Relatório da Pesquisa Perfil das Instituições de Segurança Pública 2024 (exige login) para conferir os 8.274 bombeiros de São Paulo. | Efetivo de SP. |
| `preocupacao-eleitor` | Relatórios originais da Quaest/Pax (exige cadastro) e do Datafolha. | Só fonte. |
| `efetivo-x-mortes` | Abrir o DOI https://doi.org/10.1162/rest_a_00694 uma vez para confirmar. | Só fonte. |
| `ocupacoes-servico-publico` | RAIS por ocupação depois de 2018 (o Atlas do Ipea só abre até 2018; PDET, FTP e dados abertos do MTE não responderam ao shell em 28/10/2026). | Ano de referência. |
| `carteira-assinada` | Série da RAIS desde 1985 (vínculos celetistas), bloqueada pelo mesmo motivo; os números de 2023 a 2025 do slide do MTE ainda precisam ser conferidos no documento. | Só complemento. |
| `servidores-federais`, `quadro-servidores` | Valores do Painel Estatístico de Pessoal lidos na tela em 28/10/2026 (filtros: Ativo, sem GDF). O painel revisa a série: reconferir em janeiro de 2027 com dezembro de 2026. | Décimos nas variações. |
| `homicidios-estados`, `violencia-regioes`, `mortes-arma-fogo-estados`, `homicidios-bebes-estados` | Refazer 2024 com o microdado final do SIM quando o OpenDataSUS substituir o arquivo de 2024 (o atual é uma extração antiga; usamos o TabNet). Em armas de fogo, a intervenção legal de 2024 (Y35.0) foi derivada do Atlas 2026 menos o TabNet. | Décimos em 2024. |
| `renda-servidor-esfera` | Mês de referência exato do INPC usado pelo Ipea; se o Ipea publicar 2022 em diante por esfera, estender. | Nível em reais de 2025, não a trajetória. |
| `armas-legais-estados` | Distrito Federal oscila na fonte (68.700 em 2022, contra 243.806 em 2021): pedir confirmação ao FBSP ou à Polícia Federal. Possível quebra de método entre 2022 e 2023. | Valor do DF e salto de 2023. |
| `efetivo-policial-serie` | Relatórios da Pesquisa Perfil de 2019 a 2022 não estão no site do MJSP; se publicados, preencher o intervalo. | Lacuna de 2019 a 2021. |
| `servidores-expulsos` | Quebra em 2019: até 2018 números oficiais da CGU; depois, contagem própria no CEAF (cadastro vivo, sem as punições anuladas). O painel Correição em Dados da CGU usa outro universo e outra regra (29,8% por corrupção desde 2019). Pedir à CGU a série oficial de 2019 em diante. | Totais de 2019 a 2025. |
| `acordos-leniencia` | A CGU diverge dela mesma (SBM Offshore: R$ 1,61 bilhão na tabela e R$ 549 milhões em outra página; soma das linhas R$ 10 acima do total). | Valor de 2018. |
| `processos-improbidade` | De 2023 em diante o CNJ só publica percentuais. Casos novos por assunto (DataJud) não coletados. Empresas punidas (CEIS e CNEP) ficaram fora: o cadastro é uma fotografia atual, sem as sanções vencidas, e não serve como série anual. | Série termina em 2022. |
| `populacao-brasil` | Nota da tabela 1286 do Sidra (atrás de desafio do Cloudflare) para explicar por que ela difere da população residente de 1960 a 2000. O gráfico usa a residente. | Nenhum, só registro. |

## Decisões de método já tomadas (12/10/2026)

- **`partidos-servidor`:** 9 votações. O arcabouço fiscal de 2023 saiu (regra fiscal sem efeito direto sobre o servidor); o congelamento de 2020 entra uma vez (veto de agosto de 2020); a PEC 32 entra pela votação da comissão especial, declarada no texto. Siglas de fusão herdam o voto da antecessora com bancada; se as antecessoras votaram em lados diferentes, a votação sai da conta da sigla. A matriz partido x votação, com fonte por votação, está em `data/aux/partidos-servidor_matriz.json`.
- **`periodos-presidenciais`:** cestas por mínimo com o mínimo vigente em dezembro do último ano completo de cada período dividido pela cesta do Dieese em São Paulo no mesmo mês.
- **`reajuste-ipca`:** coluna "Índice mais amplo", com o critério declarado. 1995 fica com 22,07% (o que foi pago em janeiro de 1995); a diferença de 3,17% reconhecida em 2001 fica fora do saldo de FHC e está dita no texto.
- **Governismo (`governismo-governos`, `governismo-camara`, `governismo-2023`):** calculado pelo próprio portal a partir dos arquivos anuais da Câmara (`scripts/governismo.py`, workflow no GitHub Actions), de 2019 a 2026, com a mesma régua para Bolsonaro e Lula 3. Conferido com o Poder360 (2023) e o Radar do Congresso (2019 a 2022). Atualizar em janeiro de 2027 com 2026 completo.

- **Educação básica por estado (`educacao-basica-por-aluno`, `educacao-basica-partido-governador`):** 2017 a 2025, porque o SIOPE em dados abertos começa em 2017. Estados pelo Siconfi (RREO Anexo 2: função Educação com a parte intraorçamentária, menos Ensino Superior, menos os inativos que o estado declara dentro da educação no SIOPE; quando declara em "Inativos" e na subfunção 272, desconta-se a maior das duas). Municípios pelo SIOPE (etapas, administração, merenda, transporte e, até 2020, as linhas por programa do FNDE; o total da educação infantil repetido no código 365 em 2024 e 2025 entra uma vez). Denominador: matrículas estaduais e municipais da Sinopse do Inep. O indicador por partido usa o partido pelo qual o governador foi eleito para o cargo, junta só trocas de nome (PMDB e MDB, PRB e Republicanos, PR e PL, PC do B e PCdoB) e lista os partidos em ordem alfabética. Ele está com `visivel: false` até decisão sobre publicar durante o 2º turno.

- **Folha e orçamento (`folha-federal`, `folha-esferas`, `orcamento-*`):** valores corrigidos pela média anual do IPCA para reais de 2025. Folha federal pelo RTN (critério de pagamento, sem intraorçamentárias); folha das esferas pela remuneração de empregados do Tesouro (metodologia do FMI, só ativos, série desde 2010, com quebras em 2019 e 2022); orçamento por função pelo SIOP, previsto = dotação atualizada e executado = liquidado, com intraorçamentárias, conferido com o RREO Anexo 02. O ano em curso fica fora dos gráficos de orçamento.
- **`quadro-servidores` (28/10/2026):** de 2003 em diante, todos os governos pelo Painel Estatístico de Pessoal; FHC continua pelo Boletim, porque o painel começa em 1999.

## Atualizações com data marcada

- **`senado-2027`:** projeção. Atualizar depois do 2º turno (25/10/2026) e confirmar com a Agência Senado e o TSE.
- **`camara-2027`:** 34 deputados eleitos por partidos que não atingiram a cláusula de desempenho podem trocar de partido até a posse (01/02/2027).
- **`orcamento-2026-execucao` e `emendas-parlamentares`:** 2026 parcial, extraído do SIOP em 29/10/2026. Atualizar mensalmente e fechar o ano em janeiro de 2027, quando 2026 também entra nas séries em reais (corrigir pelo IPCA de 2026).
- **Categoria `orcamento-federal`:** gerada a partir da consulta SPARQL do SIOP (orçamentos fiscal e da seguridade, sem estatais). Total liquidado de 2025 conferido com o RREO da União (Anexo 01, 6º bimestre): R$ 5.154,7 bi, igual.
- **`desigualdade-gini`:** a série PGINI do Ipeadata (PNAD anual, encerrada em 2016) difere em até 0,006 dos valores que o Ipea publicou nos Comunicados nº 9 (2008) e nº 30 (2009). Os metadados não explicam a revisão.
- **`pobreza-brasil` e `pobreza-estados`:** a Síntese de Indicadores Sociais de dezembro de 2026 troca as linhas de 2017 (US$ 2,15 e US$ 6,85) pelas de 2021 (US$ 3,00 e US$ 8,30). Ao atualizar, trocar a série inteira e o texto.
- **`resultado-primario-governo-central`:** a série atual do Tesouro dá R$ 77,9 bi (2,00% do PIB) para 2010; o boletim de 2011 publicou R$ 79,0 bi (2,16%). O percentual mudou com a revisão do PIB; o valor em reais, com a reorganização posterior da série. Sem documento do Tesouro que detalhe.
- **`carga-tributaria`:** o dado oficial (Receita Federal) vai até 2024; 2025 só tem a estimativa do Tesouro. Trocar quando a Receita publicar a edição de 2025.
- **`ensino-medio-completo`:** 2022 usa o valor publicado no Informativo PNAD Contínua Educação 2025 (52,9); a conta pelo Sidra dá 53,0.
- **`expectativa-de-vida`, `mortalidade-infantil` e `mortalidade-expectativa-estados`:** a Tábua completa de mortalidade de 2025 sai até 01/12/2026. Atualizar 2025 e conferir se o IBGE revisou anos anteriores.
- **`cobertura-vacinal`:** usa as estimativas OMS/UNICEF (WUENIC). A poliomielite (via Banco Mundial) vai só até 2024. O TabNet do PNI fica 1,4 a 6,2 pontos acima de 2019 a 2022 por registros tardios.
- **`mortalidade-materna`:** 2024 ainda não publicado pelo Ministério da Saúde.
- **Categoria `consumo` (criada em 30/10/2026):** dados mensais (veículos, varejo, endividamento, financiamento imobiliário, cesta básica, passageiros aéreos) vão até setembro ou agosto de 2026; atualizar o contexto de 2026 todo mês. Casamentos e divórcios de 2025 saem em dezembro de 2026.
- **`consumo-carne`:** a tabela da publicação da Conab (Perspectivas, edição 14) troca a carne bovina de 2024 (36,0) com a de 2025 (36,2); o site usa a planilha. A planilha muda de estimativa de população em 2000 e 2010 sem aviso.
- **`financiamento-imobiliario`:** unidades do FGTS (2016 a 2025) vêm dos rótulos dos gráficos da coletiva da Abecip de 27/01/2026; procurar série tabulada da Caixa ou do Ministério das Cidades. A Abecip revisou 2024 (de 568,2 para 532,1 mil unidades).
- **`casamentos-divorcios`:** a taxa de divórcio calculada para 2024 dá 2,75 por mil, e o IBGE publica 2,7; denominador do IBGE não identificado.
- **`casamentos-estados-serie`:** em 1999, a soma dos estados nas tabelas do Sidra (350) dá 788.744 casamentos e o total nacional, 787.530 (1.214 a mais nos estados). De 1984 a 1988, a soma fica até 14 abaixo. Perguntar ao IBGE.
- **`gastos-exterior`:** o Banco Central revisou a conta de viagens em 27/02/2025 (despesas desde jan/2022) e em 24/04/2026 (receitas desde out/2023). Os anos recentes não se comparam perfeitamente com os anteriores; 1995, 2000 e 2010 não têm publicação separada para conferir (saem direto do SGS).
- **`pix` e `meios-pagamento`:** o total do Pix vem da base MPV (inclui o liquidado fora do SPI); a divisão por natureza vem da base do SPI, cerca de 10% menor. Não misturar.
- **`orcamento-familiar` e `orcamento-familiar-renda`:** substituir pela POF 2024-2025 quando o IBGE divulgar (previsto para o fim de 2026). O livro da POF 2017-2018 (tabela 6) diverge do FTP em habitação e transporte nas faixas extremas; o site usa o FTP, que bate com os valores em reais.
- **Confiança do consumidor (não publicado):** a CNI encerrou o INEC em 2020, e a série do ICC da FGV não é pública (FGV Dados exige login). Retomar se a FGV liberar a série ou se surgir fonte pública equivalente.
- **`bens-domicilios`:** a passagem da PNAD anual (até 2015) para a PNAD Contínua (2016) tem salto acima da tendência em carro, moto, celular e telefone; tratar como quebra de série. A PNAD Contínua foi reponderada em 2025, e valores publicados antes (ex.: internet 2019: 82,7) diferem do Sidra atual (83,9).
- **`cirurgias-bariatricas`:** sem notícia do Ministério da Saúde com o total nacional de um ano; conferências feitas com a BVS (2001 e 2008), a Secretaria da Saúde do Paraná (2022 a 2026) e a revista Epidemiologia e Serviços de Saúde (2010 a 2016). ANS sem 2019 e sem anos anteriores a 2014. Picos a investigar por UF: gastroplastia vertical com banda em 2024 (255) e gastrectomia com desvio duodenal em jan-ago/2026 (314).
- **`bolsa-familia-familias`:** dezembro de 2008 diverge (Ipeadata 10,56 milhões; relatório de gestão do MDS 11,35 milhões). De 2023 em diante, a contagem nos arquivos do Portal da Transparência fica 0,8% a 3,5% abaixo do número do MDS; no Auxílio Brasil (dez/2021 a fev/2023), o Portal só publicou saques. Retomar a série mensal oficial quando o VIS DATA do MDS voltar ao ar (fora desde 21/10/2026).
- **`bolsa-familia-gasto`:** 2023 soma as ações 8442 e 21DP; 2026 não entra até o fechamento do ano (o SIOP não informa a data de corte da consulta).
- **`populacao-indigena`:** série não homogênea (1991 e 2000 só pela cor ou raça, na amostra; 2010 e 2022 somam a pergunta "você se considera indígena?", aplicada em áreas diferentes). 1991 e 2000 no Sidra diferem em 16 e 1 pessoa dos livros do IBGE. Livro de indígenas (alfabetização e domicílios) repete no trecho de esgoto os números do livro de quilombolas; o site usa as tabelas.
- **`saude-yanomami`:** números de mortes revistos a cada publicação (2023: 308, 363, 428, 435; desnutrição 2023: 29 e 47); 2022 vem de notícia do Ministério (343) e os microdados do Siasi dão 353. Atualizar a cada informe do COE Yanomami.
- **`mortalidade-infantil-indigena`:** taxa direta SIM/Sinasc, sem correção; cor do óbito é heteroatribuída e a do nascimento é a da mãe. Saúde quilombola: não há série oficial (SIM e Sinasc não têm campo quilombola).

## Meio ambiente (coleta de 31/10/2026)

- **Prodes Amazônia 2022** (11.594 km²): confere com o painel, mas a nota técnica oficial em gov.br/inpe está com acesso restrito. Conferir quando abrir.
- **Prodes Amazônia 1993 e 1994**: o painel e a resposta do Inpe ao TCU trazem o mesmo valor (14.896 km²) nos dois anos. A razão (provável média de período sem imagem) não foi confirmada em fonte.
- **Prodes Cerrado 2000 a 2008**: a Tabela 3 da nota "NT_PRODESCerrado_2026_revisado" diverge do painel (linha 2008: 32.269 na nota contra 26.623,12 no painel). O site usa o painel. De 2010 em diante a diferença é de até 3,3 km².
- **Prodes Pampa 2024 e 2025 e Mata Atlântica 2022 e 2025**: o painel difere das notas (Pampa 2024: 524,19 contra 523,14). O site usa o valor da nota.
- **Acumulados do Pantanal e da Caatinga**: a soma do painel fica 376,12 km² e 666 km² acima das notas. O site não publica acumulados desses biomas.
- **Período da Caatinga, Mata Atlântica e Pampa**: o painel diz agosto a julho; as notas de 2023 da Caatinga e da Mata Atlântica dizem janeiro a dezembro. O indicador não afirma o período desses biomas.
- **Deter**: a soma das classes é cálculo do site sobre o WFS; confere a menos de 2 km² com números do Inpe citados na imprensa (O Hoje, 07/08/2025; Portal Tela, 08/08/2026). Buscar publicação do próprio Inpe.
- **Energia renovável**: a matriz elétrica de 2024 é 88,2% na tabela do BEN 2026 e 88,0% no gráfico da p. 39 do Relatório Síntese. O site usa 88,2%.
- **Saneamento**: quebra de série entre SNIS (até 2022) e Sinisa (2023 em diante). Por estado, a mudança chega a 35 pontos (Piauí, esgoto coletado: 19,4% em 2022 no SNIS e 54,2% em 2024 no Sinisa). Não publicar série por estado atravessando a quebra.
- **Emissões**: o MCTI (NIR 2024) vai até 2022 e o SEEG 14 até 2025; os valores dos dois não se comparam diretamente.

## Saúde e segurança no trabalho (coleta de 01/11/2026)

- **Previdência, anos preliminares**: o último ano de cada anuário sobe na edição seguinte (2023: de 2.783 para 3.286 mortes; incapacidade permanente de 6.382 para 16.194). A incapacidade permanente de 2025 (10.787, queda de 39%) é primeira divulgação. Revisar quando sair o AEPS 2026.
- **Previdência, 2014**: o Suplemento Histórico mantém 704.136 acidentes; AEAT e AEPS de 2015 e 2016 trazem 712.302. O site usa 712.302.
- **Previdência, 1994**: a incapacidade permanente cobre só janeiro a junho e ficou de fora.
- **INSS, afastamentos por CID**: em 2020, 65% dos auxílios-doença comuns saíram com CID ignorado; o ano ficou de fora. Em 2016 e 2019 a soma por CID fica até 7% abaixo da tabela por espécie. O salto dos transtornos mentais de 2022 a 2025 não tem explicação oficial nos arquivos coletados.
- **Previdência, UF ignorada**: 5.284 acidentes em 2021 e 26.490 em 2022.
- **SmartLab (MPT/OIT)**: não foi possível conferir; o datahub devolveu 401.
- **Sinan**: sem conferência externa (nenhum boletim nacional achado). Espírito Santo com notas contraditórias no TabNet sobre a cobertura desde 2020; por isso o site não publica Sinan por estado. O agravo "acidente de trabalho" mudou de definição pela Portaria GM/MS 217/2023 e não foi publicado como série.
- **SIM 2024**: o microdado aberto (21/10/2025) dá 4.473 mortes com acidente de trabalho "sim"; o TabNet (extração final de 02/12/2025) dá 4.551. O site usa o TabNet.
- **MTE, trabalho escravo e inspeção**: Radar SIT e dados abertos do MTE não responderam (nem pelo navegador). Só há 2025 lido na Agência Gov (2.772 resgatados), não publicado. Coletar a série desde 1995 quando o Radar voltar.

## Patrimônio de deputados e senadores (coleta de 01/11/2026)

- **Senado 2018**: o TSE dá 53 eleitos; a candidata eleita em MT aparece hoje como "não eleito/inapto" e o senador da eleição suplementar de 2020 (Carlos Fávaro) não entra no agregado de 2018. Ele está na tabela nominal.
- **Bens de 2002 e 2004**: os arquivos do TSE dão 404; a série começa em 2006.
- **Divergências com a imprensa**: 2006, 165 deputados acima de R$ 1 milhão segundo o Congresso em Foco contra 161 calculados; 2018, R$ 1,09 bi contra R$ 1,083 bi calculado. O DivulgaCandContas (API) devolveu 403 e não foi conferido.
- **Revisão manual**: João Daniel declarou R$ 1,00 em 2010 e R$ 48.237,14 em 2018; João Lyra declara o mesmo bem de R$ 196 milhões em 2006, 2010 e 2014. Nada foi corrigido.
- **Sem bens**: 233 candidaturas sem bens registrados entram como zero; em 2008, 2010, 2012 e 2016 o TSE separa quem declarou não ter bens.
- **Ligação entre eleições**: CPF ou título (2024 tem CPF mascarado). 18 linhas sem CPF nem título têm nome igual ao de alguém da tabela e não foram ligadas.

## Escolaridade (coleta de 01/11/2026)

- **PNAD anual e PNAD Contínua não se emendam**: 2015 dá 7,9 anos na PNAD e 9,03 no cálculo do Atlas com a PNAD Contínua. Nenhuma nota do IBGE explica a diferença; o site mostra as duas como séries separadas.
- **PNAD anual de 1992 a 2000**: não achada em fonte oficial acessível (a série antiga do Ipea não aparece mais no Ipeadata; seriesestatisticas.ibge.gov.br dá 403).
- **Ensino médio incompleto 2025**: Sidra e gráfico do informativo dão 4,8%; o texto do informativo diz 4,9%. O site usa 4,8%.
- **Censo 2022 por nível**: as contagens do Sidra dão 32,34% em médio completo e superior incompleto; o release publica 32,2% (os quatro valores do release somam 99,8%). O Censo 2010 por nível não foi conferido em texto.
- **PNUD**: repete 8,43 para o Brasil em 2021, 2022 e 2023 e interpola os anos 1990 e 2000.

## Supabase

- **Seed acima de 1 MB**: o SQL Editor recusa ("Query is too large"). Desde 01/11/2026 a carga é rodada em partes de até 700 mil caracteres (três desde 01/11/2026), cada uma com begin/commit, com a linha de 'versao' na última parte.

- **Eleição de 2026 (acrescentada em 01/11/2026)**: eleitos pelo resultado do TSE até 01/11/2026 (arquivo atualizado no mesmo dia); a diplomação ainda pode mudar nomes. 513 deputados e 54 senadores. Sem conferência externa dos valores de 2026. Correção pelo IPCA passou a usar como base a média de janeiro a setembro de 2026. Revisar: Misael Varella declarou R$ 315 milhões em 2026 (1º suplente de senador), contra R$ 43 milhões em 2022; Pastor Henrique Vieira, R$ 1,00 em 2016 e R$ 25.900 em 2026. O indicador "patrimonio-maiores-2022" virou "patrimonio-maiores-eleitos" (2026); a linha antiga foi apagada do Supabase.

## Efetivo da PF, da PRF e da Receita (coleta de 01/11/2026)

- **Troca de fonte em 2016**: Boletim Estatístico de Pessoal até 2015, cargos ocupados do MGI depois. Na PF o MGI dá de 3,5% a 6% menos que o Boletim em dez/2016 (Delegado: 1.718 contra 1.614); PRF e Receita praticamente iguais.
- **2013**: posição de novembro (a edição de jan/2014 do Boletim pede login).
- **Ingressos de 2019 a 2026**: estimativa (pessoa no cargo que não estava no arquivo anterior). 2017 e 2018 sem valor (arquivos quase idênticos). Analista-tributário com 156 entradas em 2022 e 466 em 2025, acima do que os documentos explicam.
- **Total de efetivos da Receita**: estimativa pelas unidades de lotação no Portal da Transparência; a queda dos administrativos (6.351 em 2016 para 2.400 em 2026) pode misturar saídas e mudança de lotação. Sem número oficial para conferir.
- **Aposentados e pensões**: não publicados como série (Boletim e MGI não se emendam; aposentadorias por ano contadas no estoque atual subestimam os anos antigos).

## Covid-19 (coleta de 02/11/2026)

- **Ministério da Saúde, série mensal**: o arquivo HIST_PAINEL não foi obtido (API da AWS com chave embutida no painel). A série mensal vem do relato do Brasil à OMS e, de maio de 2023 a abril de 2024, dos boletins mensais. Maio a novembro de 2024 sem dado mensal oficial. Completar pelo painel infoms.saude.gov.br no navegador.
- **SIM 2025**: o arquivo do OpenDataSUS só cobre janeiro a agosto de 2025; o TabNet tem o ano completo só para a categoria B34 (2.766). Atualizar quando sair o arquivo completo.
- **Acumulado do Brasil**: OMS 704.107 (lacuna de relato de 15/05/2023 a 30/12/2024); boletim 162 do MS, 712.038 até 04/05/2024. Imprensa citou 715 mil em março de 2025 (não conferido).
- **Mundo**: comparável de 2020 a 2022; a partir de 2023 é piso (países deixaram de relatar).

## Aprovação presidencial (coleta de 02/11/2026)

- **Datafolha de 1990 a 2002**: 61 rodadas lidas de gráficos escaneados (transcrição manual), a maioria confirmada nas tabelas comparativas; os gráficos antigos podem não trazer todas as rodadas (FHC 2 em 2002 tinha 4 a mais nas tabelas).
- **Excluída**: Itamar, segunda rodada de mar/1993 (21/54/21/7, soma 103; rótulos sobrepostos no gráfico).
- **Datas inferidas**: Collor jun e set/1990 (rótulos "3 meses" e "seis meses de governo").
- **Bolsonaro dez/2022**: do gráfico da Folha com dados do Datafolha; PDF da rodada não achado.
- **Lula 2, 11 a 13/08/2009**: tabela de 2025/08 repete os números de maio de 2009; o site usa 67/25/8/1, das outras fontes.
- **Sarney**: seis rodadas em dez capitais, fora da série nacional.
- **Segunda fonte**: CNI-Ibope até dez/2020 (correlação 0,986 com o Datafolha); Quaest não coletada.

## Carne por faixa de renda (coleta de 08/11/2026)

- **POF 2017-2018 por classe**: o PDF (liv101704) só imprime o total; as classes vêm da planilha do FTP, conferidas pela coluna Total e pela tabela por região. Sem tabela no Sidra para 2017-2018.
- **POF 1995-1996**: 11 áreas urbanas; PDF digitalizado, valores transcritos da imagem (4 divergências do OCR resolvidas a 300 dpi). A faixa "mais de 15 SM" é cálculo próprio (três faixas ponderadas pela população).
- **ENDEF 1974-1975 e POF 1987-1988**: sem recorte de renda nos volumes consultados.
- **Quintis**: o IBGE não publica aquisição de alimentos por quintil; exigiria microdados.
