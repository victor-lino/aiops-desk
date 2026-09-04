import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function NovoTicket() {
  const [categoria, setCategoria] = useState("");
  const [sistemaAfetado, setSistemaAfetado] = useState("");
  const [descricao, setDescricao] = useState("");
  const [usuarioNome, setUsuarioNome] = useState("");
  const [usuarioEmail, setUsuarioEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const logado = !!localStorage.getItem("token");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    setErro("");
    setSucesso(false);
    setEnviando(true);
    try {
      await api.post("/tickets", {
        categoria: categoria || null,
        sistema_afetado: sistemaAfetado || null,
        descricao,
        usuario_nome: usuarioNome || null,
        usuario_email: usuarioEmail || null,
      });
      setSucesso(true);
      setCategoria("");
      setSistemaAfetado("");
      setDescricao("");
      setUsuarioNome("");
      setUsuarioEmail("");
    } catch {
      setErro("Não foi possível abrir o chamado. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px", display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 620, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span className="mono" style={{ fontSize: 13, color: "var(--text-dim)" }}>
            AIOPS DESK
          </span>
          {logado && (
            <Link to="/dashboard" className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>
              ← Voltar ao painel
            </Link>
          )}
        </div>

        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Abrir ticket</h1>
        <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 24 }}>
          Descreva o problema para receber uma sugestão de resolução por e-mail. Não é necessário estar logado.
        </p>

        <form onSubmit={handleSubmit} className="card">
          <label style={{ fontSize: 13, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
            Seu nome
          </label>
          <input
            type="text"
            value={usuarioNome}
            onChange={(e) => setUsuarioNome(e.target.value)}
            placeholder="Ex: João Silva"
            style={{ width: "100%", marginBottom: 16 }}
          />

          <label style={{ fontSize: 13, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
            Seu e-mail
          </label>
          <input
            type="email"
            value={usuarioEmail}
            onChange={(e) => setUsuarioEmail(e.target.value)}
            placeholder="Ex: joao@empresa.com"
            required
            style={{ width: "100%", marginBottom: 16 }}
          />

          <label style={{ fontSize: 13, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
            Sistema afetado
          </label>
          <input
            type="text"
            value={sistemaAfetado}
            onChange={(e) => setSistemaAfetado(e.target.value)}
            placeholder="Ex: Outlook, Excel, VPN..."
            style={{ width: "100%", marginBottom: 16 }}
          />

          <label style={{ fontSize: 13, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
            Categoria
          </label>
          <input
            type="text"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Ex: rede, hardware, software..."
            style={{ width: "100%", marginBottom: 16 }}
          />

          <label style={{ fontSize: 13, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
            Descrição do problema
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva com o máximo de detalhes possível — quanto mais informação, mais precisa é a sugestão da IA."
            rows={5}
            required
            style={{ width: "100%" }}
          />

          <button className="btn" type="submit" style={{ marginTop: 16 }} disabled={enviando}>
            {enviando ? "Enviando..." : "Abrir ticket"}
          </button>
        </form>

        {erro && <p style={{ color: "var(--crit)", marginTop: 16 }}>{erro}</p>}
        {sucesso && (
          <p style={{ color: "var(--accent)", marginTop: 16 }}>
            Ticket aberto! Você vai receber a sugestão da IA por e-mail em instantes.
          </p>
        )}
      </div>
    </div>
  );
}