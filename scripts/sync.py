#!/usr/bin/env python3
"""Indicadores BR · sincronização entre o repositório (data/) e o banco (Supabase)

O banco é o que o site mostra. O repositório guarda a cópia versionada, com histórico no Git.
Toda alteração termina com os dois iguais.

Comandos:
  python3 scripts/sync.py status            compara repositório e banco, sem mudar nada
  python3 scripts/sync.py baixar            banco -> data/ (traz o que foi editado no admin)
  python3 scripts/sync.py enviar [ids...]   data/ -> banco (publica o que foi editado nos arquivos)
      --forcar   envia mesmo se o banco tiver uma versão mais nova que a última sincronização

Precisa de duas variáveis de ambiente (nunca grave em arquivo do repositório):
  SUPABASE_URL                 ex.: https://sfroiqakkcphhnsqibsh.supabase.co
  SUPABASE_SERVICE_ROLE_KEY    a chave secreta (Project Settings > API Keys > secret)

Sem a chave secreta, a alternativa é: python3 scripts/build.py e colar supabase/seed.sql no SQL Editor.
"""
import json, os, sys, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from build import carregar, validar, dump_indicador  # noqa: E402

SYNC = ROOT / "data" / ".sync.json"
URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

def api(method, path, body=None, prefer=None):
    if not URL or not KEY:
        sys.exit("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.")
    req = urllib.request.Request(f"{URL}/rest/v1/{path}", method=method,
                                 data=None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8"))
    req.add_header("apikey", KEY); req.add_header("Authorization", f"Bearer {KEY}")
    req.add_header("Content-Type", "application/json")
    if prefer: req.add_header("Prefer", prefer)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            t = r.read().decode("utf-8")
            return json.loads(t) if t else None
    except urllib.error.HTTPError as e:
        sys.exit(f"Erro {e.code} em {method} {path}: {e.read().decode('utf-8')[:400]}")

def estado():
    try: return json.loads(SYNC.read_text())
    except Exception: return {}

def remoto():
    rows = api("GET", "indicadores?select=id,conteudo,atualizado_em,atualizado_por")
    return {r["id"]: r for r in rows}

# "checagem" fica só no repositório (registro de conferência, não vai ao banco nem ao site)
def limpa(i): return {k: v for k, v in i.items() if not k.startswith("_") and k != "checagem"}

def status():
    site, inds = carregar()
    rem, st = remoto(), estado()
    loc = {i["id"]: limpa(i) for i in inds}
    for iid in sorted(set(loc) | set(rem)):
        if iid not in rem: print(f"só no repositório   {iid}"); continue
        if iid not in loc: print(f"só no banco         {iid}  (editado por {rem[iid].get('atualizado_por')})"); continue
        igual = json.dumps(loc[iid], sort_keys=True, ensure_ascii=False) == json.dumps(rem[iid]["conteudo"], sort_keys=True, ensure_ascii=False)
        novo = st.get(iid) != rem[iid]["atualizado_em"]
        if not igual: print(f"diferente           {iid}  {'(banco mudou depois da última sincronização)' if novo else '(repositório mudou)'}")
    print("fim da comparação")

def baixar():
    cfg = {r["chave"]: r["valor"] for r in api("GET", "config?select=chave,valor")}
    cats = api("GET", "categorias?select=id,nome,descricao,ordem&order=ordem")
    site_atual = json.loads((ROOT / "data" / "site.json").read_text(encoding="utf-8"))
    site_atual["site"] = cfg.get("site", site_atual["site"])
    site_atual["categorias"] = cats
    (ROOT / "data" / "site.json").write_text(json.dumps(site_atual, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    rem, st = remoto(), {}
    pasta = ROOT / "data" / "indicadores"
    for iid, r in rem.items():
        arq = pasta / f"{iid}.json"
        novo = dict(r["conteudo"])
        if arq.exists():
            antigo = json.loads(arq.read_text(encoding="utf-8"))
            if "checagem" in antigo: novo["checagem"] = antigo["checagem"]
        arq.write_text(dump_indicador(novo), encoding="utf-8")
        st[iid] = r["atualizado_em"]
    for f in pasta.glob("*.json"):
        if f.stem not in rem: print(f"aviso: {f.name} existe no repositório e não no banco (não apaguei)")
    SYNC.write_text(json.dumps(st, indent=1))
    print(f"baixados {len(rem)} indicadores. Rode python3 scripts/build.py e faça o commit.")

def enviar(ids, forcar):
    site, inds = carregar()
    erros, _ = validar(site, inds)
    if erros: sys.exit("Corrija antes de enviar:\n" + "\n".join(erros))
    rem, st = remoto(), estado()
    alvo = [i for i in inds if not ids or i["id"] in ids]
    conflitos = [i["id"] for i in alvo if i["id"] in rem and st.get(i["id"]) and rem[i["id"]]["atualizado_em"] != st[i["id"]]]
    if conflitos and not forcar:
        sys.exit("O banco mudou depois da última sincronização (alguém editou no admin): " + ", ".join(conflitos) +
                 "\nRode 'baixar' primeiro, junte as mudanças e envie de novo, ou use --forcar para sobrescrever.")
    api("POST", "config?on_conflict=chave", [{"chave": "site", "valor": site["site"]}], prefer="resolution=merge-duplicates")
    api("POST", "categorias?on_conflict=id", [{k: c.get(k) for k in ("id", "nome", "descricao", "ordem")} for c in site["categorias"]], prefer="resolution=merge-duplicates")
    for i in alvo:
        out = api("POST", "indicadores?on_conflict=id", [{"id": i["id"], "categoria": i["categoria"], "conteudo": limpa(i)}],
                  prefer="resolution=merge-duplicates,return=representation")
        st[i["id"]] = out[0]["atualizado_em"]
        print("enviado", i["id"])
    SYNC.write_text(json.dumps(st, indent=1))
    print(f"{len(alvo)} indicadores publicados no banco.")

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args: print(__doc__); sys.exit(0)
    cmd = args[0]
    if cmd == "status": status()
    elif cmd == "baixar": baixar()
    elif cmd == "enviar": enviar(args[1:], "--forcar" in sys.argv)
    else: print(__doc__)
