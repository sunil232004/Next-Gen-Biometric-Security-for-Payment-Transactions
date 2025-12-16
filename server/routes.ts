import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { WebSocket } from 'ws';
import { wss as globalWss, mongoStorage as legacyStorage } from './index.js';

// Import new route modules
import authRoutes from './routes/auth.routes.js';
import biometricRoutes from './routes/biometric.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import paymentRoutes from './routes/payment.routes.js';

// Import for mock Stripe
import { createStripeInstance, MockStripe } from "./services/stripe.js";

// Import legacy schemas for backward compatibility
import { 
  insertUserSchema, 
  insertTransactionSchema, 
  insertBiometricAuthSchema 
} from "./schema.js";

// Initialize mock Stripe
let stripe: MockStripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = createStripeInstance(process.env.STRIPE_SECRET_KEY);
    console.log('[Stripe] Mock payment gateway initialized');
  } catch (err) {
    console.warn('Failed to initialize mock Stripe:', err);
    stripe = createStripeInstance('sk_test_mock_default_key');
  }
} else {
  console.warn('STRIPE_SECRET_KEY not set — Using default mock key');
  stripe = createStripeInstance('sk_test_mock_default_key');
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Attach WebSocket handlers
  if (globalWss) {
    globalWss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');

      ws.on('message', (message: string) => {
        console.log('WebSocket message received:', message);
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });
    });
  }

  // ============================================
  // NEW AUTHENTICATED API ROUTES (v2)
  // ============================================
  
  // Auth routes: /api/v2/auth/*
  app.use('/api/v2/auth', authRoutes);
  
  // Biometric routes: /api/v2/biometric/*
  app.use('/api/v2/biometric', biometricRoutes);
  
  // Transaction routes: /api/v2/transactions/*
  app.use('/api/v2/transactions', transactionRoutes);
  
  // Payment routes: /api/v2/payments/*
  app.use('/api/v2/payments', paymentRoutes);

  // ============================================
  // LEGACY API ROUTES (v1 - backward compatibility)
  // ============================================

  // Get services by category
  app.get("/api/services", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      
      if (category) {
        const services = await legacyStorage.getServicesByCategory(category);
        return res.json(services);
      } else {
        const services = await legacyStorage.getServices();
        return res.json(services);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Legacy: Get user data (numeric ID)
  app.get("/api/user/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await legacyStorage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Legacy: Update user profile image
  app.post("/api/user/:id/profile-image", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const { profileImage } = req.body;
      if (!profileImage) {
        return res.status(400).json({ message: "Profile image is required" });
      }
      
      const user = await legacyStorage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await legacyStorage.updateUserProfileImage(id, profileImage);
      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ message: "Failed to update profile image" });
    }
  });

  // Legacy: Create a new user
  app.post("/api/user", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await legacyStorage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const user = await legacyStorage.createUser(userData);
      return res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: error.errors 
        });
      }
      
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Legacy: Get user transactions
  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const transactions = await legacyStorage.getUserTransactions(userId);
      return res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Legacy: Create transaction
  app.post("/api/transaction", async (req, res) => {
    try {
      const { userId, type, amount, description, metadata, status } = req.body;
      console.log('[Transaction] Creating transaction:', { userId, type, amount });

      if (!userId || !type || amount === undefined) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: userId, type, and amount are required"
        });
      }

      const transaction = await legacyStorage.createTransaction({
        userId: Number(userId),
        type,
        amount: Number(amount),
        status: status || "success",
        description: description || `${type} transaction`,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        metadata: metadata || '{}'
      });

      console.log('[Transaction] Created:', transaction);
      res.json({ success: true, transaction });
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({
        success: false,
        message: "Error creating transaction"
      });
    }
  });

  // Legacy: Get biometric methods for a user
  app.get("/api/biometric/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const type = req.query.type as string | undefined;
      const biometrics = await legacyStorage.getUserBiometricAuth(userId, type);
      return res.json(biometrics);
    } catch (error) {
      console.error("Error fetching biometric methods:", error);
      res.status(500).json({ message: "Failed to fetch biometric methods" });
    }
  });

  // Legacy: Register biometric method
  app.post("/api/biometric/register", async (req, res) => {
    try {
      const schema = insertBiometricAuthSchema.extend({
        data: z.string().min(10),
      });
      
      const parsedData = schema.parse(req.body);
      const createdAt: string = req.body.createdAt || new Date().toISOString();
      
      const biometricData = {
        ...parsedData,
        createdAt
      };
      
      const user = await legacyStorage.getUser(biometricData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const biometric = await legacyStorage.createBiometricAuth(biometricData);
      return res.status(201).json(biometric);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid biometric data", 
          errors: error.errors 
        });
      }
      
      console.error("Error registering biometric method:", error);
      res.status(500).json({ message: "Failed to register biometric method" });
    }
  });

  // Legacy: Verify biometric
  app.post("/api/biometric/verify", async (req, res) => {
    try {
      const { userId, type, data } = req.body;

      if (!userId || !type || !data) {
        return res.status(400).json({
          message: "Missing required fields: userId, type, data"
        });
      }

      const parsedUserId = parseInt(userId as any, 10);
      if (isNaN(parsedUserId)) {
        return res.status(400).json({ message: 'Invalid userId' });
      }

      const isVerified = await legacyStorage.verifyBiometricAuth(parsedUserId, type, data);
      return res.json({ verified: isVerified });
    } catch (error) {
      console.error("Error verifying biometric method:", error);
      res.status(500).json({ message: "Failed to verify biometric method" });
    }
  });

  // Legacy: Delete biometric method
  app.delete("/api/biometric/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid biometric ID" });
      }

      const result = await legacyStorage.deleteBiometricAuth(id);
      if (!result) {
        return res.status(404).json({ message: "Biometric method not found" });
      }

      return res.json({ success: true, message: "Biometric method deleted" });
    } catch (error) {
      console.error("Error deleting biometric method:", error);
      res.status(500).json({ message: "Failed to delete biometric method" });
    }
  });

  // ============================================
  // PAYMENT ENDPOINTS (legacy)
  // ============================================

  // Legacy: Create payment intent (mock Stripe)
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = 'inr' } = req.body;
      
      if (!amount || isNaN(Number(amount))) {
        return res.status(400).json({
          success: false,
          message: "Valid amount is required"
        });
      }

      if (!stripe) {
        return res.status(500).json({
          success: false,
          message: "Payment gateway not initialized"
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(amount) * 100),
        currency,
      });

      return res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating payment"
      });
    }
  });

  // Legacy: Process payment
  app.post("/api/process-payment", async (req, res) => {
    try {
      const { paymentIntentId, userId, amount, description } = req.body;
      
      console.log('[Payment] Processing:', { paymentIntentId, userId, amount });

      if (!paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: "Payment intent ID is required"
        });
      }

      if (!stripe) {
        return res.status(500).json({
          success: false,
          message: "Payment gateway not initialized"
        });
      }

      // Confirm the payment
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Create transaction record
        if (userId && amount) {
          await legacyStorage.createTransaction({
            userId: Number(userId),
            type: 'payment',
            amount: Number(amount),
            status: 'success',
            description: description || 'Card payment',
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            metadata: JSON.stringify({ paymentIntentId })
          });
        }

        return res.json({
          success: true,
          paymentIntent
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Payment failed',
          status: paymentIntent.status
        });
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      return res.status(500).json({
        success: false,
        message: "Error processing payment"
      });
    }
  });

  // Legacy: Get payment status
  app.get("/api/payment-status/:paymentIntentId", async (req, res) => {
    try {
      const { paymentIntentId } = req.params;
      
      if (!stripe) {
        return res.status(500).json({
          success: false,
          message: "Payment gateway not initialized"
        });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      return res.json({
        success: true,
        status: paymentIntent?.status,
        paymentIntent
      });
    } catch (error) {
      console.error("Error fetching payment status:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching payment status"
      });
    }
  });

  // Legacy: UPI PIN operations
  app.post("/api/set-upi-pin", async (req, res) => {
    try {
      const { userId, pin } = req.body;

      if (!userId || !pin) {
        return res.status(400).json({
          success: false,
          message: "User ID and PIN are required"
        });
      }

      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({
          success: false,
          message: "PIN must be exactly 4 digits"
        });
      }

      const parsedUserId = parseInt(userId, 10);
      if (isNaN(parsedUserId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID"
        });
      }

      await legacyStorage.setUPIPin(parsedUserId, pin);
      res.json({ success: true, message: "UPI PIN set successfully" });
    } catch (error) {
      console.error("Error setting UPI PIN:", error);
      res.status(500).json({
        success: false,
        message: "Error setting UPI PIN"
      });
    }
  });

  app.post("/api/verify-upi-pin", async (req, res) => {
    try {
      const { userId, pin } = req.body;

      if (!userId || !pin) {
        return res.status(400).json({
          success: false,
          message: "User ID and PIN are required"
        });
      }

      const parsedUserId = parseInt(userId, 10);
      if (isNaN(parsedUserId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID"
        });
      }

      const isValid = await legacyStorage.verifyUPIPin(parsedUserId, pin);

      if (isValid) {
        res.json({ success: true });
      } else {
        res.status(401).json({
          success: false,
          message: "Invalid UPI PIN"
        });
      }
    } catch (error) {
      console.error("Error verifying UPI PIN:", error);
      res.status(500).json({
        success: false,
        message: "Error verifying UPI PIN"
      });
    }
  });

  // Legacy: Process UPI PIN payment
  app.post("/api/process-upi-payment", async (req, res) => {
    try {
      const { userId, amount, upiPin } = req.body;

      if (!userId || !amount || !upiPin) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields"
        });
      }

      const isValid = /^\d{4}$/.test(upiPin);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid UPI PIN"
        });
      }

      const transaction = {
        id: Date.now().toString(),
        userId,
        type: "payment",
        amount,
        status: "success",
        description: "UPI PIN payment",
        timestamp: new Date().toISOString(),
        metadata: JSON.stringify({
          paymentMethod: "upi_pin"
        })
      };

      res.json({
        success: true,
        transaction
      });
    } catch (error) {
      console.error("Error processing UPI payment:", error);
      res.status(500).json({
        success: false,
        message: "Error processing payment"
      });
    }
  });

  // ============================================
  // UTILITY ENDPOINTS
  // ============================================

  // API version info
  app.get("/api/version", (req, res) => {
    res.json({
      version: "2.0.0",
      legacySupport: true,
      endpoints: {
        v1: "/api/*",
        v2: "/api/v2/*"
      }
    });
  });

  return httpServer;
}
