import { z } from 'zod'

export const createOrderSchema = z.object({
  title: z.string().trim().min(2, 'Название должно быть не менее 2 символов').max(100, 'Название не должно превышать 100 символов'),
  details: z.any().optional().nullable(),
  price: z.number().nonnegative('Цена не может быть отрицательной').optional(),
  csrfToken: z.string().max(500),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
