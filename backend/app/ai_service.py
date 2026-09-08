import json
import logging
import os
import re
import time
from google import genai
from google.genai.errors import ClientError, ServerError

logger = logging.getLogger(__name__)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MAX_TENTATIVAS = 3
ESPERA_BASE_SEGUNDOS = 2

# --- circuit breaker de cota do Gemini -------------------------------------
_gemini_bloqueado_ate = 0.0
COOLDOWN_PADRAO_SEGUNDOS = 60  # usado se não conseguirmos extrair o retryDelay do erro
MARGEM_EXTRA_SEGUNDOS = 5


class GeminiIndisponivelError(Exception):
    """Levantado quando o Gemini está em cooldown por cota estourada (sem nem tentar a API)."""
    pass


def _gemini_disponivel() -> bool:
    return time.time() >= _gemini_bloqueado_ate


def _eh_erro_de_cota(erro: Exception) -> bool:
    texto = str(erro)
    return "RESOURCE_EXHAUSTED" in texto or "429" in texto


def _registrar_cooldown(mensagem_erro: str):
    global _gemini_bloqueado_ate

    match = re.search(r"retryDelay['\"]?:\s*['\"](\d+)s", mensagem_erro)
    delay = int(match.group(1)) if match else COOLDOWN_PADRAO_SEGUNDOS

    _gemini_bloqueado_ate = time.time() + delay + MARGEM_EXTRA_SEGUNDOS
    logger.warning(
        "Gemini em cooldown por %ds (cota estourada). Chamadas serão puladas até lá.",
        delay + MARGEM_EXTRA_SEGUNDOS
    )


# -----------------------------------------------------------------------------


def _chamar_gemini_com_retry(prompt: str, contexto_log: str = ""):
    if not _gemini_disponivel():
        restante = max(int(_gemini_bloqueado_ate - time.time()), 0)
        logger.info(
            "%s: Gemini em cooldown por mais %ds (cota estourada), pulando chamada.",
            contexto_log, restante
        )
        raise GeminiIndisponivelError("Gemini em cooldown por cota estourada")

    ultima_excecao = None

    for tentativa in range(1, MAX_TENTATIVAS + 1):
        try:
            return client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt
            )
        except ServerError as e:
            ultima_excecao = e
            if tentativa < MAX_TENTATIVAS:
                espera = ESPERA_BASE_SEGUNDOS * (2 ** (tentativa - 1))
                logger.warning(
                    "%s: tentativa %d/%d falhou com ServerError (%s). Retentando em %ds...",
                    contexto_log, tentativa, MAX_TENTATIVAS, e, espera
                )
                time.sleep(espera)
            else:
                logger.warning(
                    "%s: todas as %d tentativas falharam com ServerError. Último erro: %s",
                    contexto_log, MAX_TENTATIVAS, e
                )
        except ClientError as e:
            if _eh_erro_de_cota(e):
                _registrar_cooldown(str(e))
            raise

    raise ultima_excecao


def diagnosticar(descricao: str, contexto: str = "") -> dict:
    prompt = (
        "Você é um analista de suporte técnico de TI (nível analista, não usuário final). "
        "Com base no problema relatado abaixo, gere um diagnóstico técnico detalhado.\n\n"
        "Responda APENAS com um JSON válido, sem markdown, sem crases, no formato exato:\n"
        '{"causa_provavel": "parágrafo explicando as causas mais prováveis do problema", '
        '"impacto": "parágrafo explicando o impacto do problema para o usuário ou para o negócio", '
        '"sugestao_resolucao": "parágrafo com os passos técnicos recomendados para diagnosticar e resolver o problema"}\n\n'
        f"Problema relatado: {descricao}\n"
        f"Contexto adicional: {contexto}"
    )

    try:
        resp = _chamar_gemini_com_retry(prompt, contexto_log="diagnosticar()")
    except (ClientError, ServerError, GeminiIndisponivelError) as e:
        logger.warning("diagnosticar(): falha ao chamar a API do Gemini: %s", e)
        return {
            "causa_provavel": None,
            "impacto": None,
            "sugestao_resolucao": None,
            "ia_disponivel": False,
            "resposta_valida": False,
            "erro_ia": str(e),
        }

    texto = resp.text.strip()
    texto = texto.replace("```json", "").replace("```", "").strip()

    try:
        dados = json.loads(texto)
    except json.JSONDecodeError:
        logger.warning(
            "diagnosticar(): IA retornou resposta fora do formato JSON esperado. Resposta bruta (500 chars): %s",
            texto[:500]
        )
        dados = {
            "causa_provavel": texto,
            "impacto": "",
            "sugestao_resolucao": "",
        }

    dados["ia_disponivel"] = True
    return dados


