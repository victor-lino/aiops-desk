import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const apiPublico = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
});

interface FormState {
  usuario_nome: string;
  usuario_email: string;
  sistema_afetado: string;
  categoria: string;
  descricao: string;
}

const estadoInicial: FormState = {
  usuario_nome: "",
  usuario_email: "",
  sistema_afetado: "",
  categoria: "",
  descricao: "",
};

export default function AbrirChamadoPublico() {
  const [form, setForm] = useState<FormState>(estadoInicial);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function atualizar(campo: keyof FormState, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!form.usuario_nome.trim() || !form.usuario_email.trim() || !form.descricao.trim()) {
      setErro("Preencha nome, e-mail e a descrição do problema.");
      return;
    }

    setEnviando(true);
    try {
      await apiPublico.post("/tickets", {
        usuario_nome: form.usuario_nome,
        usuario_email: form.usuario_email,
        sistema_afetado: form.sistema_afetado || null,
        categoria: form.categoria || null,
        descricao: form.descricao,
      });
      setEnviado(true);
      setForm(estadoInicial);
    } catch (err) {
      console.error("Erro ao abrir chamado:", err);
      setErro("Não foi possível enviar seu chamado agora. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div className="card" style={{ width: 420, textAlign: "center", padding: "40px 24px" }}>
          <p style={{ fontSize: 18, marginBottom: 8 }}>✅ Chamado enviado!</p>
          <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>
            Você vai receber um e-mail com uma sugestão de resolução em instantes.
            Se não resolver, um analista vai continuar seu atendimento.
          </p>
          <button className="btn" style={{ marginTop: 24 }} onClick={() => setEnviado(false)}>
            Abrir outro chamado
          </button>
          <p style={{ marginTop: 16, marginBottom: 0 }}>
            <Link to="/" style={{ color: "var(--accent)", fontSize: 13 }}>
              ← Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 16px",
    }}>
      <form onSubmit={enviar} className="card" style={{ width: 420 }}>
        <div style={{ marginBottom: 24 }}>
          <span className="pulse-dot" style={{ marginRight: 8 }} />
          <span className="mono" style={{ fontSize: 13, color: "var(--text-dim)" }}>
            AIOPS DESK
          </span>
        </div>

        <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Abrir chamado</h1>
        <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 24 }}>
          Descreva o problema para receber uma sugestão de resolução por e-mail. Não é necessário estar logado.
        </p>

        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Seu nome</label>
        <div style={{ marginTop: 6, marginBottom: 16 }}>
          <input
            value={form.usuario_nome}
            onChange={(e) => atualizar("usuario_nome", e.target.value)}
            placeholder="Ex: João Silva"
          />
        </div>

        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Seu e-mail</label>
        <div style={{ marginTop: 6, marginBottom: 16 }}>
          <input
            type="email"
            value={form.usuario_email}
            onChange={(e) => atualizar("usuario_email", e.target.value)}
            placeholder="Ex: joao@empresa.com"
          />
        </div>

        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Sistema afetado</label>
        <div style={{ marginTop: 6, marginBottom: 16 }}>
          <input
            value={form.sistema_afetado}
            onChange={(e) => atualizar("sistema_afetado", e.target.value)}
            placeholder="Ex: Outlook, Excel, VPN..."
          />
        </div>

        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Categoria</label>
        <div style={{ marginTop: 6, marginBottom: 16 }}>
          <input
            value={form.categoria}
            onChange={(e) => atualizar("categoria", e.target.value)}
            placeholder="Ex: rede, hardware, software..."
          />
        </div>

        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Descrição do problema</label>
        <div style={{ marginTop: 6, marginBottom: 20 }}>
          <textarea
            value={form.descricao}
            onChange={(e) => atualizar("descricao", e.target.value)}
            placeholder="Descreva com o máximo de detalhes possível — quanto mais informação, mais precisa é a sugestão da IA."
            rows={5}
            style={{
              width: "100%",
              resize: "vertical",
              fontFamily: "inherit",
              fontSize: 14,
              padding: "8px 10px",
              borderRadius: 4,
              border: "1px solid var(--border)",
              background: "var(--panel)",
              color: "var(--text)",
              boxSizing: "border-box",
            }}
          />
        </div>

        {erro && (
          <p style={{ color: "var(--crit)", fontSize: 13, marginTop: -8, marginBottom: 16 }}>
            {erro}
          </p>
        )}

        <button className="btn" type="submit" style={{ width: "100%" }} disabled={enviando}>
          {enviando ? "Enviando..." : "Abrir ticket"}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-dim)", marginTop: 16, marginBottom: 0 }}>
          É analista?{" "}
          <Link to="/" style={{ color: "var(--accent)" }}>
            Voltar ao login
          </Link>
        </p>
      </form>
    </div>
  );
}