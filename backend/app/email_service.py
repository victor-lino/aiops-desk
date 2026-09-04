import os
import smtplib
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


def enviar_email_sugestao(ticket) -> None:
    link_resolvido = f"{BASE_URL}/tickets/{ticket.id}/resolver?token={ticket.token_resolucao}&status=resolvido"
    link_nao_resolvido = f"{BASE_URL}/tickets/{ticket.id}/resolver?token={ticket.token_resolucao}&status=nao_resolvido"

    saudacao = f"Olá, {ticket.usuario_nome}," if ticket.usuario_nome else "Olá,"

    bloco_causa_texto = f"\nCausa provável:\n{ticket.causa_provavel}\n" if ticket.causa_provavel else ""
    bloco_impacto_texto = f"\nImpacto:\n{ticket.impacto}\n" if ticket.impacto else ""

    corpo_texto = f"""{saudacao}

Recebemos seu chamado sobre: {ticket.sistema_afetado}
{bloco_causa_texto}{bloco_impacto_texto}
Sugestão de resolução:
{ticket.sugestao_ia}

Se essa sugestão resolveu seu problema, acesse:
{link_resolvido}

Se não resolveu e você precisa de suporte humano, acesse:
{link_nao_resolvido}

Equipe de TI
"""

    bloco_causa_html = f"""
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1f1f24; border-left:3px solid #3f3f46; border-radius:6px; margin-bottom:16px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="color:#a1a1aa; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin:0 0 8px 0;">
                      Causa Provável
                    </p>
                    <p style="color:#e4e4e7; font-size:14px; line-height:1.6; margin:0;">
                      {ticket.causa_provavel}
                    </p>
                  </td>
                </tr>
              </table>
    """ if ticket.causa_provavel else ""

    bloco_impacto_html = f"""
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1f1f24; border-left:3px solid #f59e0b; border-radius:6px; margin-bottom:16px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="color:#fcd34d; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin:0 0 8px 0;">
                      Impacto
                    </p>
                    <p style="color:#e4e4e7; font-size:14px; line-height:1.6; margin:0;">
                      {ticket.impacto}
                    </p>
                  </td>
                </tr>
              </table>
    """ if ticket.impacto else ""

    corpo_html = f"""\
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#0d0d0f; font-family:Segoe UI, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d0f; padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#17171b; border-radius:12px; overflow:hidden; border:1px solid #2a2a30;">

          <tr>
            <td style="background-color:#7c3aed; padding:20px 32px;">
              <span style="color:#ffffff; font-size:18px; font-weight:700; letter-spacing:0.5px;">AIOPS DESK</span>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <p style="color:#e4e4e7; font-size:15px; margin:0 0 16px 0;">{saudacao}</p>
              <p style="color:#a1a1aa; font-size:14px; margin:0 0 24px 0;">
                Recebemos seu chamado sobre: <strong style="color:#e4e4e7;">{ticket.sistema_afetado}</strong>
              </p>

              {bloco_causa_html}
              {bloco_impacto_html}

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1f1f24; border-left:3px solid #7c3aed; border-radius:6px; margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="color:#c4b5fd; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin:0 0 8px 0;">
                      Sugestão de Resolução
                    </p>
                    <p style="color:#e4e4e7; font-size:14px; line-height:1.6; margin:0;">
                      {ticket.sugestao_ia}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color:#a1a1aa; font-size:13px; margin:0 0 16px 0;">
                A sugestão acima resolveu seu problema?
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;">
                    <a href="{link_resolvido}" style="display:inline-block; background-color:#16a34a; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:12px 24px; border-radius:8px;">
                      ✓ Sim, resolveu
                    </a>
                  </td>
                  <td>
                    <a href="{link_nao_resolvido}" style="display:inline-block; background-color:#3f3f46; color:#e4e4e7; text-decoration:none; font-size:14px; font-weight:600; padding:12px 24px; border-radius:8px;">
                      Não, preciso de ajuda
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px; border-top:1px solid #2a2a30;">
              <p style="color:#71717a; font-size:12px; margin:0;">
                Equipe de TI · AIOps Desk
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_USER
    msg["To"] = ticket.usuario_email
    msg["Subject"] = f"Sugestão para seu chamado: {ticket.sistema_afetado}"
    msg.attach(MIMEText(corpo_texto, "plain", "utf-8"))
    msg.attach(MIMEText(corpo_html, "html", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as servidor:
        servidor.starttls()
        servidor.login(SMTP_USER, SMTP_PASSWORD)
        servidor.send_message(msg)