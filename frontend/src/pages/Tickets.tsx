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
  sugestao_tecnica: string | null;
  prioridade_ia: string | null;
  prioridade_atual: string | null;
  criado_em: string;
  resolvido_em: string | null;
  analista_responsavel: string | null;
}

// Classe .pill-* a usar para cada origem
const origemPill: Record<string, string> = {
  usuario: "pill-neutral",
  zabbix: "pill-warn",
};

const statusLabel: Record<string, string> = {
  novo: "Novo",
  aguardando_usuario: "Aguardando usuário",
  aguardando_analista: "Aguardando analista",
  resolvido: "Resolvido",
  escalado: "Escalado",
};

// Classe .pill-* a usar para cada status
const statusPill: Record<string, string> = {
  novo: "pill-new",
  aguardando_usuario: "pill-warn",
  aguardando_analista: "pill-warn",
  resolvido: "pill-neutral",
  escalado: "pill-crit",
};

// Classe .pill-* a usar para cada prioridade
const prioridadePill: Record<string, string> = {
  baixa: "pill-neutral",
  media: "pill-new",
  alta: "pill-warn",
  critica: "pill-crit",
};

const SLA_MINUTOS_CRITICA = 30;
const TICKET_TRAVADO_MINUTOS = 2;

const selectStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 4,
  border: "1px solid var(--border)",
  background: "var(--panel)",
  color: "var(--text-dim)",
};

function exibirStatus(t: Ticket): { label: string; pill: string } {
  if (t.analista_responsavel && t.status !== "resolvido" && t.status !== "escalado") {
    return { label: "Em atendimento", pill: "pill-ok" };
  }
  return {
    label: statusLabel[t.status] || t.status,
    pill: statusPill[t.status] || "pill-neutral",
  };
}

function estourouSla(t: Ticket): boolean {
  if (t.prioridade_atual !== "critica") return false;
  if (t.analista_responsavel) return false;
  if (t.status === "resolvido" || t.status === "escalado") return false;
  const minutosAberto = (Date.now() - new Date(t.criado_em).getTime()) / 60000;
  return minutosAberto > SLA_MINUTOS_CRITICA;
}

function ticketTravado(t: Ticket): boolean {
  if (t.status !== "novo") return false;
  const minutosAberto = (Date.now() - new Date(t.criado_em).getTime()) / 60000;
  return minutosAberto > TICKET_TRAVADO_MINUTOS;
}

