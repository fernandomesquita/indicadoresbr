# Arquitetura

## Visão geral

```
navegador do leitor
  │  HTML, CSS e JS estáticos (Vercel ou Netlify, a partir deste repositório)
  │
  ├── lê indicadores publicados ──────────────► Supabase (tabelas indicadores, categorias, config)
  │        se o banco não responder ──────────► /data/indicadores.json (cópia do repositório)
  │
  └── envia report, sugestão, contato ────────► Supabase (tabelas reports, sugestoes, contatos)

/admin (sem link no site público)
  └── login no Supabase + e-mail na tabela admins
        ├── lê e trata reports, sugestões e contatos
        └── edita indicadores, categorias e configurações (grava direto no banco)

agentes e pessoas que mantêm os dados
  └── editam data/indicadores/<id>.json  ──► scripts/sync.py enviar ──► banco
      ou editam no /admin                ──► scripts/sync.py baixar ──► repositório
```

- **Site sem etapa de compilação.** HTML, CSS e JavaScript puros (módulos ES). Bibliotecas externas: só a `supabase-js` (jsDelivr, versão fixa) e as fontes do Google.
- **O banco é a versão no ar.** O repositório guarda a cópia versionada, com histórico no Git. O `scripts/sync.py` mantém os dois iguais.
- **Fallback.** Se o Supabase cair, o site continua lendo `data/indicadores.json`. Os formulários ficam indisponíveis nesse caso e avisam o leitor.

## Pastas

| Caminho | O que é |
|---|---|
| `index.html`, `categoria/`, `indicador/`, `metodo/`, `sugira/`, `contato/`, `admin/`, `404.html` | Páginas geradas pelo `scripts/build.py` a partir de `scripts/template.html`. Cada uma tem título, descrição e prévia de link próprios. **Não edite à mão.** |
| `assets/app.js` | Site público: roteador, páginas, busca, formulários, report, PNG e CSV. |
| `assets/charts.js` | Desenhista dos gráficos (Canvas), tabelas animadas e composição das imagens PNG. |
| `assets/admin.js` | Área administrativa. Carregada só em `/admin`. |
| `assets/store.js` | Acesso ao Supabase e ao arquivo de fallback. |
| `assets/style.css` | Estilos, com tema claro e escuro. |
| `config.js` | URL e chave pública do Supabase, e o endereço do site. |
| `data/site.json` | Nome do portal, categorias, destaques da home e faixas de governo. |
| `data/indicadores/<id>.json` | Um arquivo por indicador: dados, textos, fontes e checagem. |
| `data/indicadores.json` | Pacote gerado pelo build (fallback). |
| `og/` | Imagens de prévia de link geradas por `scripts/gerar_og.py`. |
| `supabase/schema.sql` | Estrutura do banco, regras de acesso (RLS), histórico e freio contra abuso. |
| `supabase/seed.sql` | Carga dos indicadores, gerada pelo build. |
| `scripts/` | Build, sincronização, imagens de prévia e o modelo HTML. |
| `docs/` | Esta documentação. `docs/catalogo_de_fontes.md` é gerado pelo build. |

## Rotas

| Endereço | Página |
|---|---|
| `/` | Início: por que o portal existe, busca, categorias, destaques, chamada para sugerir dados |
| `/categoria/<id>` | Fichas dos indicadores da categoria |
| `/indicador/<id>` | Página do indicador: gráfico, como ler, contexto, dados com report por linha, glossário, fontes, atualização |
| `/metodo` | Como coletamos, conferimos e corrigimos |
| `/sugira` | Formulário de sugestão de dados |
| `/contato` | Formulário de contato |
| `/admin` | Administração (sem link público, `noindex`) |

## Banco (Supabase)

Projeto `indicadoresbr` (organização DOM), endereço `https://sfroiqakkcphhnsqibsh.supabase.co`.

| Tabela | Quem lê | Quem escreve |
|---|---|---|
| `config`, `categorias` | todos | administradores |
| `indicadores` | todos (só visíveis); administradores veem tudo | administradores |
| `indicadores_historico` | administradores | automático, a cada alteração ou exclusão |
| `reports`, `sugestoes`, `contatos` | administradores | qualquer visitante (só insere) |
| `admins` | o próprio administrador | só pelo SQL Editor |

Regras importantes do banco (ver `supabase/schema.sql`):
- Um indicador sem `fonte.nome` fica com `visivel = false` automaticamente.
- `reports.motivo` exige pelo menos 5 palavras; `sugestoes.texto`, 3 palavras.
- Freio contra abuso: até 20 envios por tabela a cada 10 minutos e até 3 textos idênticos por hora.
- Toda versão anterior de um indicador vai para `indicadores_historico`.
