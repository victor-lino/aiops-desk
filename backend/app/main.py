# main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
import models, ai_service, zabbix_service, ldap_service, auth_service

Base.metadata.create_all(bind=engine)
app = FastAPI(title="AIOps Desk")

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


@app.post("/login")
def login(dados: LoginRequest):
    resultado = ldap_service.autenticar_usuario(dados.username, dados.password)
    if not resultado:
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")
    token = auth_service.criar_token(resultado["username"], resultado["grupos"])
    return {"access_token": token, "token_type": "bearer", "nome": resultado["nome_completo"]}


@app.post("/diagnostico")
def criar_diagnostico(descricao: str, db: Session = Depends(get_db), usuario: dict = Depends(verificar_token)):
    resultado = ai_service.diagnosticar(descricao)
    chamado = models.Chamado(descricao=descricao, diagnostico=resultado)
    db.add(chamado)
    db.commit()
    db.refresh(chamado)
    return chamado


@app.get("/chamados")
def listar_chamados(db: Session = Depends(get_db), usuario: dict = Depends(verificar_token)):
    return db.query(models.Chamado).all()


@app.get("/zabbix/problemas")
def problemas_ativos(usuario: dict = Depends(verificar_token)):
    return zabbix_service.get_active_problems()


@app.post("/zabbix/diagnosticar/{eventid}")
def diagnosticar_problema(eventid: str, db: Session = Depends(get_db), usuario: dict = Depends(verificar_token)):
    problemas = zabbix_service.get_active_problems()
    problema = next((p for p in problemas if p["eventid"] == eventid), None)
    if not problema:
        return {"erro": "problema não encontrado"}
    resultado = ai_service.diagnosticar(problema["name"], contexto=str(problema))
    chamado = models.Chamado(origem="zabbix", descricao=problema["name"], diagnostico=resultado)
    db.add(chamado)
    db.commit()
    db.refresh(chamado)
    return chamado


@app.get("/ad/usuario/{samaccountname}")
def usuario_ad(samaccountname: str, usuario: dict = Depends(verificar_token)):
    resultado = ldap_service.consultar_usuario(samaccountname)
    if not resultado:
        return {"erro": "usuário não encontrado"}
    return resultado