import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timedelta

from database import get_db
from models import Ticket, OrigemTicket, StatusTicket, PrioridadeTicket
from schemas import TicketCreate, TicketOut, PrioridadeUpdate
from ai_service import sugerir_resolucao
from email_service import enviar_email_sugestao
from auth_service import obter_usuario_atual  # seu esquema JWT já existente

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tickets", tags=["tickets"])


def _aplicar_resultado_ia(ticket: Ticket, resultado: dict) -> bool:
    """Preenche o ticket com o resultado da IA. Retorna True se o resultado é
    confiável o suficiente pra seguir o fluxo normal (inclusive e-mail pro
    usuário), ou False se caiu em algum fallback (cota estourada, erro de
    rede, JSON malformado etc) e o ticket deve ir direto pra um analista."""
    if not resultado.get("ia_disponivel", True):
        ticket.causa_provavel = None
        ticket.impacto = None
        ticket.sugestao_ia = "IA indisponível no momento. Um analista vai analisar o chamado manualmente."
        ticket.sugestao_tecnica = None
        ticket.prioridade_ia = None
        ticket.prioridade_atual = ticket.prioridade_atual or PrioridadeTicket.media
        return False

    if not resultado.get("resposta_valida", True):
        # a IA respondeu, mas fora do formato esperado — não confiamos o
        # suficiente pra mandar isso por e-mail pro usuário final
        ticket.causa_provavel = resultado.get("causa_provavel") or None
        ticket.impacto = resultado.get("impacto") or None
        ticket.sugestao_ia = "A IA gerou uma resposta em formato inesperado. Um analista vai revisar o chamado."
        ticket.sugestao_tecnica = resultado.get("sugestao_usuario")  # guarda o texto bruto pro analista ver
        ticket.prioridade_ia = PrioridadeTicket(resultado.get("prioridade", "media"))
        ticket.prioridade_atual = ticket.prioridade_ia
        return False

    ticket.causa_provavel = resultado.get("causa_provavel")
    ticket.impacto = resultado.get("impacto")
    ticket.sugestao_ia = resultado["sugestao_usuario"]
    ticket.sugestao_tecnica = resultado.get("sugestao_tecnica")
    ticket.prioridade_ia = PrioridadeTicket(resultado["prioridade"])
    ticket.prioridade_atual = ticket.prioridade_ia
    return True


def _processar_ia_e_email(ticket_id: UUID, db: Session):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return

    try:
        resultado = sugerir_resolucao(
            descricao=ticket.descricao,
            categoria=ticket.categoria or "",
            sistema_afetado=ticket.sistema_afetado or "",
            origem=ticket.origem.value,
            contexto=ticket.contexto_zabbix or ""
        )

        ia_ok = _aplicar_resultado_ia(ticket, resultado)

        if not ia_ok:
            ticket.status = StatusTicket.aguardando_analista
            db.commit()
            return

        # decide por e-mail com base na existência do endereço, não mais pela origem —
        # assim tickets criados sem e-mail (ex: diagnóstico manual) não tentam enviar
        if ticket.usuario_email:
            ticket.status = StatusTicket.aguardando_usuario
            db.commit()
            db.refresh(ticket)
            enviar_email_sugestao(ticket)
        else:
            ticket.status = StatusTicket.aguardando_analista
            db.commit()

    except Exception:
        # rede neural de segurança: qualquer falha inesperada (KeyError, erro
        # de envio de e-mail, bug futuro etc) cai aqui em vez de travar o
        # ticket silenciosamente. Loga o traceback completo e empurra o
        # ticket pra um analista com uma nota visível.
        logger.exception("Falha inesperada ao processar ticket %s via IA/e-mail", ticket_id)
        try:
            db.rollback()
            ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
            if ticket:
                ticket.status = StatusTicket.aguardando_analista
                ticket.sugestao_ia = (
                    ticket.sugestao_ia
                    or "Falha ao processar este chamado automaticamente. Requer atenção manual."
                )
                db.commit()
        except Exception:
            logger.exception("Falha até ao tentar recuperar o ticket %s após erro", ticket_id)


