import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  balance: integer("balance").default(0),
  profileImage: text("profile_image") // Optional profile image (base64 or URL)
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull(),
  description: text("description")
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // recharge, bill_payment, transfer, etc.
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
  description: text("description"),
  timestamp: text("timestamp").notNull(),
  authMethod: text("auth_method"), // fingerprint, face, voice
  createdAt: text("created_at").notNull(),
  metadata: text("metadata") // JSON string for additional transaction data
});

// Biometric authentication table
export const biometricAuth = pgTable("biometric_auth", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // fingerprint, face, voice
  label: text("label"), // e.g., "Right Thumb", "My Face", "My Voice"
  data: text("data").notNull(), // Encrypted biometric data hash
  isActive: integer("is_active").default(1),
  createdAt: text("created_at").notNull()
});

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true });
export const insertBiometricAuthSchema = createInsertSchema(biometricAuth).omit({ id: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertBiometricAuth = z.infer<typeof insertBiometricAuthSchema>;
export type User = typeof users.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type BiometricAuth = typeof biometricAuth.$inferSelect;
