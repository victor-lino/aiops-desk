import os
import requests

ZABBIX_URL = os.getenv("ZABBIX_URL", "http://192.168.244.128/zabbix/api_jsonrpc.php")
ZABBIX_TOKEN = os.getenv("ZABBIX_TOKEN")
print(f"TOKEN CARREGADO: {ZABBIX_TOKEN}")

def _headers():
    return {
        "Authorization": f"Bearer {ZABBIX_TOKEN}",
        "Content-Type": "application/json"
    }

def get_active_problems():
    body = {
        "jsonrpc": "2.0",
        "method": "problem.get",
        "params": {
            "output": "extend",
            "sortfield": "eventid",
            "sortorder": "DESC"
        },
        "id": 1
    }
    resp = requests.post(ZABBIX_URL, headers=_headers(), json=body, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    if "error" in data:
        raise Exception(f"Erro Zabbix: {data['error']}")
    return data["result"]