import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from database import Base


class OrigemTicket(str, enum.Enum):
    usuario = "usuario"
    zabbix = "zabbix"


class StatusTicket(str, enum.Enum):
    novo = "novo"
    aguardando_usuario = "aguardando_usuario"
    aguardando_analista = "aguardando_analista"
    resolvido = "resolvido"
    escalado = "escalado"


class PrioridadeTicket(str, enum.Enum):
    baixa = "baixa"
    media = "media"
    alta = "alta"
    critica = "critica"


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    origem = Column(Enum(OrigemTicket), nullable=False)
    criado_em = Column(DateTime, default=datetime.now)
    atualizado_em = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    categoria = Column(String(100), nullable=True)
    sistema_afetado = Column(String(200), nullable=True)
    descricao = Column(Text, nullable=False)
    contexto_zabbix = Column(JSONB, nullable=True)
    zabbix_eventid = Column(String(50), nullable=True)

    usuario_email = Column(String(200), nullable=True)
    usuario_nome = Column(String(200), nullable=True)

    causa_provavel = Column(Text, nullable=True)
    impacto = Column(Text, nullable=True)
    sugestao_ia = Column(Text, nullable=True)          # versão simples, enviada por e-mail ao usuário
    sugestao_tecnica = Column(Text, nullable=True)      # versão técnica, exibida no painel do analista
    prioridade_ia = Column(Enum(PrioridadeTicket), nullable=True)
    prioridade_atual = Column(Enum(PrioridadeTicket), nullable=True)

    status = Column(Enum(StatusTicket), default=StatusTicket.novo)
    token_resolucao = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True)
    resolvido_em = Column(DateTime, nullable=True)
    analista_responsavel = Column(String(200), nullable=True)