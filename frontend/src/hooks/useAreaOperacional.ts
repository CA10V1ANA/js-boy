import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function useAreaOperacional() {
  const { usuario } = useAuth();
  const { pathname } = useLocation();
  return (
    usuario?.perfil === "ENTREGADOR" ||
    usuario?.perfil === "FUNCIONARIO" ||
    pathname.startsWith("/operacional") ||
    ["/minhas-entregas", "/meu-faturamento", "/meu-perfil"].includes(pathname)
  );
}
