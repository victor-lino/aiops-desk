import { useEffect, useState } from "react";
import api from "../api";

interface Problema {
  eventid: string;
  name: string;
  severity: string;
}

interface ResultadoDiagnostico {
  causa_provavel: string | null;
  impacto: string | null;
  sugestao_ia: string | null;
}

export default function Zabbix() {
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [diagnosticando, setDiagnosticando] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Record<string, ResultadoDiagnostico>>({});

  function carregar() {
    setCarregando(true);
    api.get("/zabbix/problemas").then((resp) => {
      setProblemas(resp.data);
      setCarregando(false);
    });
  }

  useEffect(() => {
    carregar();
  }, []);

  async function diagnosticar(eventid: string) {
    setDiagnosticando(eventid);
    try {
      const resp = await api.post(`/zabbix/diagnosticar/${eventid}`);
      setResultado((prev) => ({ ...prev, [eventid]: resp.data }));
    } finally {
      setDiagnosticando(null);
    }
  }

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Alertas ativos - Zabbix</h1>
        <button onClick={carregar} className="mono" style={{
          background: "none", border: "1px solid var(--border)", color: "var(--text-dim)",
          borderRadius: 4, padding: "6px 12px", fontSize: 12,
        }}>
          Atualizar
        </button>
      </div>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 24 }}>
        Problemas ativos monitorados via Zabbix.
      </p>

      {carregando && <p className="mono" style={{ color: "var(--text-dim)" }}>Carregando...</p>}
      {!carregando && problemas.length === 0 && (
        <p style={{ color: "var(--text-dim)" }}>Nenhum alerta ativo no momento.</p>
      )}

      {problemas.map((p) => (
        <div key={p.eventid} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 14 }}>{p.name}</span>
            <button
              className="btn"
              onClick={() => diagnosticar(p.eventid)}
              disabled={diagnosticando === p.eventid}
              style={{
                fontSize: 12,
                padding: "6px 12px",
                width: 160,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {diagnosticando === p.eventid ? "Analisando..." : "Diagnosticar com IA"}
            </button>
          </div>

          {resultado[p.eventid] && (
            <div style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
              fontSize: 13,
              lineHeight: 1.6,
              color: "var(--text-dim)",
            }}>
              {resultado[p.eventid].causa_provavel && (
                <>
                  <p className="mono" style={{ fontSize: 11, color: "var(--accent)", marginBottom: 4 }}>
                    CAUSA PROVÁVEL
                  </p>
                  <p style={{ marginBottom: 12 }}>{resultado[p.eventid].causa_provavel}</p>
                </>
              )}
              {resultado[p.eventid].impacto && (
                <>
                  <p className="mono" style={{ fontSize: 11, color: "var(--warn)", marginBottom: 4 }}>
                    IMPACTO
                  </p>
                  <p style={{ marginBottom: 12 }}>{resultado[p.eventid].impacto}</p>
                </>
              )}
              {resultado[p.eventid].sugestao_ia && (
                <>
                  <p className="mono" style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 4 }}>
                    SUGESTÃO DE RESOLUÇÃO
                  </p>
                  <p style={{ margin: 0 }}>{resultado[p.eventid].sugestao_ia}</p>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}