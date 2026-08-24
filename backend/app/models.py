from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class Chamado(Base):
    __tablename__ = "chamados"
    id = Column(Integer, primary_key=True)
    origem = Column(String, default="manual")
    descricao = Column(String)
    diagnostico = Column(String)
    criado_em = Column(DateTime, default=datetime.utcnow)