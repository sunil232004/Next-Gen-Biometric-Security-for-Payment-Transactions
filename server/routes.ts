import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { mongoStorage as storage } from "./index";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertTransactionSchema, 
  insertBiometricAuthSchema 
} from "@shared/schema";
import Stripe from "stripe";
import { WebSocket } from 'ws';
import { wss as globalWss } from './index';

// Initialize Stripe with the secret key if provided. Do not crash the app
// when the key is missing — instead expose payment endpoints as unavailable.
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  } catch (err) {
    console.warn('Failed to initialize Stripe:', err);
    stripe = null;
  }
} else {
  console.warn('STRIPE_SECRET_KEY not set — Stripe endpoints will return 503');
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Attach handlers to the shared WebSocket server (created in index.ts)
  if (globalWss) {
    globalWss.on('connection', (ws: WebSocket) => {
      console.log('Client connected');

      ws.on('message', (message: string) => {
        console.log('Received:', message);
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
  }

  // Get services by category
  app.get("/api/services", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      
      if (category) {
        const services = await storage.getServicesByCategory(category);
        return res.json(services);
      } else {
        const services = await storage.getServices();
        return res.json(services);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Get user data
  app.get("/api/user/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Update user profile image
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
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUserProfileImage(id, profileImage);
      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).json({ message: "Failed to update profile image" });
    }
  });

  // Create a new user
  app.post("/api/user", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
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

  // Get user transactions
  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const transactions = await storage.getUserTransactions(userId);
      return res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Create transaction
  app.post("/api/transaction", async (req, res) => {
    try {
      const { userId, type, amount, description, metadata } = req.body;

      if (!userId || !type || !amount) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields"
        });
      }

      const transaction = {
        id: Date.now().toString(),
        userId,
        type,
        amount,
        status: "success",
        description,
        timestamp: new Date().toISOString(),
        metadata
      };

      // In a real app, save to database
      res.json({ success: true, transaction });
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({
        success: false,
        message: "Error creating transaction"
      });
    }
  });

  // Get all biometric methods for a user
  app.get("/api/biometric/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const type = req.query.type as string | undefined;
      const biometrics = await storage.getUserBiometricAuth(userId, type);
      return res.json(biometrics);
    } catch (error) {
      console.error("Error fetching biometric methods:", error);
      res.status(500).json({ message: "Failed to fetch biometric methods" });
    }
  });

  // Register a new biometric method
  app.post("/api/biometric/register", async (req, res) => {
    try {
      const schema = insertBiometricAuthSchema.extend({
        data: z.string().min(10), // Ensure data is substantial
      });
      
      // Parse the base data, excluding createdAt validation
      const parsedData = schema.parse(req.body);
      
      // Explicitly set createdAt as a guaranteed string
      const createdAt: string = req.body.createdAt || new Date().toISOString();
      
      // Construct the complete data object with required createdAt
      const biometricData = {
        ...parsedData,
        createdAt
      };
      
      // Check if user exists
      const user = await storage.getUser(biometricData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const biometric = await storage.createBiometricAuth(biometricData);
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

  // Verify a biometric method
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

      const isVerified = await storage.verifyBiometricAuth(parsedUserId, type, data);

      if (!isVerified) {
        // Log stored biometrics for debugging in development
        try {
          const stored = await storage.getUserBiometricAuth(parsedUserId, type);
          console.warn(`Biometric verify failed. incoming data=${data}. stored count=${stored.length}`);
        } catch (e) {
          console.warn('Could not fetch stored biometrics for debug:', e);
        }
      }

      return res.json({ verified: isVerified });
    } catch (error) {
      console.error("Error verifying biometric method:", error);
      res.status(500).json({ message: "Failed to verify biometric method" });
    }
  });

  // Debug route - list biometric entries for a user (development only)
  app.get('/api/biometric/debug/:userId', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not available' });
    }

    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) return res.status(400).json({ message: 'Invalid userId' });
      const items = await storage.getUserBiometricAuth(userId);
      return res.json(items);
    } catch (err) {
      console.error('Error in biometric debug route:', err);
      return res.status(500).json({ message: 'Error' });
    }
  });

  // Delete a biometric method
  app.delete("/api/biometric/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid biometric ID" });
      }
      
      const success = await storage.deleteBiometricAuth(id);
      
      if (!success) {
        return res.status(404).json({ message: "Biometric method not found" });
      }
      
      return res.json({ message: "Biometric method deleted successfully" });
    } catch (error) {
      console.error("Error deleting biometric method:", error);
      res.status(500).json({ message: "Failed to delete biometric method" });
    }
  });
  
  // Process card payment (add money to wallet or pay bills)
  app.post("/api/card-payment", async (req, res) => {
    try {
      const { userId, amount, cardDetails, paymentType } = req.body;
      
      if (!userId || !amount || !cardDetails) {
        return res.status(400).json({ 
          message: "Missing required fields: userId, amount, cardDetails" 
        });
      }
      
      // Validate user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // In a real application, we would validate the card details and process
      // the payment through a payment gateway like Stripe
      
      // For this demonstration, we'll just simulate a successful payment
      
      let type = "recharge";
      let description = "Added money via card";
      let updateBalance = true;
      
      // Handle different payment types
      if (paymentType === 'credit_card_bill') {
        type = "payment";
        description = "Paid credit card bill";
        updateBalance = false; // Don't update wallet balance for bill payments
      }
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        type,
        amount,
        status: "success",
        description,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        metadata: JSON.stringify({
          paymentMethod: "card",
          cardLast4: cardDetails.cardNumber.slice(-4),
          paymentType
        })
      });
      
      // Update user balance only for recharges, not for bill payments
      if (transaction.status === "success" && updateBalance) {
        await storage.updateUserBalance(userId, amount);
      }
      
      return res.status(201).json({ 
        success: true, 
        transaction 
      });
    } catch (error) {
      console.error("Error processing card payment:", error);
      res.status(500).json({ 
        message: "Failed to process card payment" 
      });
    }
  });

  // Stripe: Create a payment intent
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured' });
      }
      const { amount } = req.body;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "inr",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });
  
  // Stripe: Webhook for payment events
  app.post("/api/stripe-webhook", async (req, res) => {
    const payload = req.body;
    
    try {
      const event = payload;
      
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          
          // Extract metadata
          const metadata = paymentIntent.metadata;
          const userId = parseInt(metadata.userId);
          const purpose = metadata.purpose;
          const amount = paymentIntent.amount / 100; // Convert from cents to rupees
          
          // If it's a valid user (not a guest checkout), update their balance
          if (!isNaN(userId) && userId > 0) {
            // Create a transaction record
            await storage.createTransaction({
              userId,
              type: purpose === 'wallet_recharge' ? 'recharge' : 'payment',
              amount,
              status: "success",
              description: purpose === 'wallet_recharge' ? 
                "Added money via Stripe" : "Payment via Stripe",
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              metadata: JSON.stringify({
                paymentMethod: "stripe",
                paymentIntentId: paymentIntent.id,
                purpose
              })
            });
            
            // Only update balance for wallet recharges
            if (purpose === 'wallet_recharge') {
              await storage.updateUserBalance(userId, amount);
            }
          }
          
          console.log('PaymentIntent was successful!', paymentIntent.id);
          break;
          
        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object;
          console.log('Payment failed:', failedPaymentIntent.id);
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      // Return a 200 response to acknowledge receipt of the event
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Error processing Stripe webhook:', error);
      res.status(400).send(`Webhook Error: ${error.message || 'Unknown error'}`);
    }
  });

  // Verify payment endpoint
  app.post("/api/verify-payment", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ success: false, message: 'Stripe not configured' });
      }
      const { paymentIntentId } = req.body;

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === "succeeded") {
        // Create a transaction record
        const transaction = await storage.createTransaction({
          userId: req.body.userId,
          type: "payment",
          amount: paymentIntent.amount / 100, // Convert from cents
          status: "success",
          description: "Card payment",
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          metadata: JSON.stringify({
            paymentIntentId,
            paymentMethod: "card"
          })
        });

        // Update user balance
        await storage.updateUserBalance(req.body.userId, paymentIntent.amount / 100);

        res.json({ success: true, transaction });
      } else {
        res.status(400).json({ 
          success: false, 
          message: "Payment verification failed" 
        });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error verifying payment" 
      });
    }
  });

  // Verify biometric authentication
  app.post("/api/verify-biometric", async (req, res) => {
    try {
      const { userId, authType, authData } = req.body;

      if (!userId || !authType || !authData) {
        return res.status(400).json({ success: false, message: 'Missing required fields: userId, authType, authData' });
      }

      const parsedUserId = parseInt(userId as any, 10);
      if (isNaN(parsedUserId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId' });
      }

      // Use the storage helper that compares stored biometrics for the user
      const isVerified = await storage.verifyBiometricAuth(parsedUserId, authType, authData);

      if (isVerified) {
        return res.json({ success: true });
      }

      return res.status(401).json({ success: false, message: 'Biometric verification failed' });
    } catch (error) {
      console.error("Error verifying biometric:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error verifying biometric" 
      });
    }
  });

  // Set UPI PIN
  app.post("/api/set-upi-pin", async (req, res) => {
    try {
      const { userId, upiPin } = req.body;

      if (!userId || !upiPin) {
        return res.status(400).json({ 
          success: false, 
          message: "User ID and UPI PIN are required" 
        });
      }

      // Validate UPI PIN format (4 digits)
      if (!/^\d{4}$/.test(upiPin)) {
        return res.status(400).json({ 
          success: false, 
          message: "UPI PIN must be 4 digits" 
        });
      }

      // For demo purposes, we'll consider any 4-digit PIN as valid
      res.json({ 
        success: true, 
        message: "UPI PIN set successfully" 
      });
    } catch (error) {
      console.error("Error setting UPI PIN:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error setting UPI PIN" 
      });
    }
  });

  // Verify UPI PIN
  app.post("/api/verify-upi-pin", async (req, res) => {
    try {
      const { userId, upiPin } = req.body;

      if (!userId || !upiPin) {
        return res.status(400).json({ 
          success: false, 
          message: "User ID and UPI PIN are required" 
        });
      }

      // For demo purposes, accept any 4-digit PIN
      const isValid = /^\d{4}$/.test(upiPin);

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

  // Process UPI PIN payment
  app.post("/api/process-upi-payment", async (req, res) => {
    try {
      const { userId, amount, upiPin } = req.body;

      if (!userId || !amount || !upiPin) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields" 
        });
      }

      // For demo purposes, verify PIN format only
      const isValid = /^\d{4}$/.test(upiPin);
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid UPI PIN" 
        });
      }

      // Create transaction record
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

  return httpServer;
}
