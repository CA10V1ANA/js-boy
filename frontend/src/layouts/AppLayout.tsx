import {
  Bell,
  HelpCircle,
  MessageCircle,
  BarChart3,
  Building2,
  CreditCard,
  FileClock,
  Home,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Landmark,
  Sun,
  Truck,
  User,
  UserCog,
  Users,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Package,
  MapPin,
} from "lucide-react";
import { api } from "../services/api";
import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAreaOperacional } from "../hooks/useAreaOperacional";
import { useAuth } from "../contexts/AuthContext";
import { normalizePerfil } from "../routes/roleHome";
import { PerfilAcesso } from "../types";

const items: Array<{
  to: string;
  label: string;
  icon: typeof Home;
  perfis: PerfilAcesso[];
}> = [
  {
    to: "/dashboard",
    label: "Visão geral",
    icon: Home,
    perfis: ["PROPRIETARIO"],
  },
  {
    to: "/conversas",
    label: "Conversas",
    icon: MessageCircle,
    perfis: ["PROPRIETARIO"],
  },
  {
    to: "/notificacoes",
    label: "Notificações",
    icon: Bell,
    perfis: ["PROPRIETARIO"],
  },
  { to: "/entregas", label: "Entregas", icon: Truck, perfis: ["PROPRIETARIO"] },
  {
    to: "/entregadores",
    label: "Entregadores",
    icon: User,
    perfis: ["PROPRIETARIO"],
  },
  { to: "/clientes", label: "Clientes", icon: Users, perfis: ["PROPRIETARIO"] },
  {
    to: "/pagamentos",
    label: "Pagamentos",
    icon: CreditCard,
    perfis: ["PROPRIETARIO"],
  },
  {
    to: "/relatorios",
    label: "Relatórios",
    icon: BarChart3,
    perfis: ["PROPRIETARIO"],
  },
  {
    to: "/auditoria",
    label: "Auditoria",
    icon: FileClock,
    perfis: ["PROPRIETARIO"],
  },
  {
    to: "/usuarios",
    label: "Usuários",
    icon: UserCog,
    perfis: ["PROPRIETARIO"],
  },
  {
    to: "/configuracoes/preco",
    label: "Preços",
    icon: Settings,
    perfis: ["PROPRIETARIO"],
  },
  {
    to: "/configuracoes/empresa",
    label: "Empresa",
    icon: Building2,
    perfis: ["PROPRIETARIO"],
  },
  {
    to: "/financeiro",
    label: "Razão financeira",
    icon: Landmark,
    perfis: ["PROPRIETARIO"],
  },
  {
    to: "/privacidade",
    label: "Privacidade",
    icon: ShieldCheck,
    perfis: ["PROPRIETARIO"],
  },
  {
    to: "/operacional",
    label: "Visão geral",
    icon: Home,
    perfis: ["ENTREGADOR", "FUNCIONARIO"],
  },
  {
    to: "/minhas-entregas",
    label: "Minhas entregas",
    icon: Truck,
    perfis: ["ENTREGADOR", "FUNCIONARIO"],
  },
  {
    to: "/conversas",
    label: "Conversas",
    icon: MessageCircle,
    perfis: ["ENTREGADOR", "FUNCIONARIO"],
  },
  {
    to: "/meu-faturamento",
    label: "Meu faturamento",
    icon: BarChart3,
    perfis: ["ENTREGADOR", "FUNCIONARIO"],
  },
  {
    to: "/notificacoes",
    label: "Notificações",
    icon: Bell,
    perfis: ["ENTREGADOR", "FUNCIONARIO"],
  },
  {
    to: "/meu-perfil",
    label: "Meu perfil",
    icon: User,
    perfis: ["ENTREGADOR", "FUNCIONARIO"],
  },
  { to: "/portal", label: "Visão geral", icon: Home, perfis: ["CLIENTE"] },
  {
    to: "/portal/entregas",
    label: "Minhas entregas",
    icon: Package,
    perfis: ["CLIENTE"],
  },
  {
    to: "/conversas",
    label: "Conversas",
    icon: MessageCircle,
    perfis: ["CLIENTE"],
  },
  {
    to: "/portal/enderecos",
    label: "Endereços e contatos",
    icon: MapPin,
    perfis: ["CLIENTE"],
  },
  {
    to: "/portal/pagamentos",
    label: "Pagamentos",
    icon: CreditCard,
    perfis: ["CLIENTE"],
  },
  {
    to: "/notificacoes",
    label: "Notificações",
    icon: Bell,
    perfis: ["CLIENTE"],
  },
  {
    to: "/portal/conta",
    label: "Minha conta",
    icon: User,
    perfis: ["CLIENTE"],
  },
];

