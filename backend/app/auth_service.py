# auth_service.py
import jwt
import os
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = os.getenv("JWT_SECRET", "troque-essa-chave-no-env")
ALGORITHM = "HS256"
EXPIRA_EM_HORAS = 8

security = HTTPBearer()

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

def obter_usuario_atual(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = validar_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload