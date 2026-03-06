import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const createProductSchema = z.object({
  ean: z.string().min(8).max(32),
  name: z.string().min(2),
  category: z.string().min(2),
  supplier: z.string().optional(),
  defaultShelfLifeDays: z.number().int().positive().optional()
});

export const createBatchSchema = z.object({
  productId: z.string().optional(),
  ean: z.string().min(8).max(32),
  name: z.string().min(2),
  category: z.string().min(2),
  supplier: z.string().optional(),
  quantityInitial: z.number().int().positive(),
  dlcDate: z.string().min(10),
  lotNumber: z.string().optional(),
  location: z.string().optional()
});

export const batchSellSchema = z.object({
  quantity: z.number().int().positive()
});

export const updateSettingsSchema = z.object({
  alertDaysBefore: z.number().int().min(1).max(14),
  dailyJobHour: z.number().int().min(0).max(23),
  timezone: z.string().default('Europe/Paris')
});
