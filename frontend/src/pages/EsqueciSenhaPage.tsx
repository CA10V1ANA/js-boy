import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import axios from 'axios';
import { api } from '../services/api';
import { formatEmailInput } from '../utils/inputMasks';
import { PublicHeader, SiteFooter } from './LandingPage';

const schema = z.object({ email: z.string().email('Informe um e-mail válido') });
type FormData = z.infer<typeof schema>;

export function EsqueciSenhaPage() {
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const email = watch('email');

  async function onSubmit(data: FormData) {
    setErro('');
    try {
      await api.post('/auth/password/request', { email: formatEmailInput(data.email) });
    } catch (reason) {
      if (axios.isAxiosError(reason) && reason.response?.status === 429) {
        setErro('Muitas tentativas. Aguarde alguns minutos.');
        return;
      }
      // Silently succeed for privacy — don't reveal if account exists
    }
    setEnviado(true);
  }

  return (
    <main className="sitePage">
      <PublicHeader />
      <section className="clientArea">
        <div className="siteContainer">
          <h1>Recuperar senha</h1>
          <section className="clientLoginCard">
            {enviado ? (
              <div className="clientLoginForm" style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem', lineHeight: 1.5 }}>
                  Se uma conta com esse e-mail existir, enviaremos instruções para redefinir sua senha.
                </p>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary, #666)', fontSize: '0.875rem' }}>
                  Verifique também a pasta de spam.
                </p>
                <Link to="/login" className="primaryButton" style={{ display: 'inline-block', textDecoration: 'none' }}>
                  Voltar ao login
                </Link>
              </div>
            ) : (
              <form className="clientLoginForm" onSubmit={handleSubmit(onSubmit)} noValidate>
                <p style={{ marginBottom: '1rem', lineHeight: 1.5, fontSize: '0.9rem' }}>
                  Informe o e-mail da sua conta. Enviaremos um link para redefinir a senha.
                </p>
                <label>
                  E-mail
                  <input
                    {...register('email')}
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    placeholder="nome@exemplo.com"
                    value={email}
                    onChange={(event) =>
                      setValue('email', formatEmailInput(event.target.value), {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  {errors.email ? <span className="fieldError">{errors.email.message}</span> : null}
                </label>
                {erro ? <p className="errorMessage">{erro}</p> : null}
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
                <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <Link to="/login" style={{ color: 'var(--primary, #0066cc)', fontSize: '0.875rem' }}>
                    Voltar ao login
                  </Link>
                </p>
              </form>
            )}
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
