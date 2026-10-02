import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import axios from 'axios';
import { api } from '../services/api';
import { PublicHeader, SiteFooter } from './LandingPage';

const schema = z.object({
  novaSenha: z
    .string()
    .min(12, 'A senha deve ter pelo menos 12 caracteres')
    .regex(/[A-Z]/, 'A senha deve ter uma letra maiúscula')
    .regex(/[a-z]/, 'A senha deve ter uma letra minúscula')
    .regex(/\d/, 'A senha deve ter um número'),
  confirmarSenha: z.string(),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
});

type FormData = z.infer<typeof schema>;

export function RedefinirSenhaPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { novaSenha: '', confirmarSenha: '' },
  });

  // Remove the token from the URL to prevent leaking via referrer
  useEffect(() => {
    if (token && window.history.replaceState) {
      window.history.replaceState({}, '', '/redefinir-senha');
    }
  }, [token]);

  async function onSubmit(data: FormData) {
    setErro('');
    if (!token) {
      setErro('Link de redefinição inválido.');
      return;
    }
    try {
      await api.post('/auth/password/reset', { token, novaSenha: data.novaSenha });
      setSucesso(true);
    } catch (reason) {
      if (axios.isAxiosError(reason)) {
        const message = reason.response?.data?.message;
        if (typeof message === 'string' && message.trim()) {
          setErro(message);
        } else {
          setErro('Não foi possível redefinir a senha. O link pode ter expirado.');
        }
      } else {
        setErro('Erro inesperado. Tente novamente.');
      }
    }
  }

  if (!token && !sucesso) {
    return (
      <main className="sitePage">
        <PublicHeader />
        <section className="clientArea">
          <div className="siteContainer">
            <h1>Redefinir senha</h1>
            <section className="clientLoginCard">
              <div className="clientLoginForm" style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  Link de redefinição inválido ou expirado.
                </p>
                <Link to="/esqueci-senha" className="primaryButton" style={{ display: 'inline-block', textDecoration: 'none' }}>
                  Solicitar novo link
                </Link>
              </div>
            </section>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="sitePage">
      <PublicHeader />
      <section className="clientArea">
        <div className="siteContainer">
          <h1>Redefinir senha</h1>
          <section className="clientLoginCard">
            {sucesso ? (
              <div className="clientLoginForm" style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  Senha redefinida com sucesso!
                </p>
                <Link to="/login" className="primaryButton" style={{ display: 'inline-block', textDecoration: 'none' }}>
                  Entrar com a nova senha
                </Link>
              </div>
            ) : (
              <form className="clientLoginForm" onSubmit={handleSubmit(onSubmit)} noValidate>
                <p style={{ marginBottom: '1rem', lineHeight: 1.5, fontSize: '0.9rem' }}>
                  Crie sua nova senha. Ela deve ter pelo menos 12 caracteres, uma letra maiúscula, uma minúscula e um número.
                </p>
                <label>
                  Nova senha
                  <span className="passwordInputWrap">
                    <input
                      type={senhaVisivel ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Digite a nova senha"
                      {...register('novaSenha')}
                    />
                    <button
                      className="passwordVisibilityButton"
                      type="button"
                      aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                      title={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                      aria-pressed={senhaVisivel}
                      onClick={() => setSenhaVisivel((v) => !v)}
                    >
                      {senhaVisivel ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </span>
                  {errors.novaSenha ? <span className="fieldError">{errors.novaSenha.message}</span> : null}
                </label>
                <label>
                  Confirmar senha
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repita a nova senha"
                    {...register('confirmarSenha')}
                  />
                  {errors.confirmarSenha ? <span className="fieldError">{errors.confirmarSenha.message}</span> : null}
                </label>
                {erro ? <p className="errorMessage">{erro}</p> : null}
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Redefinindo...' : 'Redefinir senha'}
                </button>
              </form>
            )}
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
