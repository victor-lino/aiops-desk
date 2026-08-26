# auth_service.py
import jwt
import os
from datetime import datetime, timedelta

SECRET_KEY = os.getenv("JWT_SECRET", "troque-essa-chave-no-env")
ALGORITHM = "HS256"
EXPIRA_EM_HORAS = 8

def criar_token(username: str, grupos: list):
    payload = {
        "sub": username,
        "grupos": grupos,
        "exp": datetime.utcnow() + timedelta(hours=EXPIRA_EM_HORAS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def validar_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None