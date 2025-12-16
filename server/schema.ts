import { z } from "zod";

// User schema
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  balance: z.number().default(0),
  profileImage: z.string().nullable().optional(),
});

export const userSchema = insertUserSchema.extend({
  id: z.number(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;

// Service schema
export const insertServiceSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  icon: z.string().min(1),
  description: z.string().nullable().optional(),
});

export const serviceSchema = insertServiceSchema.extend({
  id: z.number(),
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = z.infer<typeof serviceSchema>;

// Transaction schema
export const insertTransactionSchema = z.object({
  userId: z.number(),
  type: z.string().min(1),
  amount: z.number(),
  status: z.string().min(1),
  timestamp: z.string(),
  description: z.string().nullable().optional(),
  metadata: z.string().nullable().optional(),
  authMethod: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

export const transactionSchema = insertTransactionSchema.extend({
  id: z.number(),
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = z.infer<typeof transactionSchema>;

// Biometric Auth schema
export const insertBiometricAuthSchema = z.object({
  userId: z.number(),
  type: z.string().min(1),
  data: z.string().min(1),
  label: z.string().nullable().optional(),
  isActive: z.union([z.boolean(), z.number()]).default(true),
  createdAt: z.string(),
});

export const biometricAuthSchema = insertBiometricAuthSchema.extend({
  id: z.number(),
});

export type InsertBiometricAuth = z.infer<typeof insertBiometricAuthSchema>;
export type BiometricAuth = z.infer<typeof biometricAuthSchema>;
