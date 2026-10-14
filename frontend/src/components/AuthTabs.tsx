import { Link } from "react-router-dom";

type AuthTab = "login" | "cadastro";

export function AuthTabs({ active }: { active: AuthTab }) {
  return (
    <nav className="clientTabs" aria-label="Acesso à conta">
      <Link
        className={active === "login" ? "active" : undefined}
        to="/login"
        aria-current={active === "login" ? "page" : undefined}
      >
        Entrar
      </Link>
      <Link
        className={active === "cadastro" ? "active" : undefined}
        to="/cadastro"
        aria-label="Criar conta como cliente"
        aria-current={active === "cadastro" ? "page" : undefined}
      >
        Criar conta
      </Link>
    </nav>
  );
}
