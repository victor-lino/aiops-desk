import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const resp = await api.post("/login", { username, password });
      localStorage.setItem("token", resp.data.access_token);
      localStorage.setItem("nome", resp.data.nome);
      localStorage.setItem("username", resp.data.username);
      navigate("/dashboard");
    } catch {
      setErro("Usuário ou senha inválidos.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: 360 }}>
        <div style={{ marginBottom: 24 }}>
          <span className="pulse-dot" style={{ marginRight: 8 }} />
          <span className="mono" style={{ fontSize: 13, color: "var(--text-dim)" }}>
            AIOPS DESK
          </span>
        </div>
        <h1 style={{ fontSize: 20, margin: "0 0 24px" }}>Acessar console</h1>

        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Usuário do domínio</label>
        <div style={{ marginTop: 6, marginBottom: 16 }}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="usuario.sobrenome"
            required
          />
        </div>

        <label style={{ fontSize: 13, color: "var(--text-dim)" }}>Senha</label>
        <div style={{ marginTop: 6, marginBottom: 20 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {erro && (
          <p style={{ color: "var(--crit)", fontSize: 13, marginTop: -8, marginBottom: 16 }}>
            {erro}
          </p>
        )}

        <button className="btn" type="submit" style={{ width: "100%" }} disabled={carregando}>
          {carregando ? "Autenticando..." : "Entrar"}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-dim)", marginTop: 16, marginBottom: 0 }}>
          Não é analista?{" "}
          <Link to="/abrir-ticket" style={{ color: "var(--accent)" }}>
            Abrir chamado aqui
          </Link>
        </p>
      </form>
    </div>
  );
}