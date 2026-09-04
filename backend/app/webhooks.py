from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from fastapi import Depends

from database import get_db
from models import Ticket, OrigemTicket, StatusTicket
from tickets import _processar_ia_e_email
import os

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

ZABBIX_WEBHOOK_SECRET = os.getenv("ZABBIX_WEBHOOK_SECRET")


@router.post("/zabbix")
async def webhook_zabbix(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    x_webhook_secret: str = Header(None)
):
    if x_webhook_secret != ZABBIX_WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Não autorizado")

    payload = await request.json()

    ticket = Ticket(
        origem=OrigemTicket.zabbix,
        categoria="infraestrutura",
        sistema_afetado=payload.get("host", "desconhecido"),
        descricao=payload.get("problema", str(payload)),
        contexto_zabbix=payload,
        status=StatusTicket.novo,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    background_tasks.add_task(_processar_ia_e_email, ticket.id, db)
    return {"mensagem": "Ticket criado a partir do alerta Zabbix"}