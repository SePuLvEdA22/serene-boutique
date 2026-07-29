import { z } from 'zod';

export const SubscriberSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  subscribedAt: z.string(),
});

export type Subscriber = z.infer<typeof SubscriberSchema>;
