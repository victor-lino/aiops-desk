import asyncio
from database import SessionLocal
from models import Ticket, OrigemTicket, StatusTicket
from ai_service import sugerir_resolucao
from tickets import _aplicar_resultado_ia
import zabbix_service

INTERVALO_SEGUNDOS = 300  # 5 minutos


async def checar_zabbix_periodicamente():
    while True:
        try:
            _processar_problemas_zabbix()
        except Exception as e:
            print(f"[poller] erro ao checar Zabbix: {e}")
        await asyncio.sleep(INTERVALO_SEGUNDOS)


def _processar_problemas_zabbix():
    db = SessionLocal()
    try:
        problemas = zabbix_service.get_active_problems()
        for problema in problemas:
            eventid = problema.get("eventid")
            if not eventid:
                continue

            ja_existe = db.query(Ticket).filter(Ticket.zabbix_eventid == eventid).first()
            if ja_existe:
                continue

            resultado = sugerir_resolucao(
                descricao=problema["name"],
                sistema_afetado=problema.get("host", ""),
                origem="zabbix",
                contexto=str(problema),
            )

            if not resultado.get("ia_disponivel", True):
                print(f"[poller] IA indisponível para eventid {eventid}, tentando de novo no próximo ciclo")
                continue

            ticket = Ticket(
                origem=OrigemTicket.zabbix,
                descricao=problema["name"],
                contexto_zabbix=problema,
                zabbix_eventid=eventid,
                status=StatusTicket.novo,
            )
            db.add(ticket)
            db.commit()
            db.refresh(ticket)

            _aplicar_resultado_ia(ticket, resultado)
            ticket.status = StatusTicket.aguardando_analista
            db.commit()

            print(f"[poller] novo ticket criado para eventid {eventid}: {problema['name']}")
    finally:
        db.close()