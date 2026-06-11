import { Bike } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
    <main className="loginPage">
      <section className="loginPanel">
        <div className="loginBrand">
          <span className="brandMark">
            <Bike size={28} />
          </span>
          <div>
            <h1>JS Boy</h1>
            <p>Sistema de entregas</p>
          </div>
        </div>

        <form className="formStack" onSubmit={handleSubmit}>
          <label>
            E-mail
            <input
              type="email"
              placeholder="proprietario@jsboy.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              placeholder="Sua senha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
            />
          </label>
          {erro ? <p className="errorMessage">{erro}</p> : null}
          <button type="submit" className="primaryButton" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
