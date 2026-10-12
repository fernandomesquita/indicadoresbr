# Área administrativa (`/admin`)

Não há link para ela no site público, e ela não aparece em buscadores. Digite o endereço do site seguido de `/admin`.

## Entrar

E-mail e senha do usuário criado no Supabase. A conta precisa estar na tabela `admins`; se não estiver, o admin mostra "Acesso restrito".

## Abas

**Reports de erro, Sugestões e Contatos**
- O número vermelho na aba mostra quantos itens novos existem.
- Filtros: Novos, Em análise, Resolvidos, Descartados, Todos.
- Em cada item: mude a situação, escreva uma nota interna (só a equipe vê) e clique em Salvar.
- O report mostra o indicador (com link) e, quando o leitor clicou no botão de uma linha da tabela, o valor exato apontado.

**Indicadores**
- Lista por categoria à esquerda. Riscado = oculto do site (sem fonte ou marcado como invisível).
- Editor com todos os campos de `docs/02_modelo_de_dados.md`, grade de dados editável, colagem de tabela do Excel ou Google Sheets e prévia do gráfico.
- Avisos em amarelo apontam o que falta (fonte, contexto, como ler, travessão longo).
- **Salvar e publicar** grava no banco e o site passa a mostrar a nova versão. Se outra pessoa salvou o mesmo indicador depois que você abriu, o admin avisa e não sobrescreve.
- Toda versão anterior fica guardada na tabela `indicadores_historico` do banco.
- Depois de editar pelo admin, alguém roda `python3 scripts/sync.py baixar` e faz o commit, para o repositório guardar a versão.

**Categorias e site**
- Nome, descrição e ordem das categorias. Uma categoria só pode ser removida vazia.
- Nome do portal (vai nas imagens PNG), destaques da página inicial e faixas de governo.

**Exportar JSON** baixa tudo o que está no banco, para conferência ou backup.
