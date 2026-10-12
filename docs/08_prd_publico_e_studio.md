# IndicadoresBR público e Studio

> Documento de planejamento. Requisitos, preços e metas descrevem a evolução proposta e hipóteses de validação; não representam funcionalidades já entregues. A implementação deve partir da arquitetura atual descrita em [01_arquitetura.md](01_arquitetura.md), do [modelo de dados](02_modelo_de_dados.md) e do [roteiro de manutenção](03_coleta_e_manutencao.md). A arquitetura da seção 8 é referência para evolução, sujeita ao diagnóstico; este PRD não determina reescrever o portal nem substituir o Supabase. As [regras editoriais](06_estilo_editorial.md) e as [pendências de conferência](07_pendencias_de_conferencia.md) continuam aplicáveis.


Documento de requisitos do produto e modelo de negócios

Versão 1.0 • 12 de outubro de 2026 • Responsável proposto pelo produto Fernando Mesquita • Status proposta para implementação

### Decisão de produto

Construir uma plataforma com uma base de dados verificável e duas experiências. O IndicadoresBR público oferece acesso gratuito a indicadores brasileiros e comparações explicadas. O Studio transforma esses mesmos dados em gráficos e materiais profissionais, com personalização, projetos salvos e exportação paga.

O valor comercial está no tempo economizado para pesquisar, conferir e publicar informações. O acesso à fonte, à metodologia e às correções permanece gratuito. Publicidade é receita complementar; assinaturas são a hipótese principal de receita recorrente.

### Como usar este PRD

Este documento define prioridades, requisitos, regras metodológicas, arquitetura de referência, critérios de aceite e validação comercial. Não pressupõe acesso ao código atual do site. Antes da implementação, a equipe deve mapear o que já existe e reutilizar componentes compatíveis. A stack descrita é uma opção de desenho, sujeita ao diagnóstico técnico.

### Premissas e limites

Preços, custos, conversões e cronograma são hipóteses de planejamento, não estimativas comprovadas de mercado. As fontes oficiais consultadas confirmam a existência de canais de dados; séries, códigos, cobertura, condições de reutilização e limites devem ser homologados por conector. O lançamento não exige desenvolver todas as fases descritas.

| Produto | Resultado esperado | Receita proposta |
| --- | --- | --- |
| Público | Encontrar e compreender dados verificáveis | Patrocínio e publicidade após tração |
| Studio | Criar e reutilizar gráficos prontos para publicação | Assinaturas individuais e de equipes |

### Ordem recomendada

Homologar dados → lançar portal restrito em escopo → testar Studio com usuários reais → cobrar por exportação e projetos → ampliar catálogo e equipes conforme retenção.

## 1 Objetivos e usuários

### Problema a resolver

As fontes oficiais estão distribuídas em serviços diferentes, com frequências, conceitos e formatos distintos. O usuário precisa identificar a série correta, verificar unidades, escolher recortes e produzir um gráfico legível. Uma apresentação visual atraente não elimina o risco de comparar conceitos incompatíveis.

| Usuário | Tarefa principal | Produto |
| --- | --- | --- |
| Cidadão e estudante | Entender um indicador e conferir uma afirmação | Público |
| Criador de conteúdo e jornalista | Publicar gráfico correto sem montar a coleta | Studio individual |
| Professor e produtor de cursos | Reutilizar gráficos em aulas e materiais | Studio individual |
| Agência e assessoria | Produzir materiais recorrentes com identidade própria | Studio equipes posterior |

Consultorias econômicas não são o público prioritário. Só devem entrar no foco quando houver evidência de demanda por automação, integração ou formatos específicos.

### Objetivos da primeira versão

Oferecer até 12 indicadores nacionais homologados, páginas indexáveis, compartilhamento com recorte preservado e um editor que produza gráficos confiáveis em poucos minutos. Validar pagamento real antes de investir em relatórios automáticos, API comercial e amplo catálogo municipal.

### Fora do escopo inicial

Previsões econômicas, recomendações de investimento, ranking de “melhor governo”, causalidade automática, cobertura de todos os municípios, notícias em tempo real, importação livre de planilhas, chatbot aberto sobre política e editor de apresentações completo. A classificação ideológica de partidos não será tratada como dado oficial.

### Jornadas essenciais

Público: pesquisar IPCA → abrir página → identificar unidade e período → alterar intervalo → ler metodologia → compartilhar o recorte. Tudo sem cadastro.

