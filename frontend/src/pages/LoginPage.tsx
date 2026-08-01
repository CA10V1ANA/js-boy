import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginFormData, loginSchema } from '../schemas/loginSchema';
import { formatEmailInput } from '../utils/inputMasks';
import { PublicHeader, SiteFooter } from './LandingPage';

export function LoginPage() {
  const { autenticado, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [erro, setErro] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const redirectTo = (location.state as { from?: string } | null)?.from || '/app';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' },
  });

  const email = watch('email');

  if (autenticado) {
    return <Navigate to="/app" replace />;
  }

  async function onSubmit(data: LoginFormData) {
    setErro('');

    try {
      await login(formatEmailInput(data.email), data.senha);
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
            <div className="clientTabs" aria-label="Acesso ao sistema">
              <span className="active">Entrar</span>
            </div>

            <form className="clientLoginForm" onSubmit={handleSubmit(onSubmit)} noValidate>
              <label>
                E-mail
                <input {...register('email')} type="email" inputMode="email" autoComplete="username" placeholder="nome@exemplo.com" value={email} onChange={(event) => setValue('email', formatEmailInput(event.target.value), { shouldDirty: true, shouldValidate: true })} />
                {errors.email ? <span className="fieldError">{errors.email.message}</span> : null}
              </label>
              <label>
                Senha
                <span className="passwordInputWrap">
                  <input type={senhaVisivel ? 'text' : 'password'} autoComplete="current-password" placeholder="Digite sua senha" {...register('senha')} />
                  <button
                    className="passwordVisibilityButton"
                    type="button"
                    aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                    title={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={senhaVisivel}
                    onClick={() => setSenhaVisivel((visivel) => !visivel)}
                  >
                    {senhaVisivel ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </span>
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
