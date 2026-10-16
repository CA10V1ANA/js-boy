import { message, useLocale } from '../i18n';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { AuthTabs } from '../components/AuthTabs';
import { apiErrorMessage } from '../services/apiError';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginFormData, loginSchema } from '../schemas/loginSchema';
import { formatEmailInput } from '../utils/inputMasks';
import { PublicHeader, SiteFooter } from './LandingPage';

export function LoginPage() {
  useLocale();
  const { autenticado, entrarGoogle, login } = useAuth();
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
      setErro(message("login.e.mail.ou.senha.invalidos"));
    }
  }

  return (
    <main className="sitePage">
      <PublicHeader />
      <section className="clientArea">
        <div className="siteContainer">
          <h1>{message("login.acesso.a.js.boy")}</h1>
          <section className="clientLoginCard">
            <AuthTabs active="login" />

            <form className="clientLoginForm" onSubmit={handleSubmit(onSubmit)} noValidate>
              <label>
                {message("login.e.mail")} <input {...register('email')} type="email" inputMode="email" autoComplete="username" placeholder={message("comum.email.exemplo")} value={email} onChange={(event) => setValue('email', formatEmailInput(event.target.value), { shouldDirty: true, shouldValidate: true })} />
                {errors.email ? <span className="fieldError">{message(errors.email.message || "")}</span> : null}
              </label>
              <div className="clientLoginField">
                <label htmlFor="login-password">{message("login.senha")}</label>
                <span className="passwordInputWrap">
                  <input id="login-password" type={senhaVisivel ? 'text' : 'password'} autoComplete="current-password" placeholder={message("login.digite.sua.senha")} {...register('senha')} />
                  <button
                    className="passwordVisibilityButton"
                    type="button"
                    aria-label={senhaVisivel ? message("login.ocultar.senha") : message("login.mostrar.senha")}
                    title={senhaVisivel ? message("login.ocultar.senha") : message("login.mostrar.senha")}
                    aria-pressed={senhaVisivel}
                    onClick={() => setSenhaVisivel((visivel) => !visivel)}
                  >
                    {senhaVisivel ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </span>
                {errors.senha ? <span className="fieldError">{message(errors.senha.message || "")}</span> : null}
                <Link className="forgotPasswordLink" to="/esqueci-senha">{message("login.esqueci.minha.senha")}</Link>
              </div>
              {erro ? <p className="errorMessage">{erro}</p> : null}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? message("comum.entrando") : message("login.entrar")}
              </button>
            </form>
            <div className="loginAlternatives">
              <div className="loginDivider" aria-hidden="true"><span>{message("login.ou")}</span></div>
              <div className="googleLoginSlot">
                <GoogleLoginButton onCredential={credencial => { void entrarGoogle(credencial).then(() => navigate('/portal', { replace: true })).catch(r => { if (r?.response?.data?.code === 'GOOGLE_CADASTRO_NECESSARIO') navigate('/cadastro', { state: { credencial } }); else setErro(apiErrorMessage(r, message("login.nao.foi.possivel.entrar.com.google"))); }); }} />
              </div>
            </div>
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
