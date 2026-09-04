from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class TicketCreate(BaseModel):
    categoria: str
    sistema_afetado: str
    descricao: str
    usuario_email: EmailStr
    usuario_nome: Optional[str] = None


class TicketOut(BaseModel):
    id: UUID
    origem: str
    status: str
    categoria: Optional[str] = None
    sistema_afetado: Optional[str] = None
    descricao: str
    causa_provavel: Optional[str] = None
    impacto: Optional[str] = None
    sugestao_ia: Optional[str] = None
    sugestao_tecnica: Optional[str] = None
    prioridade_ia: Optional[str] = None
    prioridade_atual: Optional[str] = None
    criado_em: datetime
    resolvido_em: Optional[datetime] = None
    analista_responsavel: Optional[str] = None

    class Config:
        from_attributes = True


class PrioridadeUpdate(BaseModel):
    prioridade_atual: str