import { useState } from "react";
import api from "../api";

interface ResultadoDiagnostico {
  causa_provavel: string | null;
  impacto: string | null;
  sugestao_ia: string | null;
  prioridade_atual: string | null;
}

const prioridadeCor: Record<string, string> = {
  baixa: "var(--text-dim)",
  media: "var(--accent)",
  alta: "var(--warn)",
  critica: "var(--crit)",
};

export default function Diagnostico() {
  const [descricao, setDescricao] = useState("");
  const [resultado, setResultado] = useState<ResultadoDiagnostico | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setResultado(null);
    setCarregando(true);
    try {
      const resp = await api.post("/diagnostico", null, { params: { descricao } });
      setResultado(resp.data);
    } catch {
      setErro("Não foi possível gerar o diagnóstico.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Diagnóstico</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 24 }}>
        Descreva o problema relatado e receba uma análise gerada por IA.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: usuário não consegue acessar a internet"
          rows={4}
          required
        />
        <button className="btn" type="submit" style={{ marginTop: 12 }} disabled={carregando}>
          {carregando ? "Analisando..." : "Gerar diagnóstico"}
        </button>
      </form>

      {erro && <p style={{ color: "var(--crit)" }}>{erro}</p>}

      {resultado && (
        <div className="card">
          {resultado.prioridade_atual && (
            <span className="mono" style={{
              fontSize: 11,
              color: prioridadeCor[resultado.prioridade_atual] || "var(--text-dim)",
              border: "1px solid var(--border)",
              borderRadius: 3,
              padding: "2px 6px",
              marginBottom: 16,
              display: "inline-block",
            }}>
              PRIORIDADE {resultado.prioridade_atual.toUpperCase()}
            </span>
          )}

          {resultado.causa_provavel && (
            <>
              <p className="mono" style={{ fontSize: 11, color: "var(--accent)", marginBottom: 4 }}>
                CAUSA PROVÁVEL
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                {resultado.causa_provavel}
              </p>
            </>
          )}

          {resultado.impacto && (
            <>
              <p className="mono" style={{ fontSize: 11, color: "var(--warn)", marginBottom: 4 }}>
                IMPACTO
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                {resultado.impacto}
              </p>
            </>
          )}

          {resultado.sugestao_ia && (
            <>
              <p className="mono" style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 4 }}>
                SUGESTÃO DE RESOLUÇÃO
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                {resultado.sugestao_ia}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}