Studio: partir de um indicador público → abrir editor → escolher formato → ajustar título e identidade → revisar fonte e ressalvas → exportar → salvar projeto para atualizar depois.

Administração: coletar lote → executar validações → revisar exceções → publicar versão → monitorar atualização. Um lote reprovado nunca substitui o último conjunto válido.

### Critério de valor

O usuário deve conseguir reproduzir o gráfico a partir do identificador da série, da versão dos dados e dos parâmetros de transformação. A rapidez só conta como benefício quando a precisão é preservada.

## 2 Modelo de negócios e preços

### Proposta de planos para teste

| Plano | Preço mensal hipotético | Limites iniciais |
| --- | --- | --- |
| Público | Gratuito | Consulta, compartilhamento e PNG padrão com marca |
| Studio Individual | R$ 49,90 | 1 usuário, 30 projetos, 100 exportações por mês |
| Studio Equipe piloto | R$ 149,90 | 3 usuários, 100 projetos, 300 exportações por mês |

No Individual, testar PNG em alta resolução, SVG, PDF de um gráfico e CSV do recorte; identidade própria e remoção da marca promocional. Fonte, unidade, período e notas metodológicas continuam obrigatórios. Equipe só deve ser construída após demanda validada; não integra o primeiro MVP pago.

Não cobrar automaticamente por excedentes. Exibir uso e solicitar mudança de plano. Uma exportação conta somente após geração bem-sucedida; tentativas repetidas do mesmo trabalho por falha não consomem cota. Limites são mecanismos de controle de custo e devem ser recalibrados pelos pilotos.

### Aquisição e distribuição

Páginas de indicadores, glossário e comparações geram descoberta orgânica. Gráficos gratuitos com link para o recorte distribuem a marca. O convite ao Studio aparece após uma intenção concreta, como exportar em formato profissional ou salvar uma identidade visual. Cadastro não bloqueia consulta pública.

### Patrocínio e publicidade

Começar por patrocínios identificados em páginas ou boletins temáticos, negociados manualmente após haver audiência demonstrável. Não desenvolver um sistema próprio de anúncios. Nenhum patrocinador altera dados, ordenação ou conclusões editoriais. Publicidade programática depende de escala e não sustenta a viabilidade inicial.

### Validação comercial

Entrevistar 15 a 20 profissionais dos públicos prioritários e observar pelo menos dez tarefas de produção de gráficos. Convidar dez usuários para um piloto e testar uma oferta paga real. Hipótese de avanço: pelo menos cinco pagantes e uso semanal recorrente de cinco participantes ao final de quatro semanas. Amostra pequena indica aprendizado, não comprova mercado.

Testar primeiro o preço de R$ 49,90. Se a objeção for falta de valor, investigar o fluxo antes de reduzir preço. Planos anuais, descontos e teste gratuito de sete dias podem ser experimentos posteriores, com condições claras e cancelamento acessível.

## 3 Viabilidade e métricas

### Cenários de assinatura

| Pagantes individuais | Receita mensal bruta | Contribuição após variável de 15% |
| --- | --- | --- |
| 100 | R$ 4.990 | R$ 4.241,50 |
| 300 | R$ 14.970 | R$ 12.724,50 |
| 1.000 | R$ 49.900 | R$ 42.415 |

Cenários aritméticos com preço de R$ 49,90, sem receita publicitária ou equipes. A dedução ilustrativa de 15% agrupa tributos, pagamento e infraestrutura variável; deve ser substituída por custos apurados. Não representa margem líquida e não inclui desenvolvimento, pró-labore, suporte fixo ou aquisição.

Com custo fixo hipotético de R$ 8.000 por mês e contribuição unitária de R$ 42,415, o equilíbrio exige 189 assinantes. Esse cálculo não inclui recuperação do investimento inicial. O custo fixo é um parâmetro, não um orçamento aprovado.

### Indicadores de produto

| Métrica | Definição | Meta inicial proposta |
| --- | --- | --- |
| Tempo até exportação | Mediana da seleção ao arquivo pronto em tarefa observada | Até 5 minutos |
| Ativação Studio | Conta que exporta o primeiro gráfico em até 7 dias | 40% dos cadastros elegíveis |
| Retenção de uso | Ativados que exportam entre dias 22 e 28 | 30% |
| Atualização | Séries dentro do prazo registrado no catálogo | 95% ou mais |
| Erros críticos | Publicações com valor ou unidade incorretos | Zero no lançamento |

