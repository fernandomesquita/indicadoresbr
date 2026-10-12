#!/usr/bin/env python3
"""Indicadores BR · taxa de governismo na Câmara a partir dos dados abertos

Baixa os arquivos anuais oficiais da Câmara dos Deputados e calcula, para cada
partido, a porcentagem dos votos dos seus deputados que seguiram a orientação
do governo nas votações nominais do Plenário.

Método (o mesmo descrito pelo Poder360 para 2023):
  - entram só votações do Plenário (siglaOrgao = PLEN) com orientação do
    governo igual a Sim ou Não; orientação "Liberado" e votações sem
    orientação ficam fora;
  - cada voto individual Sim ou Não conta como seguir ou não seguir;
    Abstenção e Obstrução contam como não seguir;
  - "Artigo 17" (presidente da sessão) fica fora;
  - o partido é o registrado no voto (deputado_siglaPartido), ou seja, o
    partido do deputado na data da votação.

Uso:
  python3 scripts/governismo.py 2019 2020 2021 2022 2023 2024 2025
Saída: data/aux/governismo/governismo.json e governismo_partido_ano.csv

Fontes: https://dadosabertos.camara.leg.br/arquivos/votacoes/csv/votacoes-{ano}.csv
        https://dadosabertos.camara.leg.br/arquivos/votacoesOrientacoes/csv/votacoesOrientacoes-{ano}.csv
        https://dadosabertos.camara.leg.br/arquivos/votacoesVotos/csv/votacoesVotos-{ano}.csv
"""
import csv, io, json, sys, urllib.request, datetime, collections, pathlib

BASE = "https://dadosabertos.camara.leg.br/arquivos/{k}/csv/{k}-{ano}.csv"
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "aux" / "governismo"
csv.field_size_limit(10**9)

def baixar(k, ano):
    url = BASE.format(k=k, ano=ano)
    print("baixando", url, flush=True)
    req = urllib.request.Request(url, headers={"User-Agent": "IndicadoresBR/1.0"})
    with urllib.request.urlopen(req, timeout=600) as r:
        dados = r.read()
    txt = dados.decode("utf-8-sig", errors="replace")
    rd = csv.DictReader(io.StringIO(txt), delimiter=";")
    linhas = list(rd)
    print(f"  {len(linhas)} linhas; colunas: {rd.fieldnames}", flush=True)
    return linhas

def norm(s): return (s or "").strip()

def governo(sigla):
    s = norm(sigla).lower()
    return s == "governo" or s.startswith("governo")

def semestre(data): return 1 if int(data[5:7]) <= 6 else 2

def main(anos):
    OUT.mkdir(parents=True, exist_ok=True)
    por_partido_ano = collections.defaultdict(lambda: [0, 0])      # (partido, ano) -> [seguiu, total]
    por_partido_sem = collections.defaultdict(lambda: [0, 0])      # (partido, ano, sem)
    camara_sem = collections.defaultdict(lambda: [0, 0])           # (ano, sem)
    camara_ano = collections.defaultdict(lambda: [0, 0])
    n_votacoes = collections.Counter()
    bancadas_vistas = collections.Counter()
    valores_voto = collections.Counter()
    for ano in anos:
        vot = baixar("votacoes", ano)
        plen = {}
        for v in vot:
            if norm(v.get("siglaOrgao")) == "PLEN":
                plen[norm(v.get("id"))] = norm(v.get("data"))[:10]
        ori = baixar("votacoesOrientacoes", ano)
        orient = {}
        for o in ori:
            bancadas_vistas[norm(o.get("siglaBancada"))] += 1
            if not governo(o.get("siglaBancada")): continue
            vid = norm(o.get("idVotacao"))
            if vid not in plen: continue
            ori_txt = norm(o.get("orientacao"))
            if ori_txt in ("Sim", "Não"):
                orient[vid] = ori_txt
        print(f"  {ano}: {len(plen)} votações de Plenário; {len(orient)} com orientação Sim/Não do governo", flush=True)
        votos = baixar("votacoesVotos", ano)
        contadas = set()
        for v in votos:
            vid = norm(v.get("idVotacao"))
            if vid not in orient: continue
            voto = norm(v.get("voto"))
            valores_voto[voto] += 1
            if voto not in ("Sim", "Não", "Abstenção", "Obstrução"): continue
            partido = norm(v.get("deputado_siglaPartido")) or "sem partido"
            data = plen[vid]; a = int(data[:4]); sm = semestre(data)
            seg = 1 if voto == orient[vid] else 0
            for chave, d in (((partido, a), por_partido_ano), ((partido, a, sm), por_partido_sem), ((a, sm), camara_sem), ((a,), camara_ano)):
                d[chave][0] += seg; d[chave][1] += 1
            contadas.add(vid)
        n_votacoes[ano] = len(contadas)
    pct = lambda s, t: round(100 * s / t, 1) if t else None
    res = {
        "gerado_em": datetime.datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "metodo": __doc__.split("Uso:")[0].strip(),
        "votacoes_contadas": dict(n_votacoes),
        "camara_ano": {str(k[0]): {"pct": pct(*v), "seguiu": v[0], "votos": v[1]} for k, v in sorted(camara_ano.items())},
        "camara_semestre": {f"{k[0]}-S{k[1]}": {"pct": pct(*v), "seguiu": v[0], "votos": v[1]} for k, v in sorted(camara_sem.items())},
        "partido_ano": {f"{p}|{a}": {"pct": pct(*v), "seguiu": v[0], "votos": v[1]} for (p, a), v in sorted(por_partido_ano.items())},
        "partido_semestre": {f"{p}|{a}-S{s}": {"pct": pct(*v), "seguiu": v[0], "votos": v[1]} for (p, a, s), v in sorted(por_partido_sem.items())},
        "bancadas_mais_frequentes": bancadas_vistas.most_common(40),
        "valores_de_voto": valores_voto.most_common(),
    }
    (OUT / "governismo.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    with open(OUT / "governismo_partido_ano.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";"); w.writerow(["partido", "ano", "pct_seguiu_governo", "votos_que_seguiram", "votos_total"])
        for (p, a), v in sorted(por_partido_ano.items()): w.writerow([p, a, pct(*v), v[0], v[1]])
    print("ok:", OUT / "governismo.json")

if __name__ == "__main__":
    main([int(a) for a in sys.argv[1:]] or [2019, 2020, 2021, 2022, 2023, 2024, 2025])
