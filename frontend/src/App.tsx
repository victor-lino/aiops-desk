import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Diagnostico from "./pages/Diagnostico";
import Chamados from "./pages/Chamados";
import Zabbix from "./pages/Zabbix";
import AdUsuario from "./pages/AdUsuario";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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