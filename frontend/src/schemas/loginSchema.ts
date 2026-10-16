import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, "login.validacao.informe.o.e.mail").email("login.validacao.e.mail.invalido"),
  senha: z.string().min(1, "login.validacao.informe.a.senha"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
