import { z } from 'zod'

export const createOrderSchema = z.object({
  title: z.string().trim().min(1, 'Название обязательно'),
  details: z.any(),
  price: z.number().optional(),
  csrfToken: z.string(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
