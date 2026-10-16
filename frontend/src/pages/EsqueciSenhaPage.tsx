import { message, useLocale } from '../i18n';
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

const getSchema = () => (z.object({ email: z.string().email(message("senha.recuperar.informe.um.e.mail.valido")) }));
type FormData = z.infer<ReturnType<typeof getSchema>>;

export function EsqueciSenhaPage() {
  useLocale();
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(getSchema()),
    defaultValues: { email: '' },
  });

  const email = watch('email');

  async function onSubmit(data: FormData) {
    setErro('');
    try {
      await api.post('/auth/password/request', { email: formatEmailInput(data.email) });
    } catch (reason) {
      if (axios.isAxiosError(reason) && reason.response?.status === 429) {
        setErro(message("senha.recuperar.muitas.tentativas.aguarde.alguns.minutos"));
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
          <h1>{message("senha.recuperar.recuperar.senha")}</h1>
          <section className="clientLoginCard passwordRecoveryCard">
            {enviado ? (
              <div className="passwordRecoverySuccess" role="status" aria-live="polite">
                <span className="passwordRecoverySuccessIcon" aria-hidden="true">
                  <MailCheck size={25} strokeWidth={2.2} />
                </span>
                <div className="passwordRecoverySuccessCopy">
                  <h2>{message("senha.recuperar.confira.seu.e.mail")}</h2>
                  <p>
                    {message("senha.recuperar.se.houver.uma.conta.com.esse.endereco.enviaremos.um.link.para.voce.c")} </p>
                  <p className="passwordRecoveryHint">
                    {message("senha.recuperar.nao.encontrou.a.mensagem.verifique.a.pasta.de.spam")} </p>
                </div>
                <Link to="/login" className="authBackLink">
                  <ArrowLeft size={16} aria-hidden="true" />
                  {message("senha.recuperar.voltar.ao.login")} </Link>
              </div>
            ) : (
              <form className="clientLoginForm passwordRecoveryForm" onSubmit={handleSubmit(onSubmit)} noValidate>
                <p className="passwordRecoveryIntro">
                  {message("senha.recuperar.digite.o.e.mail.cadastrado.para.receber.um.link.de.redefinicao.de.se")} </p>
                <label>
                  {message("senha.recuperar.e.mail")} <input
                    {...register('email')}
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    placeholder={message("comum.email.exemplo")}
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
                  {isSubmitting ? message("comum.enviando") : message("senha.recuperar.enviar.link.de.recuperacao")}
                </button>
                <Link to="/login" className="authBackLink">
                  <ArrowLeft size={16} aria-hidden="true" />
                  {message("senha.recuperar.voltar.ao.login")} </Link>
              </form>
            )}
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
