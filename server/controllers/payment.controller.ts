import { Request, Response } from 'express';
import { UserModel } from '../models/user.model.js';
import { TransactionModel } from '../models/transaction.model.js';
import { BiometricModel } from '../models/biometric.model.js';
import { MockStripe } from '../services/stripe.js';

const stripe = new MockStripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');

export class PaymentController {
  // Process UPI payment
  static async processUpiPayment(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { recipientUpi, amount, pin, description } = req.body;

      if (!recipientUpi || !amount || !pin) {
        return res.status(400).json({
          success: false,
          message: 'Recipient UPI, amount, and PIN are required'
        });
      }

      // Verify UPI PIN
      const isPinValid = await UserModel.verifyUpiPin(userId, pin);
      if (!isPinValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid UPI PIN'
        });
      }

      // Check balance
      const user = await UserModel.findById(userId);
      if (!user || user.balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }

      // Create transaction
      const transaction = await TransactionModel.create({
        userId,
        accountId: user.accountId,
        type: 'payment',
        amount,
        currency: 'INR',
        status: 'processing',
        description: description || `UPI payment to ${recipientUpi}`,
        recipientId: recipientUpi,
        recipientName: recipientUpi.split('@')[0],
        paymentMethod: 'upi',
      });

      try {
        // Deduct balance
        await UserModel.updateBalance(userId, -amount);
        
        // Update transaction status
        await TransactionModel.updateStatus(transaction._id!.toString(), 'completed');

        console.log(`[Payment] UPI payment of ₹${amount} from user ${userId} to ${recipientUpi}`);

        res.json({
          success: true,
          message: 'Payment successful',
          transaction: {
            ...transaction,
            status: 'completed',
          },
        });
      } catch (err) {
        await TransactionModel.updateStatus(transaction._id!.toString(), 'failed');
        throw err;
      }
    } catch (error) {
      console.error('[Payment] UPI payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Payment failed'
      });
    }
  }

  // Process biometric payment
  static async processBiometricPayment(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { recipientUpi, amount, biometricType, biometricData, description } = req.body;

      if (!recipientUpi || !amount || !biometricType || !biometricData) {
        return res.status(400).json({
          success: false,
          message: 'Recipient UPI, amount, biometric type, and biometric data are required'
        });
      }

      // Verify biometric
      const biometricResult = await BiometricModel.verify(userId, biometricType, biometricData);
      if (!biometricResult.success) {
        return res.status(401).json({
          success: false,
          message: biometricResult.message
        });
      }

      // Check balance
      const user = await UserModel.findById(userId);
      if (!user || user.balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }

      // Create transaction
      const transaction = await TransactionModel.create({
        userId,
        accountId: user.accountId,
        type: 'payment',
        amount,
        currency: 'INR',
        status: 'processing',
        description: description || `Biometric payment to ${recipientUpi}`,
        recipientId: recipientUpi,
        recipientName: recipientUpi.split('@')[0],
        paymentMethod: 'biometric',
        biometricType,
      });

      try {
        // Deduct balance
        await UserModel.updateBalance(userId, -amount);
        
        // Update transaction status
        await TransactionModel.updateStatus(transaction._id!.toString(), 'completed');

        console.log(`[Payment] Biometric (${biometricType}) payment of ₹${amount} from user ${userId}`);

        res.json({
          success: true,
          message: 'Payment successful',
          transaction: {
            ...transaction,
            status: 'completed',
          },
        });
      } catch (err) {
        await TransactionModel.updateStatus(transaction._id!.toString(), 'failed');
        throw err;
      }
    } catch (error) {
      console.error('[Payment] Biometric payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Payment failed'
      });
    }
  }

  // Process card payment (using mock Stripe)
  static async processCardPayment(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { amount, paymentMethodId, description } = req.body;

      if (!amount || !paymentMethodId) {
        return res.status(400).json({
          success: false,
          message: 'Amount and payment method are required'
        });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to paisa
        currency: 'inr',
        payment_method: paymentMethodId,
        confirm: true,
        metadata: { userId: userId.toString() },
      });

      // Get user for accountId
      const user = await UserModel.findById(userId);

      // Create transaction
      const transaction = await TransactionModel.create({
        userId,
        accountId: user?.accountId,
        type: 'payment',
        amount,
        currency: 'INR',
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
        description: description || 'Card payment',
        paymentMethod: 'card',
        stripePaymentId: paymentIntent.id,
        metadata: { paymentIntentId: paymentIntent.id },
      });

      if (paymentIntent.status === 'succeeded') {
        console.log(`[Payment] Card payment of ₹${amount} from user ${userId}`);
      }

      res.json({
        success: paymentIntent.status === 'succeeded',
        message: paymentIntent.status === 'succeeded' ? 'Payment successful' : 'Payment failed',
        transaction,
        paymentIntent,
      });
    } catch (error) {
      console.error('[Payment] Card payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Payment failed'
      });
    }
  }

  // Add money to wallet
  static async addMoney(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { amount, paymentMethodId, source } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid amount is required'
        });
      }

      let stripePaymentId = null;

      // If using card, process through Stripe
      if (paymentMethodId) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: 'inr',
          payment_method: paymentMethodId,
          confirm: true,
          metadata: { userId: userId.toString(), type: 'add_money' },
        });

        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({
            success: false,
            message: 'Payment failed'
          });
        }

        stripePaymentId = paymentIntent.id;
      }

      // Add balance
      await UserModel.updateBalance(userId, amount);

      // Get user for accountId
      const user = await UserModel.findById(userId);

      // Create transaction
      const transaction = await TransactionModel.create({
        userId,
        accountId: user?.accountId,
        type: 'add_money',
        amount,
        currency: 'INR',
        status: 'completed',
        description: `Added ₹${amount} to wallet`,
        paymentMethod: paymentMethodId ? 'card' : (source || 'bank_transfer'),
        stripePaymentId: stripePaymentId || undefined,
      });

      // Re-fetch user for updated balance
      const updatedUser = await UserModel.findById(userId);

      console.log(`[Payment] Added ₹${amount} to wallet for user ${userId}`);

      res.json({
        success: true,
        message: 'Money added successfully',
        transaction,
        newBalance: updatedUser?.balance,
      });
    } catch (error) {
      console.error('[Payment] Add money error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add money'
      });
    }
  }

  // Transfer money to another user
  static async transfer(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { recipientEmail, recipientPhone, amount, pin, description } = req.body;

      console.log('[Payment] Transfer request:', { recipientEmail, recipientPhone, amount });

      if (!amount || (!recipientEmail && !recipientPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Amount and recipient (email or phone) are required'
        });
      }

      if (!pin) {
        return res.status(400).json({
          success: false,
          message: 'UPI PIN is required'
        });
      }

      // Verify PIN (skip for demo if no PIN set)
      const sender = await UserModel.findById(userId);
      const isPinValid = sender && sender.upiPin ? await UserModel.verifyUpiPin(userId, pin) : pin === '1234';
      if (!isPinValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid UPI PIN'
        });
      }

      // Find recipient
      let recipient;
      if (recipientEmail) {
        console.log('[Payment] Looking for recipient by email:', recipientEmail);
        recipient = await UserModel.findByEmail(recipientEmail);
      } else if (recipientPhone) {
        console.log('[Payment] Looking for recipient by phone:', recipientPhone);
        recipient = await UserModel.findByPhone(recipientPhone);
      }

      if (!recipient) {
        console.log('[Payment] Recipient not found:', { recipientEmail, recipientPhone });
        return res.status(400).json({
          success: false,
          message: recipientEmail ? `Recipient with email ${recipientEmail} not found` : `Recipient with phone ${recipientPhone} not found`
        });
      }

      console.log('[Payment] Recipient found:', recipient.email);

      if (recipient._id!.equals(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot transfer to yourself'
        });
      }

      // Check balance
      if (!sender || sender.balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }

      // Create sender transaction
      const senderTransaction = await TransactionModel.create({
        userId,
        accountId: sender.accountId,
        type: 'transfer',
        amount,
        currency: 'INR',
        status: 'processing',
        description: description || `Transfer to ${recipient.name}`,
        recipientId: recipient._id!.toString(),
        recipientName: recipient.name,
        paymentMethod: 'wallet',
      });

      try {
        // Deduct from sender
        await UserModel.updateBalance(userId, -amount);
        
        // Add to recipient
        await UserModel.updateBalance(recipient._id!, amount);
        
        // Update transaction status
        await TransactionModel.updateStatus(senderTransaction._id!.toString(), 'completed');

        // Create recipient transaction
        await TransactionModel.create({
          userId: recipient._id!,
          accountId: recipient.accountId,
          type: 'add_money',
          amount,
          currency: 'INR',
          status: 'completed',
          description: `Received from ${sender.name}`,
          paymentMethod: 'wallet',
          metadata: { senderId: userId.toString(), senderName: sender.name },
        });

        console.log(`[Payment] Transfer of ₹${amount} from ${sender.email} to ${recipient.email}`);

        res.json({
          success: true,
          message: 'Transfer successful',
          transaction: {
            ...senderTransaction,
            status: 'completed',
          },
        });
      } catch (err) {
        await TransactionModel.updateStatus(senderTransaction._id!.toString(), 'failed');
        throw err;
      }
    } catch (error) {
      console.error('[Payment] Transfer error:', error);
      res.status(500).json({
        success: false,
        message: 'Transfer failed'
      });
    }
  }

  // Process recharge (mobile, DTH, etc.)
  static async processRecharge(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { type, number, operator, plan, amount, pin } = req.body;

      if (!type || !number || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Recharge type, number, and amount are required'
        });
      }

      if (!pin) {
        return res.status(400).json({
          success: false,
          message: 'UPI PIN is required'
        });
      }

      // Verify PIN
      const isPinValid = await UserModel.verifyUpiPin(userId, pin);
      if (!isPinValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid UPI PIN'
        });
      }

      // Check balance
      const user = await UserModel.findById(userId);
      if (!user || user.balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }

      // Create transaction
      const transaction = await TransactionModel.create({
        userId,
        accountId: user.accountId,
        type: 'recharge',
        amount,
        currency: 'INR',
        status: 'processing',
        description: `${type} recharge for ${number}`,
        recipientId: number,
        recipientName: operator,
        paymentMethod: 'wallet',
        metadata: { rechargeType: type, plan },
      });

      try {
        // Deduct balance
        await UserModel.updateBalance(userId, -amount);
        
        // Simulate recharge processing (in production, call operator API)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update transaction status
        await TransactionModel.updateStatus(transaction._id!.toString(), 'completed');

        console.log(`[Payment] ${type} recharge of ₹${amount} for ${number}`);

        res.json({
          success: true,
          message: 'Recharge successful',
          transaction: {
            ...transaction,
            status: 'completed',
          },
        });
      } catch (err) {
        await TransactionModel.updateStatus(transaction._id!.toString(), 'failed');
        throw err;
      }
    } catch (error) {
      console.error('[Payment] Recharge error:', error);
      res.status(500).json({
        success: false,
        message: 'Recharge failed'
      });
    }
  }

  // Get user balance
  static async getBalance(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        balance: user.balance,
        currency: 'INR',
      });
    } catch (error) {
      console.error('[Payment] Get balance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get balance'
      });
    }
  }
}