As metas orientam revisão; não são promessas de resultado. Medir a origem do tráfego, visita ao editor, início de checkout, pagamento e primeira exportação. Reportar números absolutos junto das taxas, excluindo contas internas e tráfego automatizado.

### Métricas financeiras

MRR considera assinaturas ativas normalizadas para o mês; excluir pagamentos únicos. Churn de clientes é cancelados do mês dividido pelos ativos no começo do mês. Separar cancelamento voluntário de inadimplência. Medir CAC por canal, custo por exportação e minutos de suporte por pagante. Evitar estimar LTV antes de haver coortes com histórico suficiente.

### Critérios de mudança de direção

Se houver tráfego sem uso do editor, revisar a conexão entre conteúdo e ferramenta. Se houver uso sem pagamento, investigar formatos, frequência e preço. Se houver pagamento sem retenção, priorizar tarefas recorrentes antes de ampliar fontes. Receita de patrocínio não deve esconder baixa retenção do Studio.

## 4 Requisitos do portal público

| ID | Prioridade | Requisito e aceite |
| --- | --- | --- |
| PUB01 | P0 | Catálogo por tema e busca por nome e sinônimo; resultado liga à série homologada. |
| PUB02 | P0 | Página do indicador com valor, unidade, período, gráfico, tabela, fonte e atualização. |
| PUB03 | P0 | Filtros de intervalo com URL reproduzível; reabrir preserva o recorte. |
| PUB04 | P0 | Metodologia inclui definição, frequência, cobertura, revisão e limitações. |
| PUB05 | P0 | PNG padrão e link compartilhável incluem fonte e período legíveis. |
| PUB06 | P0 | Dados indisponíveis ou desatualizados têm estado explícito; ausência nunca vira zero. |
| PUB07 | P0 | HTML indexável, título próprio, URL canônica e sitemap; filtros não geram indexação infinita. |
| PUB08 | P1 | Comparador de períodos e governos com regras da seção 7. |
| PUB09 | P1 | Página de composição da Câmara com data de referência e categorias verificáveis. |
| PUB10 | P2 | Embeds atualizáveis, boletim opt-in e catálogo territorial ampliado. |

### Organização da navegação

Início → Economia → indicador. Política → composição institucional e séries homologadas. Comparações → períodos. Metodologia → glossário, fontes e correções. Studio → editor, projetos e assinatura. Administração permanece em rota protegida e não aparece para visitantes.

### Apresentação

Interface em português brasileiro, responsiva, com foco em leitura. Mostrar período do dado antes da data de coleta. Usar cores com contraste suficiente e não depender de vermelho e verde para explicar resultados. Não acrescentar frases de efeito, slogans ou palavras decorativas.

### Exemplo de aceite

Dada uma série mensal com último dado em setembro, a página mostra setembro como referência mesmo que a coleta seja de outubro. Ao compartilhar um intervalo de janeiro a setembro, o destinatário vê o mesmo recorte, a unidade correta e a mesma transformação. Se o período não tiver observações, aparece “Sem dados para este recorte”.

## 5 Requisitos do Studio e cobrança

| ID | Prioridade | Requisito e aceite |
| --- | --- | --- |
| ST01 | P0 | Conta, autenticação e área de projetos; um usuário não acessa projetos de outro. |
| ST02 | P0 | Editor usa somente séries publicadas; permite linha e barras, intervalo e título. |
| ST03 | P0 | Presets 1080×1080, 1080×1350 e 1920×1080; prévia corresponde ao arquivo. |
| ST04 | P0 | Identidade com cores, fonte disponível e logo; fonte dos dados permanece obrigatória. |
| ST05 | P0 | Exportar PNG de alta resolução e CSV com metadados; cota controlada no servidor. |
| ST06 | P0 | Salvar, duplicar e reabrir projeto com configurações e versão dos dados. |
| ST07 | P0 | Checkout, assinatura, cancelamento e webhooks idempotentes. |
| ST08 | P1 | SVG e PDF do gráfico com fonte, unidade e notas sem cortes. |
| ST09 | P1 | Atualizar projeto com nova versão após confirmação e prévia das mudanças. |
| ST10 | P2 | Equipe, papéis, pastas, identidade compartilhada e embeds profissionais. |

### Comportamento do editor

O título é editável, mas não pode ocultar unidade, referência e fonte. Escalas e transformações vêm de opções validadas. Barras começam em zero; eixo logarítmico fica fora do MVP. Bloquear mistura de frequências ou unidades incompatíveis sem transformação registrada. Nenhum texto gerado automaticamente afirma causalidade.

