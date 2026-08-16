import { z } from 'zod';

export const SubscriberSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  subscribedAt: z.string(),
  /** Momento en que el usuario dio consentimiento explícito al newsletter. */
  consentAt: z.string().optional(),
});

export type Subscriber = z.infer<typeof SubscriberSchema>;
