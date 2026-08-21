import { z } from 'zod';

export const ContactSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
  createdAt: z.string(),
  /** Estado de lectura para el panel de administración. */
  read: z.boolean().optional().default(false),
});

export type Contact = z.infer<typeof ContactSchema>;
