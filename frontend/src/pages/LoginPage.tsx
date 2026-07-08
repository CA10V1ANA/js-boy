import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginFormData, loginSchema } from '../schemas/loginSchema';
import { PublicHeader, SiteFooter } from './LandingPage';

export function LoginPage() {
  const { autenticado, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [erro, setErro] = useState('');
  const redirectTo = (location.state as { from?: string } | null)?.from || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'proprietario@jsboy.com', senha: 'admin123' },
  });

  if (autenticado) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(data: LoginFormData) {
    setErro('');

    try {
      await login(data.email, data.senha);
      navigate(redirectTo, { replace: true });
    } catch {
      setErro('E-mail ou senha invalidos.');
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

            <form className="clientLoginForm" onSubmit={handleSubmit(onSubmit)} noValidate>
              <label>
                E-mail
                <input type="email" {...register('email')} />
                {errors.email ? <span className="fieldError">{errors.email.message}</span> : null}
              </label>
              <label>
                Senha
                <input type="password" {...register('senha')} />
                {errors.senha ? <span className="fieldError">{errors.senha.message}</span> : null}
              </label>
              {erro ? <p className="errorMessage">{erro}</p> : null}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
