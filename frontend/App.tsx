import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./src/pages/Login";
import Dashboard from "./src/pages/Dashboard";
import Diagnostico from "./src/pages/Diagnostico";
import Chamados from "./src/pages/Chamados";
import Zabbix from "./src/pages/Zabbix";
import AdUsuario from "./src/pages/AdUsuario";
import AbrirChamadoPublico from "./src/pages/AbrirChamadoPublico";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* pública, sem login */}
        <Route path="/abrir-chamado" element={<AbrirChamadoPublico />} />

        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="diagnostico" />} />
          <Route path="diagnostico" element={<Diagnostico />} />
          <Route path="chamados" element={<Chamados />} />
          <Route path="zabbix" element={<Zabbix />} />
          <Route path="ad" element={<AdUsuario />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}