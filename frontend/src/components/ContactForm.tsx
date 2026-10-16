import { message, useLocale } from '../i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { api } from '../services/api';
import { formatEmailInput, formatPhone, onlyDigits } from '../utils/inputMasks';

const getContactSchema = () => (z.object({
  nome: z.string().trim().min(2, message("contato.formulario.informe.seu.nome")).max(120, message("contato.formulario.use.no.maximo.120.caracteres")),
  empresa: z.string().trim().max(120, message("contato.formulario.use.no.maximo.120.caracteres")).optional(),
  email: z.string().trim().email(message("contato.formulario.informe.um.e.mail.valido")).max(254),
  telefone: z.string().trim().min(8, message("contato.formulario.informe.um.telefone.valido")).max(30),
  mensagem: z.string().trim().min(10, message("contato.formulario.conte.um.pouco.mais.sobre.a.necessidade")).max(2000, message("contato.formulario.use.no.maximo.2.000.caracteres")),
  website: z.string().max(0),
}));

type ContactFormData = z.infer<ReturnType<typeof getContactSchema>>;

type ContactResponse = {
  id?: string;
  protocolo?: string;
};

const emptyForm: ContactFormData = {
  nome: '',
  empresa: '',
  email: '',
  telefone: '',
  mensagem: '',
  website: '',
};

export function ContactForm() {
  useLocale();
  const [confirmation, setConfirmation] = useState('');
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(getContactSchema()),
    defaultValues: emptyForm,
  });

  const email = watch('email');
  const telefone = watch('telefone');

  async function onSubmit(data: ContactFormData) {
    setSubmitError('');
    setConfirmation('');

    try {
      const response = await api.post<ContactResponse>('/public/contatos', { ...data, email: formatEmailInput(data.email), telefone: onlyDigits(data.telefone) });
      const reference = response.data.protocolo || response.data.id;
      setConfirmation(reference
        ? message("contato.formulario.solicitacao.recebida.protocolo.value", { value1: reference })
        : message("contato.formulario.solicitacao.recebida.a.js.boy.retornara.pelos.dados.informados"));
      reset(emptyForm);
    } catch {
      setSubmitError(message("contato.formulario.nao.foi.possivel.enviar.agora.revise.os.dados.e.tente.novamente"));
    }
  }

  return (
    <form className="quoteForm" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2>{message("contato.formulario.solicitar.contato")}</h2>
      <p>{message("contato.formulario.envie.seus.dados.para.a.js.boy.avaliar.a.necessidade")}</p>

      <label>
        {message("contato.formulario.nome")} <input autoComplete="name" {...register('nome')} />
        {errors.nome ? <span className="fieldError">{errors.nome.message}</span> : null}
      </label>
      <label>
        {message("contato.formulario.empresa")} <span className="optionalLabel">{message("contato.formulario.opcional")}</span>
        <input autoComplete="organization" {...register('empresa')} />
        {errors.empresa ? <span className="fieldError">{errors.empresa.message}</span> : null}
      </label>
      <div className="formRow">
        <label>
          {message("contato.formulario.e.mail")} <input {...register('email')} type="email" inputMode="email" autoComplete="email" placeholder={message("comum.email.exemplo")} value={email} onChange={(event) => setValue('email', formatEmailInput(event.target.value), { shouldDirty: true, shouldValidate: true })} />
          {errors.email ? <span className="fieldError">{errors.email.message}</span> : null}
        </label>
        <label>
          {message("contato.formulario.telefone")} <input {...register('telefone')} type="tel" inputMode="tel" autoComplete="tel" maxLength={15} placeholder="(00) 00000-0000" value={telefone} onChange={(event) => setValue('telefone', formatPhone(event.target.value), { shouldDirty: true, shouldValidate: true })} />
          {errors.telefone ? <span className="fieldError">{errors.telefone.message}</span> : null}
        </label>
      </div>
      <label>
        {message("contato.formulario.mensagem")} <textarea rows={5} {...register('mensagem')} />
        {errors.mensagem ? <span className="fieldError">{errors.mensagem.message}</span> : null}
      </label>

      <div className="honeypotField" aria-hidden="true">
        <label>
          {message("contato.formulario.site")} <input tabIndex={-1} autoComplete="off" {...register('website')} />
        </label>
      </div>

      {submitError ? <p className="errorMessage" role="alert">{submitError}</p> : null}
      {confirmation ? <p className="successMessage" role="status">{confirmation}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? message("comum.enviando") : message("contato.formulario.enviar.solicitacao")}
      </button>
    </form>
  );
}
