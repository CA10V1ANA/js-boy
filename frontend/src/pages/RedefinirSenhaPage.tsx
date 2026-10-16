import { message, useLocale } from '../i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import axios from 'axios';
import { api } from '../services/api';
import { PublicHeader, SiteFooter } from './LandingPage';

const getSchema = () => (z.object({
  novaSenha: z
    .string()
    .min(12, message("senha.redefinir.a.senha.deve.ter.pelo.menos.12.caracteres"))
    .regex(/[A-Z]/, message("senha.redefinir.a.senha.deve.ter.uma.letra.maiuscula"))
    .regex(/[a-z]/, message("senha.redefinir.a.senha.deve.ter.uma.letra.minuscula"))
    .regex(/\d/, message("senha.redefinir.a.senha.deve.ter.um.numero")),
  confirmarSenha: z.string(),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: message("senha.redefinir.as.senhas.nao.coincidem"),
  path: ['confirmarSenha'],
}));

type FormData = z.infer<ReturnType<typeof getSchema>>;

export function RedefinirSenhaPage() {
  useLocale();
  const [params] = useSearchParams();
  const token = params.get('token');
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(getSchema()),
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
      setErro(message("senha.redefinir.link.de.redefinicao.invalido"));
      return;
    }
    try {
      await api.post('/auth/password/reset', { token, novaSenha: data.novaSenha });
      setSucesso(true);
    } catch (reason) {
      if (axios.isAxiosError(reason)) {
        const serverMessage = reason.response?.data?.message;
        if (typeof serverMessage === 'string' && serverMessage.trim()) {
          setErro(serverMessage);
        } else {
          setErro(message("senha.redefinir.nao.foi.possivel.redefinir.a.senha.o.link.pode.ter.expirado"));
        }
      } else {
        setErro(message("senha.redefinir.erro.inesperado.tente.novamente"));
      }
    }
  }

  if (!token && !sucesso) {
    return (
      <main className="sitePage">
        <PublicHeader />
        <section className="clientArea">
          <div className="siteContainer">
            <h1>{message("senha.redefinir.redefinir.senha")}</h1>
            <section className="clientLoginCard">
              <div className="clientLoginForm" style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  {message("senha.redefinir.link.de.redefinicao.invalido.ou.expirado")} </p>
                <Link to="/esqueci-senha" className="primaryButton" style={{ display: 'inline-block', textDecoration: 'none' }}>
                  {message("senha.redefinir.solicitar.novo.link")} </Link>
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
          <h1>{message("senha.redefinir.redefinir.senha")}</h1>
          <section className="clientLoginCard">
            {sucesso ? (
              <div className="clientLoginForm" style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  {message("senha.redefinir.senha.redefinida.com.sucesso")} </p>
                <Link to="/login" className="primaryButton" style={{ display: 'inline-block', textDecoration: 'none' }}>
                  {message("senha.redefinir.entrar.com.a.nova.senha")} </Link>
              </div>
            ) : (
              <form className="clientLoginForm" onSubmit={handleSubmit(onSubmit)} noValidate>
                <p style={{ marginBottom: '1rem', lineHeight: 1.5, fontSize: '0.9rem' }}>
                  {message("senha.redefinir.crie.sua.nova.senha.ela.deve.ter.pelo.menos.12.caracteres.uma.letra.")} </p>
                <label>
                  {message("senha.redefinir.nova.senha")} <span className="passwordInputWrap">
                    <input
                      type={senhaVisivel ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={message("senha.redefinir.digite.a.nova.senha")}
                      {...register('novaSenha')}
                    />
                    <button
                      className="passwordVisibilityButton"
                      type="button"
                      aria-label={senhaVisivel ? message("senha.redefinir.ocultar.senha") : message("senha.redefinir.mostrar.senha")}
                      title={senhaVisivel ? message("senha.redefinir.ocultar.senha") : message("senha.redefinir.mostrar.senha")}
                      aria-pressed={senhaVisivel}
                      onClick={() => setSenhaVisivel((v) => !v)}
                    >
                      {senhaVisivel ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </span>
                  {errors.novaSenha ? <span className="fieldError">{errors.novaSenha.message}</span> : null}
                </label>
                <label>
                  {message("senha.redefinir.confirmar.senha")} <input
                    type="password"
                    autoComplete="new-password"
                    placeholder={message("senha.redefinir.repita.a.nova.senha")}
                    {...register('confirmarSenha')}
                  />
                  {errors.confirmarSenha ? <span className="fieldError">{errors.confirmarSenha.message}</span> : null}
                </label>
                {erro ? <p className="errorMessage">{erro}</p> : null}
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? message("comum.redefinindo") : message("senha.redefinir.redefinir.senha")}
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
