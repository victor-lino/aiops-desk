import { useState } from "react";
import api from "../api";

export default function Diagnostico() {
  const [descricao, setDescricao] = useState("");
  const [resultado, setResultado] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setResultado(null);
    setCarregando(true);
    try {
      const resp = await api.post("/diagnostico", null, { params: { descricao } });
      setResultado(resp.data.diagnostico);
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
          <p className="mono" style={{ fontSize: 12, color: "var(--accent)", marginBottom: 12 }}>
            RESULTADO DA ANÁLISE
          </p>
          <pre style={{
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
            fontSize: 14,
            lineHeight: 1.6,
            margin: 0,
          }}>
            {resultado}
          </pre>
        </div>
      )}
    </div>
  );
}