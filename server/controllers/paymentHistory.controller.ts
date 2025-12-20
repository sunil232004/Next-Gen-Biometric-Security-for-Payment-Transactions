import { Request, Response } from 'express';
import { PaymentHistoryModel, PaymentType, PaymentStatus, PaymentMethod, PaymentDirection } from '../models/paymentHistory.model.js';
import { ObjectId } from 'mongodb';

export class PaymentHistoryController {
  
  // Get all payment history for the authenticated user with pagination and filters
  static async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const {
        page = '1',
        limit = '20',
        type,
        status,
        paymentMethod,
        direction,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        type: type as PaymentType,
        status: status as PaymentStatus,
        paymentMethod: paymentMethod as PaymentMethod,
        direction: direction as PaymentDirection,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
        sortBy: (sortBy === 'completedAt' ? 'updatedAt' : sortBy) as 'createdAt' | 'amount' | 'updatedAt',
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await PaymentHistoryModel.findByUserId(userId, options);
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      res.json({
        success: true,
        data: result.transactions.map((tx) => PaymentHistoryModel.toPublic(tx)),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNum)
        }
      });
    } catch (error) {
      console.error('[PaymentHistory] Get all error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment history'
      });
    }
  }

  // Get single payment by ID
  static async getById(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment ID'
        });
      }

      const payment = await PaymentHistoryModel.findById(id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Ensure user owns this payment
      if (!payment.userId.equals(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: PaymentHistoryModel.toPublic(payment)
      });
    } catch (error) {
      console.error('[PaymentHistory] Get by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment details'
      });
    }
  }

  // Get payment by transaction ID
  static async getByTransactionId(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { transactionId } = req.params;

      const payment = await PaymentHistoryModel.findByTransactionId(transactionId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Ensure user owns this payment
      if (!payment.userId.equals(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: PaymentHistoryModel.toPublic(payment)
      });
    } catch (error) {
      console.error('[PaymentHistory] Get by transaction ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment details'
      });
    }
  }

  // Get recent payments
  static async getRecent(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const limit = parseInt(req.query.limit as string) || 5;

      const payments = await PaymentHistoryModel.getRecent(userId, Math.min(limit, 20));

      res.json({
        success: true,
        data: payments.map((tx) => PaymentHistoryModel.toPublic(tx))
      });
    } catch (error) {
      console.error('[PaymentHistory] Get recent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent payments'
      });
    }
  }

  // Get payment statistics
  static async getStatistics(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { startDate, endDate, period } = req.query;

      let start: Date | undefined;
      let end: Date | undefined;

      // Handle period shortcuts
      if (period) {
        const now = new Date();
        switch (period) {
          case 'today':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = now;
            break;
          case 'week':
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            end = now;
            break;
          case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = now;
            break;
          case 'year':
            start = new Date(now.getFullYear(), 0, 1);
            end = now;
            break;
        }
      } else {
        start = startDate ? new Date(startDate as string) : undefined;
        end = endDate ? new Date(endDate as string) : undefined;
      }

      const stats = await PaymentHistoryModel.getStatistics(userId, { startDate: start, endDate: end });

      res.json({
        success: true,
        data: stats,
        period: {
          startDate: start,
          endDate: end
        }
      });
    } catch (error) {
      console.error('[PaymentHistory] Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment statistics'
      });
    }
  }

  // Search payments
  static async search(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { q, limit = '50' } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const payments = await PaymentHistoryModel.search(userId, q, parseInt(limit as string));

      res.json({
        success: true,
        data: payments.map((tx) => PaymentHistoryModel.toPublic(tx)),
        count: payments.length
      });
    } catch (error) {
      console.error('[PaymentHistory] Search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search payments'
      });
    }
  }

  // Get monthly summary
  static async getMonthlySummary(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const now = new Date();
      const year = parseInt(req.query.year as string) || now.getFullYear();
      const month = parseInt(req.query.month as string) || now.getMonth() + 1;

      if (month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: 'Invalid month (must be 1-12)'
        });
      }

      const summary = await PaymentHistoryModel.getMonthlySummary(userId, year, month);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('[PaymentHistory] Get monthly summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch monthly summary'
      });
    }
  }

  // Create new payment record (internal use, typically called from payment services)
  static async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const {
        type,
        direction,
        amount,
        currency = 'INR',
        status = 'initiated',
        paymentMethod,
        paymentMethodDetails,
        senderDetails,
        receiverDetails,
        description,
        category,
        remarks,
        fee,
        tax,
        externalReferenceId,
        balanceBefore,
        metadata
      } = req.body;

      // Validate required fields
      if (!type || !direction || !amount || !paymentMethod || !description) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: type, direction, amount, paymentMethod, description'
        });
      }

      const payment = await PaymentHistoryModel.create({
        userId: new ObjectId(userId),
        type,
        direction,
        amount,
        currency,
        status,
        paymentMethod,
        paymentMethodDetails,
        senderDetails,
        receiverDetails,
        description,
        category,
        remarks,
        fee,
        tax,
        externalReferenceId,
        balanceBefore,
        metadata,
        initiatedAt: new Date()
      });

      res.status(201).json({
        success: true,
        data: PaymentHistoryModel.toPublic(payment),
        message: 'Payment record created successfully'
      });
    } catch (error) {
      console.error('[PaymentHistory] Create error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment record'
      });
    }
  }

  // Update payment status (internal use)
  static async updateStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { id } = req.params;
      const { status, reason, completedAt, balanceAfter, errorDetails } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment ID'
        });
      }

      // Verify ownership
      const existingPayment = await PaymentHistoryModel.findById(id);
      if (!existingPayment || !existingPayment.userId.equals(userId)) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      const payment = await PaymentHistoryModel.updateStatus(id, status, {
        reason,
        updatedBy: userId.toString(),
        balanceAfter,
        errorDetails
      });

      if (!payment) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update payment status'
        });
      }

      res.json({
        success: true,
        data: PaymentHistoryModel.toPublic(payment),
        message: 'Payment status updated successfully'
      });
    } catch (error) {
      console.error('[PaymentHistory] Update status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment status'
      });
    }
  }
}
