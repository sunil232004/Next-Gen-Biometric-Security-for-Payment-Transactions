import { Express } from 'express';
import paymentRoutes from './payment';

export async function registerRoutes(app: Express) {
  // Register payment routes
  app.use('/api', paymentRoutes);
} 