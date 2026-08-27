import { useState } from "react";
import api from "../api";

interface Usuario {
  username: string;
  nome_completo: string;
  bloqueado: boolean;
  grupos: string[];
  erro?: string;
}

export default function AdUsuario() {
  const [busca, setBusca] = useState("");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setUsuario(null);
    try {
      const resp = await api.get(`/ad/usuario/${busca}`);
      setUsuario(resp.data);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Consulta de usuário — Active Directory</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 24 }}>
        Busque status e grupos de um usuário do domínio.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="samAccountName (ex: joao.silva)"
          required
        />
        <button className="btn" type="submit" disabled={carregando}>
          {carregando ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {usuario?.erro && <p style={{ color: "var(--crit)" }}>{usuario.erro}</p>}

      {usuario && !usuario.erro && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 18, margin: 0 }}>{usuario.nome_completo}</p>
              <p className="mono" style={{ fontSize: 13, color: "var(--text-dim)", margin: "4px 0 0" }}>
                {usuario.username}
              </p>
            </div>
            <span className="mono" style={{
              fontSize: 12,
              alignSelf: "flex-start",
              padding: "4px 10px",
              borderRadius: 3,
              color: usuario.bloqueado ? "var(--crit)" : "var(--ok)",
              border: `1px solid ${usuario.bloqueado ? "var(--crit)" : "var(--ok)"}`,
            }}>
              {usuario.bloqueado ? "BLOQUEADO" : "ATIVO"}
            </span>
          </div>

          <p className="mono" style={{ fontSize: 12, color: "var(--accent)", marginBottom: 8 }}>
            GRUPOS ({usuario.grupos.length})
          </p>
          {usuario.grupos.length === 0 && (
            <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Nenhum grupo encontrado.</p>
          )}
          {usuario.grupos.map((g, i) => (
            <p key={i} className="mono" style={{ fontSize: 12, color: "var(--text-dim)", margin: "2px 0" }}>
              {g.split(",")[0].replace("CN=", "")}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}