import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Diagnostico from "./pages/Diagnostico";
import Historico from "./pages/Historico";
import Tickets from "./pages/Tickets";
import NovoTicket from "./pages/NovoTicket";
import Zabbix from "./pages/Zabbix";
import AdUsuario from "./pages/AdUsuario";
import VisaoGeral from "./pages/VisaoGeral";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/abrir-ticket" element={<NovoTicket />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="visao-geral" />} />
          <Route path="visao-geral" element={<VisaoGeral />} />
          <Route path="diagnostico" element={<Diagnostico />} />
          <Route path="historico" element={<Historico />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="zabbix" element={<Zabbix />} />
          <Route path="ad" element={<AdUsuario />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}