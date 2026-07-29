import { z } from 'zod';

export const OrderItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  color: z.string().optional(),
});

export const ShippingSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  notes: z.string().optional(),
});

export const paymentMethodSchema = z.enum(['card', 'pse']);

export const orderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

export const OrderSchema = z.object({
  id: z.string().min(1),
  userId: z.string().optional(),
  items: z.array(OrderItemSchema).min(1),
  shipping: ShippingSchema,
  total: z.number().nonnegative(),
  paymentMethod: paymentMethodSchema.optional(),
  mpPaymentId: z.string().optional(),
  mpPreferenceId: z.string().optional(),
  payerIdentification: z
    .object({
      type: z.string(),
      number: z.string(),
    })
    .optional(),
  status: orderStatusSchema.default('pending'),
  createdAt: z.string(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
