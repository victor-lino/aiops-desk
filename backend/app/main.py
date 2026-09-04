# main.py
import asyncio
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
import models, ai_service, zabbix_service, ldap_service, auth_service, schemas
import tickets, webhooks, poller

Base.metadata.create_all(bind=engine)
app = FastAPI(title="AIOps Desk")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


class LoginRequest(BaseModel):
    username: str
    password: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verificar_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = auth_service.validar_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    return payload


@app.on_event("startup")
async def iniciar_background_tasks():
    asyncio.create_task(poller.checar_zabbix_periodicamente())


@app.post("/login")
def login(dados: LoginRequest):
    resultado = ldap_service.autenticar_usuario(dados.username, dados.password)
    if not resultado:
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")
    token = auth_service.criar_token(resultado["username"], resultado["grupos"])
    return {"access_token": token, "token_type": "bearer", "nome": resultado["nome_completo"]}


@app.post("/diagnostico")
def criar_diagnostico(descricao: str, usuario: dict = Depends(verificar_token)):
    resultado = ai_service.diagnosticar(descricao=descricao)
    return {
        "causa_provavel": resultado.get("causa_provavel"),
        "impacto": resultado.get("impacto"),
        "sugestao_ia": resultado.get("sugestao_resolucao"),
        "prioridade_atual": None,
    }


@app.get("/zabbix/problemas")
def problemas_ativos(usuario: dict = Depends(verificar_token)):
    return zabbix_service.get_active_problems()


@app.post("/zabbix/diagnosticar/{eventid}")
def diagnosticar_problema(eventid: str, usuario: dict = Depends(verificar_token)):
    problemas = zabbix_service.get_active_problems()
    problema = next((p for p in problemas if p["eventid"] == eventid), None)
    if not problema:
        raise HTTPException(status_code=404, detail="Problema não encontrado")

    resultado = ai_service.diagnosticar(
        descricao=problema["name"],
        contexto=str(problema),
    )
    return {
        "causa_provavel": resultado.get("causa_provavel"),
        "impacto": resultado.get("impacto"),
        "sugestao_ia": resultado.get("sugestao_resolucao"),
        "prioridade_atual": None,
    }


@app.get("/ad/usuario/{username}")
def consultar_usuario_ad(username: str, usuario: dict = Depends(verificar_token)):
    return ldap_service.buscar_usuario(username)


app.include_router(tickets.router)
app.include_router(webhooks.router)