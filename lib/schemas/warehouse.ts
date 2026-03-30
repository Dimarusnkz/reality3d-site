import { z } from 'zod'

export const warehouseMovementSchema = z.object({
  warehouseId: z.number().int().positive().optional().nullable(),
  productId: z.number().int().positive(),
  unit: z.enum(['pcs', 'm', 'kg']),
  quantity: z.string().trim().min(1),
  actionType: z.enum(['receipt', 'writeoff', 'transfer_to_work', 'adjustment']),
  reason: z.enum(['sale', 'defect', 'internal', 'to_work', 'inventory']).optional().nullable(),
  supplier: z.string().trim().max(200).optional().nullable(),
  documentNo: z.string().trim().max(120).optional().nullable(),
  comment: z.string().trim().max(500).optional().nullable(),
  shopOrderId: z.string().trim().uuid().optional().nullable(),
  serviceOrderId: z.number().int().positive().optional().nullable(),
})

export const inventorySettingsSchema = z.object({
  warehouseId: z.number().int().positive().optional().nullable(),
  productId: z.number().int().positive(),
  unit: z.enum(['pcs', 'm', 'kg']),
  minThreshold: z.string().trim().min(0).max(32),
})

export type WarehouseMovementInput = z.infer<typeof warehouseMovementSchema>
export type InventorySettingsInput = z.infer<typeof inventorySettingsSchema>