### Projetos e versões

Salvar especificação do gráfico e referência a um conjunto imutável de observações. O padrão de projeto salvo é fixo: novas publicações não mudam silenciosamente um material já usado. Duplicar para atualizar ou aplicar nova versão mediante confirmação. Embeds dinâmicos posteriores exibem data e regra de atualização.

### Ciclo de assinatura

Conceder acesso pago apenas após confirmação verificável do provedor. Webhook duplicado não duplica assinatura ou cota. Cancelamento impede renovação e preserva acesso até o fim do período pago. Ao expirar, projetos ficam disponíveis para leitura; novas exportações premium são bloqueadas. Definir prazo de retenção e permitir exclusão da conta.

Usar checkout hospedado para não armazenar cartões. Política de cobrança, privacidade, reembolso e termos de uso precisam de revisão profissional antes de cobrar. O PRD não fixa interpretação jurídica nem alíquota tributária.

## 6 Catálogo e operação dos dados

### Catálogo candidato ao MVP

| Fonte | Indicadores candidatos | Cuidados de homologação |
| --- | --- | --- |
| IBGE | IPCA, INPC, PIB real, desemprego, rendimento real, população | Tabela, variável, cobertura, deflator, revisões e mudanças metodológicas |
| Banco Central | Meta Selic, câmbio, dívida bruta em % do PIB, resultado primário em % do PIB | Não confundir taxa diária e meta; definir setor institucional e janela |
| IBGE ou BCB conforme série | IPCA em 12 meses e PIB per capita | Derivação registrada ou série oficial; não duplicar conceitos |
| Câmara na fase seguinte | Composição partidária da Câmara em exercício | Data de referência, suplências e filiação válida no período |

São até 12 indicadores econômicos candidatos, sujeitos à disponibilidade e comparabilidade. Lançar com oito se os demais não estiverem homologados. Não preencher lacunas com estimativas sem identificação. Segurança pública, TSE, Senado, Tesouro e Ipea entram depois de conectores próprios validados.

### Contrato mínimo por série

Registrar identificador estável, título, definição, código da fonte, URL, unidade, frequência, território, intervalo disponível, política de revisão, próxima checagem, atraso tolerável, condições de uso e responsável. Uma observação guarda período, valor decimal ou nulo, status, lote, versão, data de coleta e data de publicação quando disponível.

### Pipeline de publicação

Coleta agendada → armazenamento bruto imutável → normalização → validações → aprovação ou quarentena → versão publicada → invalidação de cache. Retentativas com espera progressiva; janela de consulta e paginação por conector. O navegador consulta a API do IndicadoresBR, nunca depende diretamente da fonte oficial para abrir a página.

Checar schema, unidade, duplicidades, lacunas, datas e variações atípicas. Variação atípica gera revisão, não rejeição automática por parecer politicamente inconveniente. Consultas idempotentes não criam observações duplicadas. Publicações do mesmo período podem ser revisadas e precisam de histórico.

### Administração e incidentes

Painel apresenta sucesso da coleta, diferença frente à versão anterior, erros e atraso esperado. Mudança de schema ou unidade bloqueia publicação. Falha de coleta preserva o último lote válido com aviso de desatualização. Administrador pode reprocessar e reverter a versão ativa; logs registram autor, horário e motivo.

## 7 Regras metodológicas e confiança

### Comparações econômicas

Toda comparação precisa compartilhar conceito, frequência, território e base. Média de taxas não substitui variação acumulada: para inflação, acumular o produto de 1 + taxa mensal/100 e subtrair 1. PIB anual e trimestral não se somam como percentuais. Pontos percentuais e variação percentual têm rótulos distintos.

Valores monetários reais devem indicar índice, período-base e fórmula. Se o índice for compatível, valor real em B = valor nominal em t × índice B / índice t. Não deflacionar novamente uma série já real. Divisão por população exige denominador compatível; não interpolar população sem explicar o método.

### Governos e períodos incompletos

Datas de início e fim pertencem a uma tabela de mandatos versionada, incluindo interinidades quando relevantes. Atribuir observações pelo período de referência, nunca pela data de coleta. Para períodos de transição que a frequência da série não separa, informar a convenção e impedir atribuição automática sem regra homologada.

Comparador oferece mandatos completos e janela de duração comum. Mandato incompleto tem rótulo visível e não compete em totais acumulados com mandatos completos sem ajuste. Mostrar herança do indicador no início, resultados observados e eventos relevantes como contexto editorial. Correlação temporal não prova efeito do governante.

