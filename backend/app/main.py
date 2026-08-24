from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
import models, ai_service

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