def sugerir_resolucao(descricao: str, categoria: str = "", sistema_afetado: str = "", origem: str = "usuario", contexto: str = "") -> dict:
    prompt = (
        "Você é um analista de suporte de TI. Com base no problema relatado abaixo, "
        "gere uma análise estruturada e classifique a prioridade do chamado.\n\n"
        "Regras para avaliar o IMPACTO:\n"
        "- Se o sistema afetado for infraestrutura compartilhada (servidor, rede, VPN corporativa, "
        "Active Directory, storage, firewall, DNS, DHCP, monitoramento, ou algo que afeta múltiplos "
        "usuários/setores), descreva o impacto ORGANIZACIONAL: quantas pessoas ou processos de "
        "negócio podem ser afetados.\n"
        "- Se o sistema afetado for algo individual (notebook, Outlook, Excel, impressora pessoal), "
        "descreva o impacto INDIVIDUAL: como isso afeta apenas aquele usuário e sua produtividade.\n\n"
        "Regras para definir a PRIORIDADE (a prioridade DEVE ser coerente com o impacto descrito "
        "— nunca escreva um impacto organizacional grave e depois classifique como baixa/média):\n"
        "- CRÍTICA: impacto organizacional + serviço/sistema totalmente indisponível agora "
        "(ex: firewall comprometido, AD fora do ar, backup corrompido/indisponível, rede caiu, "
        "storage compartilhado inacessível).\n"
        "- ALTA: impacto organizacional mas com degradação parcial, contorno temporário disponível, "
        "ou risco iminente ainda não concretizado (ex: monitoramento com falhas parciais, DHCP "
        "instável mas ainda distribuindo IPs).\n"
        "- MÉDIA: impacto individual mas que afeta produtividade de forma relevante, ou impacto "
        "organizacional de baixa urgência (sem prazo apertado, workaround simples existe).\n"
        "- BAIXA: impacto individual, incômodo mas não bloqueia o trabalho, ou pedido informativo/"
        "cosmético.\n\n"
        "Você deve gerar DUAS sugestões de resolução distintas, para públicos diferentes:\n"
        "1. sugestao_usuario: simples, para o USUÁRIO FINAL tentar sozinho, sem jargão técnico, "
        "em linguagem acessível (é isso que vai por e-mail para quem abriu o chamado).\n"
        "2. sugestao_tecnica: para o ANALISTA DE TI que vai atender o chamado no painel interno. "
        "Pode e deve usar termos técnicos, comandos, nomes de serviços/portas/logs, passos de "
        "diagnóstico e a ação corretiva recomendada — como se fosse um runbook curto.\n\n"
        "Responda APENAS com um JSON válido, sem markdown, sem crases, no formato exato:\n"
        '{"causa_provavel": "parágrafo explicando a causa mais provável do problema", '
        '"impacto": "parágrafo avaliando o impacto (organizacional ou individual, conforme o caso)", '
        '"sugestao_usuario": "texto simples em português para o usuário final tentar sozinho", '
        '"sugestao_tecnica": "texto técnico em português, tipo runbook, para o analista de TI", '
        '"prioridade": "baixa|media|alta|critica", '
        '"justificativa_prioridade": "uma frase curta explicando por que essa prioridade é coerente com o impacto descrito"}\n\n'
        f"Origem do chamado: {origem}\n"
        f"Categoria: {categoria}\n"
        f"Sistema afetado: {sistema_afetado}\n"
        f"Problema relatado: {descricao}\n"
        f"Contexto adicional: {contexto}"
    )

    try:
        resp = _chamar_gemini_com_retry(prompt, contexto_log="sugerir_resolucao()")
    except (ClientError, ServerError, GeminiIndisponivelError) as e:
        logger.warning("sugerir_resolucao(): falha ao chamar a API do Gemini: %s", e)
        return {
            "causa_provavel": None,
            "impacto": None,
            "sugestao_usuario": None,
            "sugestao_tecnica": None,
            "prioridade": "media",
            "justificativa_prioridade": "IA indisponível no momento.",
            "ia_disponivel": False,
            "resposta_valida": False,
            "erro_ia": str(e),
        }

    texto = resp.text.strip()
    texto = texto.replace("```json", "").replace("```", "").strip()

    try:
        dados = json.loads(texto)
        dados["resposta_valida"] = True
    except json.JSONDecodeError:
        logger.warning(
            "sugerir_resolucao(): IA respondeu, mas fora do formato JSON esperado. Resposta bruta (500 chars): %s",
            texto[:500]
        )
        dados = {
            "causa_provavel": "",
            "impacto": "",
            "sugestao_usuario": texto,
            "sugestao_tecnica": "",
            "prioridade": "media",
            "justificativa_prioridade": "Não foi possível classificar automaticamente.",
            "resposta_valida": False,
        }

    dados["ia_disponivel"] = True
    return dados