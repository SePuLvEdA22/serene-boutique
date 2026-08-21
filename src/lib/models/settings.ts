import { z } from 'zod';

/** Configuración global de la tienda (un solo documento). */
export const SettingsSchema = z.object({
  storeName: z.string().min(1).max(80).default('Switch&Tech'),
  supportEmail: z.string().email().default('soporte@switchandtech.com'),
  whatsapp: z.string().max(30).optional().default(''),
  instagram: z.string().max(100).optional().default(''),
  shippingCost: z.number().nonnegative().default(0),
  freeShippingThreshold: z.number().nonnegative().default(0),
  announcement: z.string().max(300).optional().default(''),
  announcementEnabled: z.boolean().optional().default(false),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = SettingsSchema.parse({});