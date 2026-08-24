import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def diagnosticar(descricao: str, contexto: str = "") -> str:
    prompt = (
        "Você é um analista de suporte de TI sênior. Dado um problema relatado "
        "(e um contexto técnico opcional), sugira causa provável, passos de "
        "diagnóstico e uma ação recomendada. Seja objetivo.\n\n"
        f"Problema: {descricao}\n\nContexto:\n{contexto}"
    )
    resp = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )
    return resp.text