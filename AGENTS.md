# Instruções para agentes (Claude, Codex, Cursor ou qualquer outro)

Este repositório é o **Indicadores BR**: um portal de dados públicos do Brasil com gráficos animados, página explicativa por indicador, fonte em todo número e canal aberto para o leitor reportar erro.

Leia nesta ordem antes de mexer em qualquer coisa:

1. `docs/01_arquitetura.md`: como o site, o banco e os arquivos se encaixam.
2. `docs/02_modelo_de_dados.md`: o formato de cada indicador (`data/indicadores/<id>.json`).
3. `docs/03_coleta_e_manutencao.md`: como atualizar um dado, criar um indicador e tratar reports. **É o roteiro de trabalho.**
4. `docs/06_estilo_editorial.md`: regras de texto e de equilíbrio. Valem para todo texto que vai ao ar.
5. `docs/07_pendencias_de_conferencia.md`: divergências abertas, que esperam decisão ou fonte. Comece por aqui quando não houver tarefa específica.

## Regras que não mudam

- **Todo número tem fonte.** Fonte primária sempre que existir (o órgão que produz o dado). Indicador sem `fonte.nome` não aparece no site.
- **Nunca invente ou estime um valor sem dizer.** Se um número é cálculo próprio ou estimativa, o texto `como_ler` diz qual foi a conta.
- **Mesma régua para todos** os governos, partidos e candidatos. Faixas de governo localizam no tempo e não atribuem causa.
- **Sem travessão longo (—)** em nenhum texto. O `scripts/build.py` recusa.
- **Sem construções de oposição** do tipo "não é X, é Y" ou "não X, mas Y". "Onde" só para lugar físico; no resto, "em que".
- **A chave secreta do Supabase (service_role / secret) nunca vai para o repositório.** Só como variável de ambiente.
- Toda mudança de dado termina com repositório e banco iguais (`scripts/sync.py`) e com `python3 scripts/build.py` rodado antes do commit.
- Se um valor mudar em relação à versão anterior, registre no commit qual era, qual ficou e de onde veio o novo.

## Comandos

```bash
python3 scripts/build.py --checar     # valida todos os indicadores
python3 scripts/build.py              # valida e gera data/indicadores.json, páginas, sitemap e supabase/seed.sql
python3 scripts/build.py --formatar   # padroniza a formatação dos JSON
python3 scripts/gerar_og.py           # imagens de prévia de link (precisa de Playwright)
python3 scripts/sync.py status        # compara repositório e banco (precisa das variáveis de ambiente)
python3 scripts/sync.py baixar        # banco -> repositório
python3 scripts/sync.py enviar <id>   # repositório -> banco
```

Para ver o site localmente: `python3 -m http.server 8000` na raiz e abra `http://localhost:8000`.
