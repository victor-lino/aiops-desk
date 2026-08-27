import { useEffect, useState } from "react";
import api from "../api";

interface Chamado {
  id: number;
  origem: string;
  descricao: string;
  diagnostico: string;
  criado_em: string;
}

export default function Chamados() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [expandido, setExpandido] = useState<number | null>(null);

  useEffect(() => {
    api.get("/chamados").then((resp) => {
      setChamados(resp.data.reverse());
      setCarregando(false);
    });
  }, []);

  const badgeCor: Record<string, string> = {
    manual: "var(--text-dim)",
    zabbix: "var(--warn)",
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Histórico de chamados</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 24 }}>
        Diagnósticos gerados, manuais e via Zabbix.
      </p>

      {carregando && <p className="mono" style={{ color: "var(--text-dim)" }}>Carregando...</p>}
      {!carregando && chamados.length === 0 && (
        <p style={{ color: "var(--text-dim)" }}>Nenhum chamado registrado ainda.</p>
      )}

      {chamados.map((c) => (
        <div
          key={c.id}
          className="card"
          style={{ marginBottom: 12, cursor: "pointer" }}
          onClick={() => setExpandido(expandido === c.id ? null : c.id)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span className="mono" style={{
                fontSize: 11,
                color: badgeCor[c.origem] || "var(--text-dim)",
                border: "1px solid var(--border)",
                borderRadius: 3,
                padding: "2px 6px",
                marginRight: 10,
              }}>
                {c.origem.toUpperCase()}
              </span>
              <span style={{ fontSize: 14 }}>{c.descricao}</span>
            </div>
            <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>
              {new Date(c.criado_em).toLocaleString("pt-BR")}
            </span>
          </div>

          {expandido === c.id && (
            <pre style={{
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              fontSize: 13,
              lineHeight: 1.6,
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
              color: "var(--text-dim)",
            }}>
              {c.diagnostico}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}