### Composição política

Separar resultado eleitoral, bancada na data escolhida e parlamentares em exercício. Não contar simultaneamente titular afastado e suplente em sua cadeira. Validar totais frente ao universo consultado e tratar vagas ou registros faltantes explicitamente. Histórico de filiação não pode ser reconstruído usando apenas o partido atual.

Categorias “esquerda”, “centro” e “direita” dependem de classificação editorial documentada, com fonte, versão, critérios e casos controversos. Excluir do primeiro MVP. Quando implementadas, permitir visualizar partidos sem classificação e informar que o agrupamento não é uma taxonomia oficial.

### Correções e independência

Manter registro público de correções materiais, incluindo versão afetada, explicação e data. Distinguir dados oficiais, cálculo do IndicadoresBR e interpretação editorial. Patrocinadores não aprovam análises. Revisão humana é obrigatória para novo indicador, transformação, regra de mandato e texto interpretativo.

### Teste de aceite metodológico

Dois meses de inflação de 1% resultam em 2,01%, não 2%. Queda de desemprego de 10% para 8% equivale a 2 pontos percentuais ou 20% de redução relativa. Uma série com dado ausente produz lacuna, não uma linha artificial ligando zeros.

## 8 Arquitetura e qualidade técnica

### Arquitetura de referência

Frontend com renderização no servidor ou geração estática para páginas públicas; editor interativo no cliente. API própria aplica regras, autenticação e permissões. PostgreSQL guarda catálogo, observações, versões, projetos e assinaturas. Armazenamento de objetos guarda lotes brutos, logos e exportações. Um worker executa coleta e exportação assíncrona, com fila e retentativas.

Escolher frameworks e provedores após avaliar o site atual, hospedagem e experiência da equipe. Evitar microserviços no MVP: uma aplicação modular e um worker bastam. Publicidade e leitura pública não acessam dados privados do Studio.

### Entidades essenciais

| Entidade | Responsabilidade |
| --- | --- |
| Source e Indicator | Fonte, código, conceito e metadados |
| DatasetVersion e Observation | Lotes imutáveis e valores por período e território |
| Transformation | Fórmula, versão, parâmetros e entradas |
| GovernmentTerm | Mandato e convenção de atribuição |
| User e Workspace | Identidade e autorização |
| Project e ExportJob | Especificação, snapshot, arquivo e estado |
| Subscription e UsageLedger | Direito de acesso e contabilização idempotente |
| AuditEvent | Alterações e publicação rastreáveis |

### Contratos de API propostos

GET /v1/indicators; GET /v1/indicators/{id}/observations com período e versão; POST /v1/projects; POST /v1/exports com chave de idempotência; GET /v1/exports/{id}; POST /v1/billing/webhook. Respostas de observações incluem unidade, frequência, versão e status. Validar parâmetros e impor limites; API comercial externa fica fora do MVP.

### Metas técnicas iniciais

Páginas públicas: LCP no percentil 75 até 2,5 s em medição móvel após volume suficiente. API de leitura com cache: p95 até 500 ms sob carga de 50 requisições por segundo no ensaio. PNG simples: p95 até 15 s sob cinco exportações simultâneas. Tratar essas metas como critérios de ensaio, não SLA contratado.

Navegação por teclado, gráfico acompanhado de tabela, contraste adequado e leitores de tela nos controles. Datas exibidas em padrão brasileiro; valores pt-BR na tela e CSV UTF-8 com formato documentado. Armazenar timestamps em UTC e exibir fuso quando necessário.

## 9 Segurança testes e lançamento

### Proteção operacional

Permissões verificadas no servidor em projetos, exportações e assinatura. Não confiar no plano enviado pelo cliente. Administração com autenticação multifator. Logos enviados têm validação de tipo e tamanho; texto e SVG são sanitizados, com bloqueio de scripts e recursos externos. URLs de arquivos privados são temporárias e autorizadas.

Segredos somente no servidor; webhooks autenticados; logs sem credenciais ou cartão. Rate limits por usuário e IP conforme rota, cotas no worker e proteção contra geração repetida. Ambientes separados para desenvolvimento, homologação e produção.

### Recuperação e observabilidade

Backup diário de banco e versionamento dos objetos essenciais. Meta inicial de recuperação: RPO de 24 horas e RTO de 8 horas; validar restauração antes do lançamento e trimestralmente. Alertar para falhas consecutivas de coleta, fila parada, exportações com erro e divergência de pagamento. Um responsável acompanha incidentes e comunica correções materiais.

