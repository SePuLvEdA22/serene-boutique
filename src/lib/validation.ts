import { z } from 'zod';

export const emailSchema = z.string().trim().email('Email inválido');

export const passwordSchema = z
  .string()
  .trim()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().trim().min(1, 'La contraseña es obligatoria'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string().trim().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  });

export const contactSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: emailSchema,
  subject: z.string().min(3, 'El asunto debe tener al menos 3 caracteres').max(200),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(5000),
});

export const shippingSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: emailSchema,
  phone: z
    .string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .regex(/^[\d\s+\-()]+$/, 'Teléfono inválido'),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad es obligatoria'),
  state: z.string().min(2, 'El estado es obligatorio'),
  zip: z
    .string()
    .min(5, 'El CP debe tener al menos 5 caracteres')
    .regex(/^\d{5}$/, 'CP inválido (5 dígitos)'),
  notes: z.string().optional(),
});

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().trim().min(1, 'La contraseña es obligatoria'),
});

export const personalizadoSchema = z.object({
  description: z
    .string()
    .min(10, 'Describe tu diseño con al menos 10 caracteres'),
});

export const newsletterSchema = z.object({
  email: emailSchema,
});

export function formatZodErrors(
  issues: { path: readonly unknown[]; message: string }[]
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.');
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}
