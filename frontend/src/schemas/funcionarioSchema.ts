import { z } from 'zod';

export const funcionarioSchema = z.object({
  nome: z.string().min(1, "funcionario.validacao.informe.o.nome").max(120, "funcionario.validacao.nome.muito.longo"),
  email: z.string().min(1, "funcionario.validacao.informe.o.e.mail").email("funcionario.validacao.e.mail.invalido").max(180, "funcionario.validacao.e.mail.muito.longo"),
  senha: z.string().min(6, "funcionario.validacao.a.senha.deve.ter.ao.menos.6.caracteres").max(72, "funcionario.validacao.senha.muito.longa"),
});

export type FuncionarioFormData = z.infer<typeof funcionarioSchema>;
