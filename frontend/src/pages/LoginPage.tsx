import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PublicHeader, SiteFooter } from './LandingPage';

export function LoginPage() {
  const { autenticado, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('proprietario@jsboy.com');
  const [senha, setSenha] = useState('admin123');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const redirectTo = (location.state as { from?: string } | null)?.from || '/dashboard';

  if (autenticado) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      await login(email, senha);
      navigate(redirectTo, { replace: true });
    } catch {
      setErro('E-mail ou senha invalidos.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="sitePage">
      <PublicHeader />
      <section className="clientArea">
        <div className="siteContainer">
          <h1>Area do Cliente</h1>
          <section className="clientLoginCard">
            <div className="clientTabs" aria-label="Area do cliente">
              <button className="active" type="button">Entrar</button>
              <button type="button">Criar conta</button>
            </div>

            <form className="clientLoginForm" onSubmit={handleSubmit}>
              <label>
                E-mail
                <input
                  type="email"
                  value={email}
                  onChange={(event: { target: { value: string } }) => setEmail(event.target.value)}
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  value={senha}
                  onChange={(event: { target: { value: string } }) => setSenha(event.target.value)}
                />
              </label>
              {erro ? <p className="errorMessage">{erro}</p> : null}
              <button type="submit" disabled={carregando}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
