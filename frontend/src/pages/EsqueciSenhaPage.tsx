import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, MailCheck } from 'lucide-react';
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
          <section className="clientLoginCard passwordRecoveryCard">
            {enviado ? (
              <div className="passwordRecoverySuccess" role="status" aria-live="polite">
                <span className="passwordRecoverySuccessIcon" aria-hidden="true">
                  <MailCheck size={25} strokeWidth={2.2} />
                </span>
                <div className="passwordRecoverySuccessCopy">
                  <h2>Confira seu e-mail</h2>
                  <p>
                    Se houver uma conta com esse endereço, enviaremos um link para você criar uma nova senha.
                  </p>
                  <p className="passwordRecoveryHint">
                    Não encontrou a mensagem? Verifique a pasta de spam.
                  </p>
                </div>
                <Link to="/login" className="authBackLink">
                  <ArrowLeft size={16} aria-hidden="true" />
                  Voltar ao login
                </Link>
              </div>
            ) : (
              <form className="clientLoginForm passwordRecoveryForm" onSubmit={handleSubmit(onSubmit)} noValidate>
                <p className="passwordRecoveryIntro">
                  Digite o e-mail cadastrado para receber um link de redefinição de senha.
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
                <Link to="/login" className="authBackLink">
                  <ArrowLeft size={16} aria-hidden="true" />
                  Voltar ao login
                </Link>
              </form>
            )}
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
