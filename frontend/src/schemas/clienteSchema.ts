import { z } from 'zod';

export const clienteSchema = z.object({
  nome: z.string().min(1, 'Informe o nome').max(140, 'Maximo de 140 caracteres'),
  telefone: z.string().min(1, 'Informe o telefone').max(30, 'Maximo de 30 caracteres'),
  whatsapp: z.string().max(30, 'Maximo de 30 caracteres').optional().or(z.literal('')),
  email: z.string().email('E-mail invalido').max(180).optional().or(z.literal('')),
  documento: z.string().max(20, 'Maximo de 20 caracteres').optional().or(z.literal('')),
  endereco: z.string().min(1, 'Informe o endereco').max(180, 'Maximo de 180 caracteres'),
  bairro: z.string().min(1, 'Informe o bairro').max(80, 'Maximo de 80 caracteres'),
  cidade: z.string().min(1, 'Informe a cidade').max(80, 'Maximo de 80 caracteres'),
  observacoes: z.string().max(500, 'Maximo de 500 caracteres').optional().or(z.literal('')),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
