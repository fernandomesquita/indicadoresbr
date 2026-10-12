# Indicadores BR

Dados públicos do Brasil reunidos, conferidos e explicados.

Os números que explicam o país estão espalhados por dezenas de órgãos, em planilhas, relatórios e sistemas que pouca gente sabe usar. O Indicadores BR busca cada dado na fonte oficial, confere, organiza em séries comparáveis e transforma em gráficos animados que qualquer pessoa entende e pode compartilhar. Cada indicador tem uma página com o gráfico, a tabela completa, como ler, contexto, glossário, todas as fontes e um botão para o leitor reportar erro.

## O que há aqui

| Pasta ou arquivo | Conteúdo |
|---|---|
| `data/indicadores/` | Um arquivo por indicador: dados, textos e fontes. **É aqui que os dados moram.** |
| `data/site.json` | Nome do portal, categorias, destaques da página inicial e faixas de governo. |
| `assets/` | O site (JavaScript sem dependências de compilação, CSS e o motor de gráficos em canvas). |
| `scripts/` | Build (valida e gera páginas), sincronização com o banco e imagens de prévia. |
| `supabase/` | Estrutura do banco (`schema.sql`) e carga gerada pelo build (`seed.sql`). |
| `docs/` | Documentação completa. Comece por `AGENTS.md`. |

## Começar

```bash
python3 scripts/build.py          # valida os dados e gera as páginas
python3 -m http.server 8000       # abra http://localhost:8000
```

## Documentação

- [`AGENTS.md`](AGENTS.md): regras e comandos para qualquer agente de IA ou pessoa que vá mexer no repositório.
- [`docs/01_arquitetura.md`](docs/01_arquitetura.md): como as peças se encaixam.
- [`docs/02_modelo_de_dados.md`](docs/02_modelo_de_dados.md): formato de cada indicador.
- [`docs/03_coleta_e_manutencao.md`](docs/03_coleta_e_manutencao.md): roteiro para atualizar dados, criar indicadores e tratar reports.
- [`docs/04_publicacao.md`](docs/04_publicacao.md): Supabase, Vercel ou Netlify e domínio.
- [`docs/05_admin.md`](docs/05_admin.md): uso da área administrativa.
- [`docs/06_estilo_editorial.md`](docs/06_estilo_editorial.md): regras de texto e de equilíbrio.
- [`docs/07_pendencias_de_conferencia.md`](docs/07_pendencias_de_conferencia.md): divergências abertas de números e fontes.
- [`docs/catalogo_de_fontes.md`](docs/catalogo_de_fontes.md): fonte, periodicidade e endereço de atualização de cada indicador (gerado pelo build).