@router.post("", response_model=TicketOut)
def criar_ticket(dados: TicketCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # trava de idempotência: se já existe um ticket idêntico (mesma descrição +
    # mesmo e-mail) criado nos últimos 3 minutos, devolve ele em vez de duplicar
    limite = datetime.now() - timedelta(minutes=3)
    duplicado = (
        db.query(Ticket)
        .filter(
            Ticket.usuario_email == dados.usuario_email,
            Ticket.descricao == dados.descricao,
            Ticket.criado_em >= limite,
        )
        .order_by(Ticket.criado_em.desc())
        .first()
    )
    if duplicado:
        return duplicado

    ticket = Ticket(
        origem=OrigemTicket.usuario,
        categoria=dados.categoria,
        sistema_afetado=dados.sistema_afetado,
        descricao=dados.descricao,
        usuario_email=dados.usuario_email,
        usuario_nome=dados.usuario_nome,
        status=StatusTicket.novo,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    background_tasks.add_task(_processar_ia_e_email, ticket.id, db)
    return ticket


@router.post("/{ticket_id}/reprocessar", response_model=TicketOut)
def reprocessar_ticket(
    ticket_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    usuario=Depends(obter_usuario_atual),
):
    """Reprocessa um ticket que ficou travado (ex: servidor reiniciou no meio
    do processamento original). Reseta os campos de IA e dispara o
    processamento de novo em background, com o mesmo tratamento de erro e
    retry do fluxo normal de criação."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")

    ticket.causa_provavel = None
    ticket.impacto = None
    ticket.sugestao_ia = None
    ticket.sugestao_tecnica = None
    ticket.prioridade_ia = None
    ticket.status = StatusTicket.novo
    db.commit()
    db.refresh(ticket)

    background_tasks.add_task(_processar_ia_e_email, ticket.id, db)
    return ticket


@router.get("", response_model=list[TicketOut])
def listar_tickets(db: Session = Depends(get_db), usuario=Depends(obter_usuario_atual)):
    limite = datetime.now() - timedelta(minutes=10)
    return (
        db.query(Ticket)
        .filter(
            (Ticket.status != StatusTicket.resolvido)
            | (Ticket.resolvido_em.is_(None))
            | (Ticket.resolvido_em > limite)
        )
        .order_by(Ticket.criado_em.desc())
        .all()
    )


@router.get("/historico", response_model=list[TicketOut])
def listar_historico(db: Session = Depends(get_db), usuario=Depends(obter_usuario_atual)):
    limite = datetime.now() - timedelta(minutes=10)
    return (
        db.query(Ticket)
        .filter(
            Ticket.status == StatusTicket.resolvido,
            Ticket.resolvido_em.isnot(None),
            Ticket.resolvido_em <= limite,
        )
        .order_by(Ticket.resolvido_em.desc())
        .all()
    )


@router.patch("/{ticket_id}/prioridade", response_model=TicketOut)
def atualizar_prioridade(ticket_id: UUID, dados: PrioridadeUpdate, db: Session = Depends(get_db), usuario=Depends(obter_usuario_atual)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    ticket.prioridade_atual = PrioridadeTicket(dados.prioridade_atual)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.patch("/{ticket_id}/reabrir", response_model=TicketOut)
def reabrir_ticket(ticket_id: UUID, db: Session = Depends(get_db), usuario=Depends(obter_usuario_atual)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    if ticket.status != StatusTicket.resolvido:
        raise HTTPException(status_code=400, detail="Só é possível reabrir um ticket resolvido")
    ticket.status = StatusTicket.aguardando_analista
    ticket.resolvido_em = None
    db.commit()
    db.refresh(ticket)
    return ticket


@router.patch("/{ticket_id}/resolver", response_model=TicketOut)
def marcar_resolvido(ticket_id: UUID, db: Session = Depends(get_db), usuario=Depends(obter_usuario_atual)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    if ticket.status == StatusTicket.resolvido:
        raise HTTPException(status_code=400, detail="Ticket já está resolvido")
    ticket.status = StatusTicket.resolvido
    ticket.resolvido_em = datetime.now()
    db.commit()
    db.refresh(ticket)
    return ticket


@router.patch("/{ticket_id}/atribuir", response_model=TicketOut)
def atribuir_ticket(ticket_id: UUID, db: Session = Depends(get_db), usuario=Depends(obter_usuario_atual)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    ticket.analista_responsavel = usuario.get("sub")
    db.commit()
    db.refresh(ticket)
    return ticket


@router.patch("/{ticket_id}/desatribuir", response_model=TicketOut)
def desatribuir_ticket(ticket_id: UUID, db: Session = Depends(get_db), usuario=Depends(obter_usuario_atual)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    ticket.analista_responsavel = None
    db.commit()
    db.refresh(ticket)
    return ticket


from fastapi.responses import HTMLResponse


def _pagina_resposta(titulo: str, mensagem: str, cor_icone: str, icone: str) -> str:
    return f"""\
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo}</title>
</head>
<body style="margin:0; padding:0; background-color:#0d0d0f; font-family:Segoe UI, Arial, sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh;">
  <div style="background-color:#17171b; border:1px solid #2a2a30; border-radius:12px; padding:48px 40px; max-width:420px; width:90%; text-align:center;">
    <div style="width:64px; height:64px; background-color:{cor_icone}; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 24px auto; font-size:28px;">
      {icone}
    </div>
    <h1 style="color:#e4e4e7; font-size:20px; margin:0 0 12px 0;">{titulo}</h1>
    <p style="color:#a1a1aa; font-size:14px; line-height:1.6; margin:0;">{mensagem}</p>
    <p style="color:#71717a; font-size:12px; margin:32px 0 0 0;">AIOps Desk</p>
  </div>
</body>
</html>
"""


@router.get("/{ticket_id}/resolver", response_class=HTMLResponse)
def resolver_ticket(ticket_id: UUID, token: UUID, status: str, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket or ticket.token_resolucao != token:
        return HTMLResponse(
            _pagina_resposta("Link inválido", "Este link não é válido ou já expirou.", "#dc2626", "✕"),
            status_code=404
        )

    if status == "resolvido":
        ticket.status = StatusTicket.resolvido
        ticket.resolvido_em = datetime.now()
        db.commit()
        return HTMLResponse(
            _pagina_resposta("Obrigado!", "Que bom que conseguimos ajudar. Seu ticket foi encerrado com sucesso.", "#16a34a", "✓")
        )
    elif status == "nao_resolvido":
        ticket.status = StatusTicket.aguardando_analista
        db.commit()
        return HTMLResponse(
            _pagina_resposta("Entendido", "Um analista vai continuar seu atendimento em breve.", "#7c3aed", "👤")
        )
    else:
        return HTMLResponse(
            _pagina_resposta("Status inválido", "Não foi possível processar essa solicitação.", "#dc2626", "✕"),
            status_code=400
        )