function titulo(t: Ticket): string {
  if (t.sistema_afetado) return t.sistema_afetado;
  if (t.categoria) return t.categoria;
  if (t.descricao) return t.descricao.length > 60 ? t.descricao.slice(0, 60) + "…" : t.descricao;
  return "—";
}

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [filtroDono, setFiltroDono] = useState<"todos" | "meus">("todos");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroOrigem, setFiltroOrigem] = useState("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("todos");
  const [, setTick] = useState(0);

  const usuarioAtual = localStorage.getItem("username") || "";

  function carregar() {
    setCarregando(true);
    api
      .get("/tickets")
      .then((resp) => {
        setTickets(resp.data.reverse());
        setCarregando(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar tickets:", err);
        setCarregando(false);
      });
  }

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    const intervalo = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(intervalo);
  }, []);

  async function alterarPrioridade(id: string, novaPrioridade: string) {
    setAtualizando(id);
    try {
      await api.patch(`/tickets/${id}/prioridade`, { prioridade_atual: novaPrioridade });
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, prioridade_atual: novaPrioridade } : t))
      );
    } finally {
      setAtualizando(null);
    }
  }

  async function resolverTicket(id: string) {
    setAtualizando(id);
    try {
      const resp = await api.patch(`/tickets/${id}/resolver`);
      setTickets((prev) => prev.map((t) => (t.id === id ? resp.data : t)));
    } finally {
      setAtualizando(null);
    }
  }

  async function reabrirTicket(id: string) {
    setAtualizando(id);
    try {
      const resp = await api.patch(`/tickets/${id}/reabrir`);
      setTickets((prev) => prev.map((t) => (t.id === id ? resp.data : t)));
    } finally {
      setAtualizando(null);
    }
  }

  async function atribuirTicket(id: string) {
    setAtualizando(id);
    try {
      const resp = await api.patch(`/tickets/${id}/atribuir`);
      setTickets((prev) => prev.map((t) => (t.id === id ? resp.data : t)));
    } finally {
      setAtualizando(null);
    }
  }

  async function desatribuirTicket(id: string) {
    setAtualizando(id);
    try {
      const resp = await api.patch(`/tickets/${id}/desatribuir`);
      setTickets((prev) => prev.map((t) => (t.id === id ? resp.data : t)));
    } finally {
      setAtualizando(null);
    }
  }

  async function reprocessarTicket(id: string) {
    setAtualizando(id);
    try {
      const resp = await api.post(`/tickets/${id}/reprocessar`);
      setTickets((prev) => prev.map((t) => (t.id === id ? resp.data : t)));
    } finally {
      setAtualizando(null);
    }
  }

  const ticketsFiltrados = tickets.filter((t) => {
    if (filtroDono === "meus" && t.analista_responsavel !== usuarioAtual) return false;
    if (filtroStatus !== "todos" && t.status !== filtroStatus) return false;
    if (filtroOrigem !== "todos" && t.origem !== filtroOrigem) return false;
    if (filtroPrioridade !== "todos" && t.prioridade_atual !== filtroPrioridade) return false;
    if (busca.trim()) {
      const alvo = `${t.descricao} ${t.sistema_afetado || ""} ${t.categoria || ""}`.toLowerCase();
      if (!alvo.includes(busca.trim().toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: 820 }}>
      <style>{`
        @keyframes pulseSla {
          0%, 100% { background-color: rgba(194, 59, 59, 0.06); }
          50% { background-color: rgba(194, 59, 59, 0.14); }
        }
      `}</style>

      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Tickets</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 16 }}>
        Chamados abertos por usuários e gerados via Zabbix.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          className="mono"
          onClick={() => setFiltroDono("todos")}
          style={{
            fontSize: 12,
            padding: "6px 12px",
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: filtroDono === "todos" ? "var(--panel)" : "transparent",
            color: filtroDono === "todos" ? "var(--text)" : "var(--text-dim)",
            cursor: "pointer",
          }}
        >
          Todos
        </button>
        <button
          className="mono"
          onClick={() => setFiltroDono("meus")}
          style={{
            fontSize: 12,
            padding: "6px 12px",
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: filtroDono === "meus" ? "var(--panel)" : "transparent",
            color: filtroDono === "meus" ? "var(--text)" : "var(--text-dim)",
            cursor: "pointer",
          }}
        >
          Meus tickets
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por descrição, sistema ou categoria..."
          style={{
            flex: "1 1 240px",
            fontSize: 13,
            padding: "6px 10px",
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "var(--panel)",
            color: "var(--text)",
          }}
        />
        <select className="mono" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={selectStyle}>
          <option value="todos">Todos os status</option>
          <option value="novo">Novo</option>
          <option value="aguardando_usuario">Aguardando usuário</option>
          <option value="aguardando_analista">Aguardando analista</option>
          <option value="resolvido">Resolvido</option>
          <option value="escalado">Escalado</option>
        </select>
        <select className="mono" value={filtroOrigem} onChange={(e) => setFiltroOrigem(e.target.value)} style={selectStyle}>
          <option value="todos">Todas as origens</option>
          <option value="usuario">Usuário</option>
          <option value="zabbix">Zabbix</option>
        </select>
        <select className="mono" value={filtroPrioridade} onChange={(e) => setFiltroPrioridade(e.target.value)} style={selectStyle}>
          <option value="todos">Todas as prioridades</option>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </div>

      {carregando && <p className="mono" style={{ color: "var(--text-dim)" }}>Carregando...</p>}

      {!carregando && tickets.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <p style={{ fontSize: 16, marginBottom: 8 }}>🎉 Parabéns, você não tem nenhum ticket!</p>
          <p style={{ fontSize: 14, color: "var(--text-dim)" }}>
            Aproveite para criar documentações, revisar documentações, discutir soluções etc ;)
          </p>
        </div>
      )}

      {!carregando && tickets.length > 0 && ticketsFiltrados.length === 0 && (
        <p style={{ color: "var(--text-dim)" }}>Nenhum ticket encontrado com esses filtros.</p>
      )}

      {ticketsFiltrados.map((t) => {
        const status = exibirStatus(t);
        const emSla = estourouSla(t);
        const travado = ticketTravado(t);
        return (
          <div
            key={t.id}
            className="card"
            style={{
              marginBottom: 12,
              border: emSla ? "1px solid var(--crit)" : undefined,
              animation: emSla ? "pulseSla 2s infinite" : undefined,
            }}
          >
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              onClick={() => setExpandido(expandido === t.id ? null : t.id)}
            >
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                {emSla && (
                  <span className="pill pill-crit">⚠ SLA ESTOURADO</span>
                )}
                {travado && (
                  <span className="pill pill-warn">⏳ SEM RESPOSTA DA IA</span>
                )}
                <span className={`pill ${origemPill[t.origem] || "pill-neutral"}`}>
                  {t.origem.toUpperCase()}
                </span>
                <span className={`pill ${status.pill}`}>{status.label}</span>
                {t.prioridade_atual && (
                  <span className={`pill ${prioridadePill[t.prioridade_atual] || "pill-neutral"}`}>
                    {t.prioridade_atual.toUpperCase()}
                  </span>
                )}
                {t.analista_responsavel && (
                  <span className="pill pill-ok">👤 {t.analista_responsavel}</span>
                )}
                <span style={{ fontSize: 14 }}>{titulo(t)}</span>
              </div>
              <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>
                {new Date(t.criado_em).toLocaleString("pt-BR")}
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
                    <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 4 }}>Causa provável</p>
                    <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{t.causa_provavel}</p>
                  </>
                )}

                {t.impacto && (
                  <>
                    <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 4 }}>Impacto</p>
                    <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{t.impacto}</p>
                  </>
                )}

                {t.sugestao_tecnica && (
                  <>
                    <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 4 }}>Sugestão técnica (analista)</p>
                    <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16, whiteSpace: "pre-wrap" }}>{t.sugestao_tecnica}</p>
                  </>
                )}

                {travado && (
                  <p style={{ fontSize: 13, color: "var(--warn, #d97706)", marginBottom: 16 }}>
                    Este ticket está sem resposta da IA há mais de {TICKET_TRAVADO_MINUTOS} minutos - provavelmente o processamento foi interrompido (ex: reinício do servidor). Use "Reprocessar" abaixo.
                  </p>
                )}

                <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 6 }}>Prioridade</p>
                <select
                  className="mono"
                  value={t.prioridade_atual || ""}
                  disabled={atualizando === t.id}
                  onChange={(e) => alterarPrioridade(t.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontSize: 13,
                    padding: "6px 10px",
                    borderRadius: 4,
                    border: "1px solid var(--border)",
                    background: "var(--panel)",
                    color: "var(--text-dim)",
                    marginBottom: 16,
                  }}
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {travado && (
                    <button
                      className="btn"
                      disabled={atualizando === t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        reprocessarTicket(t.id);
                      }}
                    >
                      {atualizando === t.id ? "Reprocessando..." : "🔄 Reprocessar"}
                    </button>
                  )}

                  {t.analista_responsavel ? (
                    <button
                      className="btn"
                      disabled={atualizando === t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        desatribuirTicket(t.id);
                      }}
                    >
                      {atualizando === t.id ? "Aguarde..." : "Remover atribuição"}
                    </button>
                  ) : (
                    <button
                      className="btn"
                      disabled={atualizando === t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        atribuirTicket(t.id);
                      }}
                    >
                      {atualizando === t.id ? "Atribuindo..." : "Atribuir a mim"}
                    </button>
                  )}

                  {t.status !== "resolvido" && (
                    <button
                      className="btn"
                      disabled={atualizando === t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        resolverTicket(t.id);
                      }}
                    >
                      {atualizando === t.id ? "Aguarde..." : "Marcar como resolvido"}
                    </button>
                  )}

                  {t.status === "resolvido" && (
                    <button
                      className="btn"
                      disabled={atualizando === t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        reabrirTicket(t.id);
                      }}
                    >
                      {atualizando === t.id ? "Reabrindo..." : "Reabrir ticket"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}