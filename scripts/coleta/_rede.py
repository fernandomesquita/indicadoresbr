"""Rede para os scripts de coleta: downloads com verificação TLS completa.

Alguns servidores oficiais (ex.: download.inep.gov.br) não enviam o certificado
intermediário. Em vez de desligar a verificação, buscamos o intermediário pelo
endereço indicado no próprio certificado (AIA, "CA Issuers") e verificamos a
cadeia com ele acrescentado ao conjunto de autoridades confiáveis.
"""
import ssl, socket, tempfile, time, urllib.request, urllib.parse, os
UA = "Mozilla/5.0 (X11; Linux x86_64) IndicadoresBR/1.0 (+https://github.com/fernandomesquita/indicadoresbr)"
_ctx_por_host = {}

def _ctx_com_intermediario(host):
    if host in _ctx_por_host: return _ctx_por_host[host]
    from cryptography import x509
    from cryptography.hazmat.primitives.serialization import Encoding
    import certifi
    pem = ssl.get_server_certificate((host, 443))
    cert = x509.load_pem_x509_certificate(pem.encode())
    urls = []
    try:
        aia = cert.extensions.get_extension_for_class(x509.AuthorityInformationAccess).value
        urls = [d.access_location.value for d in aia if d.access_method == x509.oid.AuthorityInformationAccessOID.CA_ISSUERS]
    except Exception:
        pass
    extra = ""
    for u in urls:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA}), timeout=60) as r:
            der = r.read()
        try: inter = x509.load_der_x509_certificate(der)
        except Exception: inter = x509.load_pem_x509_certificate(der)
        extra += inter.public_bytes(Encoding.PEM).decode()
    bundle = tempfile.NamedTemporaryFile("w", delete=False, suffix=".pem")
    bundle.write(open(certifi.where()).read() + "\n" + extra); bundle.close()
    ctx = ssl.create_default_context(cafile=bundle.name)
    _ctx_por_host[host] = ctx
    print(f"  TLS: {host} verificado com intermediário de {urls}", flush=True)
    return ctx

def baixar(url, destino=None, timeout=600, tentativas=4, headers=None):
    """Baixa url (para destino, se dado; senão devolve bytes). Verifica TLS sempre."""
    host = urllib.parse.urlparse(url).hostname
    ctx = None
    for t in range(tentativas):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
                if destino:
                    with open(destino, "wb") as f:
                        while True:
                            b = r.read(1 << 20)
                            if not b: break
                            f.write(b)
                    return destino
                return r.read()
        except Exception as e:
            msg = str(e)
            print(f"  tentativa {t+1} falhou em {url}: {msg[:200]}", flush=True)
            if "CERTIFICATE_VERIFY_FAILED" in msg and ctx is None:
                ctx = _ctx_com_intermediario(host); continue
            time.sleep(5 * (t + 1))
    raise RuntimeError(f"falhou: {url}")
