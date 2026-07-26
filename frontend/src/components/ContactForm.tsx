import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { api } from '../services/api';

const contactSchema = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome').max(120, 'Use no maximo 120 caracteres'),
  empresa: z.string().trim().max(120, 'Use no maximo 120 caracteres').optional(),
  email: z.string().trim().email('Informe um e-mail valido').max(254),
  telefone: z.string().trim().min(8, 'Informe um telefone valido').max(30),
  mensagem: z.string().trim().min(10, 'Conte um pouco mais sobre a necessidade').max(2000, 'Use no maximo 2.000 caracteres'),
  website: z.string().max(0),
});

type ContactFormData = z.infer<typeof contactSchema>;

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
  const [confirmation, setConfirmation] = useState('');
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: emptyForm,
  });

  async function onSubmit(data: ContactFormData) {
    setSubmitError('');
    setConfirmation('');

    try {
      const response = await api.post<ContactResponse>('/public/contatos', data);
      const reference = response.data.protocolo || response.data.id;
      setConfirmation(reference
        ? `Solicitacao recebida. Protocolo: ${reference}.`
        : 'Solicitacao recebida. A JS Boy retornara pelos dados informados.');
      reset(emptyForm);
    } catch {
      setSubmitError('Nao foi possivel enviar agora. Revise os dados e tente novamente.');
    }
  }

  return (
    <form className="quoteForm" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2>Solicitar contato</h2>
      <p>Envie seus dados para a JS Boy avaliar a necessidade.</p>

      <label>
        Nome
        <input autoComplete="name" {...register('nome')} />
        {errors.nome ? <span className="fieldError">{errors.nome.message}</span> : null}
      </label>
      <label>
        Empresa <span className="optionalLabel">(opcional)</span>
        <input autoComplete="organization" {...register('empresa')} />
        {errors.empresa ? <span className="fieldError">{errors.empresa.message}</span> : null}
      </label>
      <div className="formRow">
        <label>
          E-mail
          <input type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <span className="fieldError">{errors.email.message}</span> : null}
        </label>
        <label>
          Telefone
          <input type="tel" autoComplete="tel" {...register('telefone')} />
          {errors.telefone ? <span className="fieldError">{errors.telefone.message}</span> : null}
        </label>
      </div>
      <label>
        Mensagem
        <textarea rows={5} {...register('mensagem')} />
        {errors.mensagem ? <span className="fieldError">{errors.mensagem.message}</span> : null}
      </label>

      <div className="honeypotField" aria-hidden="true">
        <label>
          Site
          <input tabIndex={-1} autoComplete="off" {...register('website')} />
        </label>
      </div>

      {submitError ? <p className="errorMessage" role="alert">{submitError}</p> : null}
      {confirmation ? <p className="successMessage" role="status">{confirmation}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Enviar solicitacao'}
      </button>
    </form>
  );
}
