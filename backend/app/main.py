from dotenv import load_dotenv 
load_dotenv()
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
import models, ai_service, zabbix_service

Base.metadata.create_all(bind=engine)
app = FastAPI(title="AIOps Desk")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/diagnostico")
def criar_diagnostico(descricao: str, db: Session = Depends(get_db)):
    resultado = ai_service.diagnosticar(descricao)
    chamado = models.Chamado(descricao=descricao, diagnostico=resultado)
    db.add(chamado)
    db.commit()
    db.refresh(chamado)
    return chamado

@app.get("/chamados")
def listar_chamados(db: Session = Depends(get_db)):
    return db.query(models.Chamado).all()

@app.get("/zabbix/problemas")
def problemas_ativos():
    return zabbix_service.get_active_problems()

@app.post("/zabbix/diagnosticar/{eventid}")
def diagnosticar_problema(eventid: str, db: Session = Depends(get_db)):
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