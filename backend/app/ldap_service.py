# ldap_service.py
from ldap3 import Server, Connection, ALL, SUBTREE, Tls
import ssl
import os

AD_SERVER = os.getenv("AD_SERVER")
AD_DOMAIN = os.getenv("AD_DOMAIN", "santechsous.local")

def autenticar_usuario(username: str, password: str):
    """
    Tenta autenticar o usuário no AD via bind LDAP sobre SSL (LDAPS).
    Retorna dict com sucesso e grupos, ou None se falhar.
    """
    tls_config = Tls(validate=ssl.CERT_NONE)  # lab com certificado autoassinado
    server = Server(AD_SERVER, port=636, use_ssl=True, tls=tls_config, get_info=ALL)
    user_dn = f"{username}@{AD_DOMAIN}"

    conn = Connection(server, user=user_dn, password=password)
    sucesso = conn.bind()

    if not sucesso:
        print(f"ERRO LDAP DETALHADO: {conn.result}")
        return None

    # Busca os grupos do usuário autenticado
    base_dn = ",".join([f"DC={p}" for p in AD_DOMAIN.split(".")])
    conn.search(
        search_base=base_dn,
        search_filter=f"(sAMAccountName={username})",
        search_scope=SUBTREE,
        attributes=["memberOf", "displayName"]
    )

    grupos = []
    nome_completo = username
    if conn.entries:
        entrada = conn.entries[0]
        grupos = entrada.memberOf.values if "memberOf" in entrada else []
        nome_completo = str(entrada.displayName) if "displayName" in entrada else username

    return {
        "sucesso": True,
        "username": username,
        "nome_completo": nome_completo,
        "grupos": grupos
    }

def consultar_usuario(samaccountname: str):
    """
    Consulta informações de um usuário no AD (sem autenticar como ele).
    Usa a mesma conexão LDAPS, mas faz bind com uma conta de serviço/admin.
    Retorna dict com dados do usuário, ou None se não encontrado.
    """
    tls_config = Tls(validate=ssl.CERT_NONE)
    server = Server(AD_SERVER, port=636, use_ssl=True, tls=tls_config, get_info=ALL)

    admin_user = os.getenv("AD_BIND_USER")
    admin_password = os.getenv("AD_BIND_PASSWORD")

    conn = Connection(server, user=admin_user, password=admin_password)
    if not conn.bind():
        print(f"ERRO LDAP (consulta): {conn.result}")
        return None

    base_dn = ",".join([f"DC={p}" for p in AD_DOMAIN.split(".")])
    conn.search(
        search_base=base_dn,
        search_filter=f"(sAMAccountName={samaccountname})",
        search_scope=SUBTREE,
        attributes=["displayName", "lockoutTime", "lastLogon", "memberOf", "userAccountControl"]
    )

    if not conn.entries:
        return None

    entrada = conn.entries[0]
    bloqueado = False
    if "lockoutTime" in entrada and str(entrada.lockoutTime) not in ("0", ""):
        bloqueado = True

    return {
        "username": samaccountname,
        "nome_completo": str(entrada.displayName) if "displayName" in entrada else samaccountname,
        "bloqueado": bloqueado,
        "grupos": entrada.memberOf.values if "memberOf" in entrada else []
    }