### Plano de testes obrigatório

| Grupo | Verificação |
| --- | --- |
| Dados | Conferência de amostra em fonte oficial; unidades, revisões e duplicidades |
| Cálculos | Inflação composta, pontos percentuais, deflação e períodos incompletos |
| Autorização | Usuário A não lê nem exporta projeto ou arquivo do usuário B |
| Cobrança | Webhook repetido, atraso, falha, cancelamento e expiração |
| Exportação | Fonte e ressalvas visíveis nos três presets; caracteres portugueses |
| Resiliência | Fonte fora do ar, schema alterado, job repetido e restauração |
| Experiência | Tarefa observada, teclado, mobile e compartilhamento do recorte |

### Condições para lançar

O portal exige oito séries homologadas, métodos publicados, nenhum erro crítico conhecido e monitoramento ativo. O Studio exige dez pilotos, checkout testado de ponta a ponta, isolamento de contas comprovado, cancelamento funcional, exportações revisadas e termos aprovados. Falhar em um desses pontos adia a respectiva entrega.

### Riscos centrais

Dados revisados exigem versionamento. Escopo amplo aumenta custo de manutenção. Baixa disposição a pagar exige validação cedo. Reputação política exige critérios simétricos e transparência editorial. Dependência de fontes exige cache e atraso explícito. Automação com IA pode auxiliar redação e código, mas não publica números ou conclusões sem validação.

## 10 Roadmap e decisões pendentes

### Plano em ciclos de entrega

| Ciclo | Entrega | Dependência e saída |
| --- | --- | --- |
| 0 • 1 semana | Diagnóstico do site, entrevistas e contrato do catálogo | Inventário do existente e lista homologável |
| 1 • 2 a 3 semanas | Coleta, versões, validações e painel mínimo | Oito séries conferidas e recuperação ensaiada |
| 2 • 2 semanas | Portal, busca, páginas e PNG público | URLs reproduzíveis e metodologia publicada |
| 3 • 2 a 3 semanas | Editor, projetos, identidade e exportação PNG e CSV | Dez pilotos completam tarefa |
| 4 • 1 a 2 semanas | Assinaturas, cotas e lançamento pago controlado | Pagamento e cancelamento testados |
| 5 • por validação | Comparador, SVG e PDF, equipes e embeds | Uso recorrente e demanda comprovada |

Faixa total inicial de 8 a 11 semanas após o diagnóstico, assumindo uma pessoa de engenharia experiente dedicada, revisão de dados disponível e escopo controlado. A estimativa deve ser refeita após o ciclo 0. IA pode reduzir tarefas, mas não elimina validação, integração e manutenção.

### Responsabilidades propostas

Fernando: prioridades, entrevistas, critérios editoriais e aprovação comercial. Engenharia: arquitetura, código, integração e operação. Revisor de dados: homologação de séries e cálculos. Design: experiência e exportações. Apoio contábil e jurídico: cobrança, contratos e privacidade. Uma pessoa pode acumular funções, mas publicação e critérios precisam de responsável definido.

### Backlog inicial em ordem

1. Inventariar o site atual e decidir reaproveitamento. 2. Especificar oito séries e conferir amostras. 3. Implementar coleta versionada e quarentena. 4. Publicar páginas, tabela, filtros e metodologia. 5. Produzir PNG reproduzível. 6. Criar contas e projetos privados. 7. Construir editor e contabilizar exportações. 8. Integrar pagamento e cancelamento. 9. Conduzir piloto pago. 10. Priorizar evolução pelas coortes.

### Decisões antes de codificar cada fase

Confirmar domínio e acesso ao projeto existente; disponibilidade de engenharia e revisão; orçamento mensal máximo; oito indicadores de estreia; propriedade dos dados e termos de cada fonte; provedor de pagamento; política de retenção de projetos; preço piloto. São decisões a resolver no início ou antes da funcionalidade dependente, sem bloquear a definição do produto.

### Referências oficiais consultadas

IBGE : metadados SIDRA: https://www.ibge.gov.br/metadados/sidra
Banco Central : webservices: https://www.bcb.gov.br/gestao_site/webservices.asp?frame=1
Banco Central : catálogo Selic série 11: https://dadosabertos.bcb.gov.br/dataset/11-taxa-de-juros---selic
Câmara : API de Dados Abertos: https://dadosabertos.camara.leg.br/swagger/api.html