function iniciais(nome?: string) {
  const partes = (nome || "").trim().split(/\s+/);
  return ((partes[0]?.[0] || "") + (partes[1]?.[0] || "")).toUpperCase();
}
function saudacao() {
  const hora = new Date().getHours();
  return hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
}
function profileLabel(perfil?: PerfilAcesso) {
  if (perfil === "PROPRIETARIO") return "Proprietário";
  if (perfil === "CLIENTE") return "Cliente";
  return "Entregador";
}

export function AppLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const operacional = useAreaOperacional();
  const roleShell = operacional || usuario?.perfil === "CLIENTE";
  const profileMenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (profileMenu.current) profileMenu.current.open = false;
  }, [location.pathname]);
  const perfilMenu = operacional ? "ENTREGADOR" : usuario?.perfil;
  const visibleItems = items
    .filter(
      (item) =>
        usuario &&
        item.perfis.map(normalizePerfil).includes(normalizePerfil(perfilMenu!)),
    )
    .map((item) => ({
      ...item,
      to:
        operacional &&
        usuario?.perfil === "PROPRIETARIO" &&
        ["/conversas", "/notificacoes"].includes(item.to)
          ? "/operacional" + item.to
          : item.to,
    }));
  const [counts, setCounts] = useState({ conversas: 0, notificacoes: 0 });
  useEffect(() => {
    let active = true;
    const base = operacional ? "/operacao-entregador" : "";
    async function refresh() {
      try {
        const [c, n] = await Promise.all([
          api.get<{ total: number }>(base + "/conversas/nao-lidas"),
          api.get<{ total: number }>(base + "/notificacoes/nao-lidas"),
        ]);
        if (active)
          setCounts({ conversas: c.data.total, notificacoes: n.data.total });
      } catch {
        if (active) setCounts({ conversas: 0, notificacoes: 0 });
      }
    }
    void refresh();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [operacional, location.pathname, location.search]);
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isCourierPortal = location.pathname === "/operacional";
  const isClientPortal = location.pathname.startsWith("/portal");
  const isClientOverview = location.pathname === "/portal";
  const canRequest =
    usuario?.perfil === "CLIENTE" &&
    ["/portal", "/portal/entregas"].includes(location.pathname);
  const accountPath = operacional
    ? "/meu-perfil"
    : usuario?.perfil === "CLIENTE"
      ? "/portal/conta"
      : "/usuarios";
  const noticesPath = operacional
    ? "/operacional/notificacoes"
    : "/notificacoes";
  const current = visibleItems.find((item) => location.pathname === item.to);
  const title =
    isDashboard || isCourierPortal
      ? `${saudacao()}, ${(usuario?.nome || "").split(" ")[0]}.`
      : isClientOverview
        ? `Olá, ${(usuario?.nome || "").split(" ")[0]}.`
        : current?.label || "JS BOY";
  const subtitle = isDashboard
    ? "Visão geral da operação."
    : isCourierPortal
      ? "Seu trabalho de hoje, em um só lugar."
      : isClientOverview
        ? "Solicite e acompanhe os serviços da sua empresa."
        : isClientPortal
          ? "Solicitações, acompanhamento e conta."
          : "Painel de entregas";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className={roleShell ? "appShell roleShell" : "appShell"}>
      {menuOpen ? (
        <button
          className="sidebarBackdrop"
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <span className="brandMark">
            <img
              src="/assets/js-boy-logo-oficial.jpg"
              alt=""
              aria-hidden="true"
            />
          </span>
          <span>
            <strong>JS BOY</strong>
            <small>DESPACHO</small>
          </span>
          <button
            className="sidebarClose"
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="sideNav" aria-label="Menu principal">
          {visibleItems.map((item) => (
            <NavLink
              end
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
            >
              <item.icon size={roleShell ? 24 : 19} aria-hidden="true" />
              <span>{item.label}</span>
              {item.label === "Conversas" && counts.conversas > 0 ? (
                <b className="navBadge">{counts.conversas}</b>
              ) : item.label === "Notificações" && counts.notificacoes > 0 ? (
                <b className="navBadge">{counts.notificacoes}</b>
              ) : null}
            </NavLink>
          ))}
        </nav>
        <NavLink
          className="sideHelp"
          to={operacional ? "/operacional/ajuda" : "/ajuda"}
        >
          <HelpCircle size={19} /> Ajuda e contato
        </NavLink>
        {usuario?.perfil === "PROPRIETARIO" &&
        usuario.vinculoOperacionalAtivo ? (
          <NavLink
            className="sideHelp"
            to={operacional ? "/dashboard" : "/operacional"}
          >
            {operacional ? "Voltar ao modo proprietário" : "Modo entregador"}
          </NavLink>
        ) : null}
        {roleShell ? (
          <>
            <Link
              className="sideUser roleSideUser"
              to={accountPath}
              onClick={() => setMenuOpen(false)}
            >
              <span className="sideUserAvatar">{iniciais(usuario?.nome)}</span>
              <div>
                <strong>{(usuario?.nome || "").split(" ")[0]}</strong>
                <span>{profileLabel(perfilMenu)}</span>
              </div>
              <ChevronRight size={20} />
            </Link>
            <button
              className="roleSideLogout"
              type="button"
              onClick={handleLogout}
            >
              <LogOut size={25} />
              Sair
            </button>
          </>
        ) : (
          <div className="sideUser">
            <span className="sideUserAvatar">{iniciais(usuario?.nome)}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <strong>{usuario?.nome}</strong>
              <span>{profileLabel(perfilMenu)}</span>
            </div>
            <button
              className="sideLogout"
              onClick={handleLogout}
              aria-label="Sair"
              title="Sair"
              type="button"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>
      <div className="contentArea">
        <header className="appHeader">
          <button
            className="iconButton"
            aria-label="Abrir menu"
            type="button"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="appHeaderLeft">
            {isDashboard || isCourierPortal || isClientOverview ? (
              <span className="appHeaderSun">
                <Sun size={roleShell ? 31 : 20} />
              </span>
            ) : null}
            <div style={{ minWidth: 0 }}>
              {roleShell ? <h1>{title}</h1> : <strong>{title}</strong>}
              <span>{subtitle}</span>
            </div>
          </div>
          {roleShell ? (
            <div className="roleHeaderActions">
              {canRequest ? (
                <Link
                  className="portalPrimaryButton"
                  to={location.pathname + "?solicitar=1"}
                >
                  <Plus size={22} />
                  Solicitar entrega
                </Link>
              ) : null}
              {!isClientOverview ? (
                <>
                  <Link
                    className="headerNotification"
                    to={noticesPath}
                    aria-label={
                      "Notificações" +
                      (counts.notificacoes
                        ? ": " + counts.notificacoes + " não lidas"
                        : "")
                    }
                  >
                    <Bell size={24} />
                    {counts.notificacoes > 0 ? (
                      <b>{counts.notificacoes}</b>
                    ) : null}
                  </Link>
                  <details className="roleProfileMenu" ref={profileMenu}>
                    <summary aria-label="Menu da conta">
                      <span className="roleHeaderAvatar">
                        {iniciais(usuario?.nome)}
                      </span>
                      <ChevronDown size={18} />
                    </summary>
                    <div>
                      <Link to={accountPath}>
                        {operacional ? "Meu perfil" : "Minha conta"}
                      </Link>
                      <button type="button" onClick={handleLogout}>
                        <LogOut size={17} />
                        Sair
                      </button>
                    </div>
                  </details>
                </>
              ) : null}
            </div>
          ) : (
            <div className="headerAvatarPill">
              <span className="headerAvatar">{iniciais(usuario?.nome)}</span>
              <button
                aria-label="Sair"
                className="headerLogoutButton"
                type="button"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </div>
          )}
        </header>
        <Outlet />
      </div>
    </div>
  );
}
