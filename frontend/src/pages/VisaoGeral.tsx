import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

interface Ticket {
  id: string;
  origem: string;
  status: string;
  categoria: string | null;
  sistema_afetado: string | null;
  descricao: string;
  sugestao_ia: string | null;
  prioridade_ia: string | null;
  prioridade_atual: string | null;
  criado_em: string;
  resolvido_em: string | null;
  analista_responsavel: string | null;
}

const SLA_MINUTOS_CRITICA = 30;

function ehHoje(dataIso: string): boolean {
  const d = new Date(dataIso);
  const hoje = new Date();
  return (
    d.getFullYear() === hoje.getFullYear() &&
    d.getMonth() === hoje.getMonth() &&
    d.getDate() === hoje.getDate()
  );
}

function minutosAberto(t: Ticket): number {
  return (Date.now() - new Date(t.criado_em).getTime()) / 60000;
}

function StatCard({ label, valor, cor }: { label: string; valor: number; cor?: string }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 160 }}>
      <p className="mono" style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>
        {label.toUpperCase()}
      </p>
      <p style={{ fontSize: 32, fontWeight: 600, color: cor || "var(--text)", margin: 0 }}>
        {valor}
      </p>
    </div>
  );
}

export default function VisaoGeral() {
  const [ativos, setAtivos] = useState<Ticket[]>([]);
  const [historico, setHistorico] = useState<Ticket[]>([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setCarregando(true);
    Promise.all([api.get("/tickets"), api.get("/tickets/historico")]).then(
      ([respAtivos, respHistorico]) => {
        setAtivos(respAtivos.data);
        setHistorico(respHistorico.data);
        setCarregando(false);
      }
    );
  }, []);

  const abertos = ativos.filter((t) => t.status !== "resolvido").length;

  const emAtendimento = ativos.filter(
    (t) => t.analista_responsavel && t.status !== "resolvido" && t.status !== "escalado"
  ).length;

  const criticosSemDono = ativos.filter(
    (t) =>
      t.prioridade_atual === "critica" &&
      !t.analista_responsavel &&
      t.status !== "resolvido" &&
      t.status !== "escalado"
  );

  const slaEstourados = criticosSemDono.filter((t) => minutosAberto(t) > SLA_MINUTOS_CRITICA);

  const resolvidosHoje = [...ativos, ...historico].filter(
    (t) => t.status === "resolvido" && t.resolvido_em && ehHoje(t.resolvido_em)
  ).length;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Visão Geral</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 24 }}>
        Panorama dos tickets abertos hoje.
      </p>

      {carregando && <p className="mono" style={{ color: "var(--text-dim)" }}>Carregando...</p>}

      {!carregando && (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
            <StatCard label="Abertos" valor={abertos} />
            <StatCard label="Em atendimento" valor={emAtendimento} cor="var(--accent)" />
            <StatCard
              label="Críticos sem responsável"
              valor={criticosSemDono.length}
              cor={criticosSemDono.length > 0 ? "var(--crit)" : undefined}
            />
            <StatCard label="Resolvidos hoje" valor={resolvidosHoje} cor="var(--text-dim)" />
          </div>

          {criticosSemDono.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 14, marginBottom: 12 }}>
                <strong>{criticosSemDono.length}</strong> ticket(s) crítico(s) aguardando atribuição
                {slaEstourados.length > 0 && (
                  <span style={{ color: "var(--crit)" }}>
                    {" "}
                    - {slaEstourados.length} já com SLA estourado
                  </span>
                )}
              </p>

              {criticosSemDono.map((t) => {
                const estourado = minutosAberto(t) > SLA_MINUTOS_CRITICA;
                return (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {estourado && (
                        <span className="mono" style={{ fontSize: 11, color: "var(--crit)" }}>
                          ⚠
                        </span>
                      )}
                      <span style={{ fontSize: 14 }}>{t.sistema_afetado || t.categoria || "—"}</span>
                    </div>
                    <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>
                      {new Date(t.criado_em).toLocaleString("pt-BR")}
                    </span>
                  </div>
                );
              })}

              <button
                className="btn"
                style={{ marginTop: 16 }}
                onClick={() => navigate("/dashboard/tickets")}
              >
                Ver em Tickets
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}