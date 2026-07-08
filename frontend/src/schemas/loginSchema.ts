import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail invalido'),
  senha: z.string().min(1, 'Informe a senha'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
