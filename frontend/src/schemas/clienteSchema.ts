import { z } from 'zod';

const digits = (value: string) => value.replace(/\D/g, '');

export const clienteSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome').max(140),
  telefone: z.string().min(1, 'Informe o telefone').refine((value) => {
    const size = digits(value).length;
    return size >= 10 && size <= 15;
  }, 'Telefone deve conter entre 10 e 15 digitos'),
  whatsapp: z.string().refine((value) => !value || (digits(value).length >= 10 && digits(value).length <= 15), 'WhatsApp invalido'),
  email: z.string().email('E-mail invalido').max(180).optional().or(z.literal('')),
  documento: z.string().refine((value) => !value || [11, 14].includes(digits(value).length), 'Informe um CPF ou CNPJ valido'),
  endereco: z.string().trim().min(1, 'Informe o endereco').max(180),
  numero: z.string().max(20),
  semNumero: z.boolean(),
  complemento: z.string().max(120),
  cep: z.string().refine((value) => !value || digits(value).length === 8, 'CEP deve conter 8 digitos'),
  bairro: z.string().trim().min(1, 'Informe o bairro').max(80),
  cidade: z.string().trim().min(1, 'Informe a cidade').max(80),
  estado: z.string().refine((value) => !value || value.trim().length === 2, 'Use a sigla do estado'),
  observacoes: z.string().max(500).optional().or(z.literal('')),
}).refine((data) => data.semNumero || data.numero.trim().length > 0, {
  path: ['numero'],
  message: 'Informe o numero ou marque sem numero',
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
