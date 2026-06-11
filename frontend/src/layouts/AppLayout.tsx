import { Bike, LayoutDashboard, MapPinned, Menu, Settings, Truck, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perfis: ['PROPRIETARIO'] },
  { to: '/clientes', label: 'Clientes', icon: Users, perfis: ['PROPRIETARIO'] },
  { to: '/entregadores', label: 'Entregadores', icon: Truck, perfis: ['PROPRIETARIO'] },
  { to: '/entregas', label: 'Entregas', icon: MapPinned, perfis: ['PROPRIETARIO'] },
  { to: '/minhas-entregas', label: 'Minhas entregas', icon: MapPinned, perfis: ['ENTREGADOR'] },
  { to: '/configuracoes/preco', label: 'Precos', icon: Settings, perfis: ['PROPRIETARIO'] },
];

export function AppLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const visibleItems = items.filter((item) => usuario && item.perfis.includes(usuario.perfil));

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">
            <Bike size={23} />
          </span>
          <span>
            <strong>JS Boy</strong>
            <small>Entregas</small>
          </span>
        </div>

        <nav className="sideNav" aria-label="Menu principal">
          {visibleItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              <item.icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="contentArea">
        <header className="appHeader">
          <button className="iconButton" aria-label="Abrir menu">
            <Menu size={22} />
          </button>
          <div>
            <strong>MVP JS Boy</strong>
            <span>{usuario?.nome} - {usuario?.perfil}</span>
          </div>
          <button className="secondaryButton headerLogout" onClick={handleLogout}>Sair</button>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
