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

    conn.unbind()
    return {
        "sucesso": True,
        "username": username,
        "nome_completo": nome_completo,
        "grupos": grupos
    }


def buscar_usuario(username: str):
    """
    Busca status e grupos de um usuário no AD, usando a conta de serviço (aiopsdesk).
    """
    tls_config = Tls(validate=ssl.CERT_NONE)
    server = Server(AD_SERVER, port=636, use_ssl=True, tls=tls_config, get_info=ALL)
    service_dn = f"aiopsdesk@{AD_DOMAIN}"
    service_password = os.getenv("AD_SERVICE_PASSWORD")

    conn = Connection(server, user=service_dn, password=service_password)
    if not conn.bind():
        print(f"ERRO LDAP (buscar_usuario): {conn.result}")
        return {"erro": "Falha ao conectar no AD com a conta de serviço"}

    base_dn = ",".join([f"DC={p}" for p in AD_DOMAIN.split(".")])
    conn.search(
        search_base=base_dn,
        search_filter=f"(sAMAccountName={username})",
        search_scope=SUBTREE,
        attributes=["memberOf", "displayName", "userAccountControl"]
    )

    if not conn.entries:
        conn.unbind()
        return {"erro": "Usuário não encontrado"}

    entry = conn.entries[0]
    nome_completo = str(entry.displayName) if entry.displayName else username
    grupos = [str(g).split(",")[0].replace("CN=", "") for g in entry.memberOf] if entry.memberOf else []
    uac = int(str(entry.userAccountControl)) if entry.userAccountControl else 0
    bloqueado = bool(uac & 2)  # bit 2 = conta desabilitada

    conn.unbind()
    return {"username": username, "nome_completo": nome_completo, "bloqueado": bloqueado, "grupos": grupos}