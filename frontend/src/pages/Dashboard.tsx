import { Outlet, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logotipo-novo.png";

export default function Dashboard() {
  const navigate = useNavigate();

  function sair() {
    localStorage.removeItem("token");
    localStorage.removeItem("nome");
    navigate("/");
  }

  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: "block",
    padding: "10px 16px",
    borderRadius: 4,
    marginBottom: 4,
    fontSize: 14,
    textDecoration: "none",
    color: isActive ? "var(--text)" : "var(--text-dim)",
    background: isActive ? "var(--panel)" : "transparent",
    borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{
        width: 220,
        borderRight: "1px solid var(--border)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
      }}>
        <div style={{ marginBottom: 32 }}>
          <span className="pulse-dot" style={{ marginRight: 8 }} />
          <span className="mono" style={{ fontSize: 13, color: "var(--text-dim)" }}>
            AIOPS DESK
          </span>
        </div>

        <nav style={{ flex: 1 }}>
          <NavLink to="/dashboard/visao-geral" style={linkStyle}>Visão Geral</NavLink>
          <NavLink to="/dashboard/diagnostico" style={linkStyle}>Diagnóstico</NavLink>
          <NavLink to="/dashboard/historico" style={linkStyle}>Histórico</NavLink>
          <NavLink to="/dashboard/tickets" style={linkStyle}>Tickets</NavLink>
          <NavLink to="/abrir-ticket" style={linkStyle}>Abrir ticket</NavLink>
          <NavLink to="/dashboard/zabbix" style={linkStyle}>Alertas Zabbix</NavLink>
          <NavLink to="/dashboard/ad" style={linkStyle}>Consulta AD</NavLink>
        </nav>

        <div style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <img
            src={logo}
            alt="Santechso.us"
            style={{ width: 100, height: "auto", marginBottom: 12, display: "block" }}
          />
          <button onClick={sair} className="mono" style={{
            background: "none",
            border: "1px solid var(--border)",
            color: "var(--text-dim)",
            borderRadius: 4,
            padding: "6px 12px",
            fontSize: 12,
          }}>
            Sair
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 32 }}>
        <Outlet />
      </main>
    </div>
  );
}