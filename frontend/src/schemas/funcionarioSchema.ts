import { z } from 'zod';

export const funcionarioSchema = z.object({
  nome: z.string().min(1, 'Informe o nome').max(120, 'Nome muito longo'),
  email: z.string().min(1, 'Informe o e-mail').email('E-mail invalido').max(180, 'E-mail muito longo'),
  senha: z.string().min(6, 'A senha deve ter ao menos 6 caracteres').max(72, 'Senha muito longa'),
});

export type FuncionarioFormData = z.infer<typeof funcionarioSchema>;
