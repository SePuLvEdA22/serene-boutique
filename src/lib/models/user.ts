import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  isAdmin: z.boolean().optional().default(false),
});

export type User = z.infer<typeof UserSchema>;
