import { message, useLocale } from '../i18n';
import { Link } from "react-router-dom";

type AuthTab = "login" | "cadastro";

export function AuthTabs({ active }: { active: AuthTab }) {
  useLocale();
  return (
    <nav className="clientTabs" aria-label={message("autenticacao.abas.acesso.a.conta")}>
      <Link
        className={active === "login" ? "active" : undefined}
        to="/login"
        aria-current={active === "login" ? "page" : undefined}
      >
        {message("autenticacao.abas.entrar")} </Link>
      <Link
        className={active === "cadastro" ? "active" : undefined}
        to="/cadastro"
        aria-label={message("autenticacao.abas.criar.conta.como.cliente")}
        aria-current={active === "cadastro" ? "page" : undefined}
      >
        {message("autenticacao.abas.criar.conta")} </Link>
    </nav>
  );
}
