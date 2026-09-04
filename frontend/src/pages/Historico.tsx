import { useEffect, useState } from "react";
import api from "../api";

interface Ticket {
  id: string;
  origem: string;
  status: string;
  categoria: string | null;
  sistema_afetado: string | null;
  descricao: string;
  causa_provavel: string | null;
  impacto: string | null;
  sugestao_ia: string | null;
  prioridade_ia: string | null;
  prioridade_atual: string | null;
  criado_em: string;
  resolvido_em: string | null;
  analista_responsavel: string | null;
}

const origemCor: Record<string, string> = {
  usuario: "var(--text-dim)",
  zabbix: "var(--warn)",
};

const prioridadeCor: Record<string, string> = {
  baixa: "var(--text-dim)",
  media: "var(--accent)",
  alta: "var(--warn)",
  critica: "var(--crit)",
};

function titulo(t: Ticket): string {
  if (t.sistema_afetado) return t.sistema_afetado;
  if (t.categoria) return t.categoria;
  if (t.descricao) return t.descricao.length > 60 ? t.descricao.slice(0, 60) + "…" : t.descricao;
  return "—";
}

export default function Historico() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [reabrindo, setReabrindo] = useState<string | null>(null);

  function carregar() {
    setCarregando(true);
    api.get("/tickets/historico").then((resp) => {
      setTickets(resp.data);
      setCarregando(false);
    });
  }

  useEffect(() => {
    carregar();
  }, []);

  async function reabrirTicket(id: string) {
    setReabrindo(id);
    try {
      await api.patch(`/tickets/${id}/reabrir`);
      setTickets((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setReabrindo(null);
    }
  }

  return (
    <div style={{ maxWidth: 820 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Histórico</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 24 }}>
        Tickets já resolvidos há mais de 10 minutos.
      </p>

      {carregando && <p className="mono" style={{ color: "var(--text-dim)" }}>Carregando...</p>}
      {!carregando && tickets.length === 0 && (
        <p style={{ color: "var(--text-dim)" }}>Nenhum ticket no histórico ainda.</p>
      )}

      {tickets.map((t) => (
        <div key={t.id} className="card" style={{ marginBottom: 12 }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            onClick={() => setExpandido(expandido === t.id ? null : t.id)}
          >
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span className="mono" style={{
                fontSize: 11,
                color: origemCor[t.origem] || "var(--text-dim)",
                border: "1px solid var(--border)",
                borderRadius: 3,
                padding: "2px 6px",
              }}>
                {t.origem.toUpperCase()}
              </span>
              <span className="mono" style={{
                fontSize: 11,
                color: "var(--text-dim)",
                border: "1px solid var(--border)",
                borderRadius: 3,
                padding: "2px 6px",
              }}>
                RESOLVIDO
              </span>
              {t.prioridade_atual && (
                <span className="mono" style={{
                  fontSize: 11,
                  color: prioridadeCor[t.prioridade_atual] || "var(--text-dim)",
                  border: "1px solid var(--border)",
                  borderRadius: 3,
                  padding: "2px 6px",
                }}>
                  {t.prioridade_atual.toUpperCase()}
                </span>
              )}
              {t.analista_responsavel && (
                <span className="mono" style={{
                  fontSize: 11,
                  color: "var(--accent)",
                  border: "1px solid var(--border)",
                  borderRadius: 3,
                  padding: "2px 6px",
                }}>
                  👤 {t.analista_responsavel}
                </span>
              )}
              <span style={{ fontSize: 14 }}>{titulo(t)}</span>
            </div>
            <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>
              {t.resolvido_em ? new Date(t.resolvido_em).toLocaleString("pt-BR") : "—"}
            </span>
          </div>

          {expandido === t.id && (
            <div style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
            }}>
              <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 4 }}>Descrição</p>
              <p style={{ fontSize: 14, marginBottom: 16 }}>{t.descricao}</p>

              {t.causa_provavel && (
                <>
                  <p className="mono" style={{ fontSize: 11, color: "var(--accent)", marginBottom: 4 }}>
                    CAUSA PROVÁVEL
                  </p>
                  <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{t.causa_provavel}</p>
                </>
              )}

              {t.impacto && (
                <>
                  <p className="mono" style={{ fontSize: 11, color: "var(--warn)", marginBottom: 4 }}>
                    IMPACTO
                  </p>
                  <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{t.impacto}</p>
                </>
              )}

              {t.sugestao_ia && (
                <>
                  <p className="mono" style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 4 }}>
                    SUGESTÃO DE RESOLUÇÃO
                  </p>
                  <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{t.sugestao_ia}</p>
                </>
              )}

              <p className="mono" style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 16 }}>
                Aberto em: {new Date(t.criado_em).toLocaleString("pt-BR")}
              </p>

              <button
                className="btn"
                disabled={reabrindo === t.id}
                onClick={(e) => {
                  e.stopPropagation();
                  reabrirTicket(t.id);
                }}
              >
                {reabrindo === t.id ? "Reabrindo..." : "Reabrir ticket"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}