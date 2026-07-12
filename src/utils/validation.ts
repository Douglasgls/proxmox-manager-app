import { z } from 'zod';

/**
 * Validação para formulário de Login.
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('Formato de e-mail inválido'),
  password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Validação básica para criação/configuração de containers.
 */
export const createContainerSchema = z.object({
  vmid: z.number().int().min(100, 'O VMID deve ser maior ou igual a 100'),
  name: z.string().min(1, 'O nome é obrigatório').regex(/^[a-zA-Z0-9-]+$/, 'O nome deve conter apenas letras, números e hífen'),
  node: z.string().min(1, 'Nó de destino é obrigatório'),
  cores: z.number().int().min(1, 'Mínimo de 1 core').max(128),
  memory: z.number().int().min(512, 'Memória mínima de 512 MB'),
  disk: z.number().int().min(1, 'Disco mínimo de 1 GB'),
  bridge: z.string().default('vmbr0'),
  ipAddress: z.string().refine((val) => val === 'dhcp' || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$/.test(val), {
    message: 'Deve ser "dhcp" ou um IP válido no formato CIDR (ex: 192.168.1.100/24)',
  }),
});

export type CreateContainerInput = z.infer<typeof createContainerSchema>;
