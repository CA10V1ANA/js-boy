import { z } from 'zod';

const digits = (value: string) => value.replace(/\D/g, '');

export const clienteSchema = z.object({
  nome: z.string().trim().min(1, "cliente.validacao.informe.o.nome").max(140),
  telefone: z.string().min(1, "cliente.validacao.informe.o.telefone").refine((value) => {
    const size = digits(value).length;
    return size >= 10 && size <= 15;
  }, "cliente.validacao.telefone.deve.conter.entre.10.e.15.digitos"),
  whatsapp: z.string().refine((value) => !value || (digits(value).length >= 10 && digits(value).length <= 15), "cliente.validacao.whatsapp.invalido"),
  email: z.string().email("cliente.validacao.e.mail.invalido").max(180).optional().or(z.literal('')),
  documento: z.string().refine((value) => !value || [11, 14].includes(digits(value).length), "cliente.validacao.informe.um.cpf.ou.cnpj.valido"),
  endereco: z.string().trim().min(1, "cliente.validacao.informe.o.endereco").max(180),
  numero: z.string().max(20),
  semNumero: z.boolean(),
  complemento: z.string().max(120),
  cep: z.string().refine((value) => !value || digits(value).length === 8, "cliente.validacao.cep.deve.conter.8.digitos"),
  bairro: z.string().trim().min(1, "cliente.validacao.informe.o.bairro").max(80),
  cidade: z.string().trim().min(1, "cliente.validacao.informe.a.cidade").max(80),
  estado: z.string().refine((value) => !value || value.trim().length === 2, "cliente.validacao.use.a.sigla.do.estado"),
  observacoes: z.string().max(500).optional().or(z.literal('')),
}).refine((data) => data.semNumero || data.numero.trim().length > 0, {
  path: ['numero'],
  message: "cliente.validacao.informe.o.numero.ou.marque.sem.numero",
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
