import { Request, Response } from 'express';
import { TransactionModel } from '../models/transaction.model.js';

export class TransactionController {
  // Get all transactions for user
  static async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;

      let query: any = { userId };
      if (type) {
        query.type = type;
      }

      const { transactions, total } = await TransactionModel.findByUserId(userId, { 
        page, 
        limit,
        type 
      });

      res.json({
        success: true,
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('[Transaction] Get all error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transactions'
      });
    }
  }

  // Get single transaction
  static async getById(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { id } = req.params;

      const transaction = await TransactionModel.findById(id);

      if (!transaction || !transaction.userId.equals(userId)) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        transaction,
      });
    } catch (error) {
      console.error('[Transaction] Get by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transaction'
      });
    }
  }

  // Get transaction summary/stats
  static async getStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const period = req.query.period as string || 'month'; // day, week, month, year

      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'month':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      const { transactions } = await TransactionModel.findByUserId(userId, { limit: 1000 });
      
      const periodTransactions = transactions.filter(t => new Date(t.createdAt) >= startDate);

      const stats = {
        totalTransactions: periodTransactions.length,
        totalSpent: 0,
        totalReceived: 0,
        byType: {} as Record<string, { count: number; amount: number }>,
        byPaymentMethod: {} as Record<string, { count: number; amount: number }>,
      };

      for (const t of periodTransactions) {
        if (t.status === 'completed') {
          if (t.type === 'payment' || t.type === 'transfer' || t.type === 'recharge') {
            stats.totalSpent += t.amount;
          } else if (t.type === 'add_money') {
            stats.totalReceived += t.amount;
          }

          // By type
          if (!stats.byType[t.type]) {
            stats.byType[t.type] = { count: 0, amount: 0 };
          }
          stats.byType[t.type].count++;
          stats.byType[t.type].amount += t.amount;

          // By payment method
          if (t.paymentMethod) {
            if (!stats.byPaymentMethod[t.paymentMethod]) {
              stats.byPaymentMethod[t.paymentMethod] = { count: 0, amount: 0 };
            }
            stats.byPaymentMethod[t.paymentMethod].count++;
            stats.byPaymentMethod[t.paymentMethod].amount += t.amount;
          }
        }
      }

      res.json({
        success: true,
        period,
        startDate,
        stats,
      });
    } catch (error) {
      console.error('[Transaction] Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transaction stats'
      });
    }
  }

  // Get recent transactions (last 5)
  static async getRecent(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const limit = parseInt(req.query.limit as string) || 5;

      const { transactions } = await TransactionModel.findByUserId(userId, { 
        page: 1, 
        limit 
      });

      res.json({
        success: true,
        transactions,
      });
    } catch (error) {
      console.error('[Transaction] Get recent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recent transactions'
      });
    }
  }

  // Search transactions
  static async search(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { query, startDate, endDate, minAmount, maxAmount, status, type } = req.query;

      const { transactions } = await TransactionModel.findByUserId(userId, { limit: 500 });

      let filtered = transactions;

      // Filter by description/recipient
      if (query) {
        const searchStr = (query as string).toLowerCase();
        filtered = filtered.filter(t => 
          t.description?.toLowerCase().includes(searchStr) ||
          t.recipientName?.toLowerCase().includes(searchStr) ||
          t.recipientId?.toLowerCase().includes(searchStr)
        );
      }

      // Filter by date range
      if (startDate) {
        const start = new Date(startDate as string);
        filtered = filtered.filter(t => new Date(t.createdAt) >= start);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        filtered = filtered.filter(t => new Date(t.createdAt) <= end);
      }

      // Filter by amount
      if (minAmount) {
        filtered = filtered.filter(t => t.amount >= parseFloat(minAmount as string));
      }
      if (maxAmount) {
        filtered = filtered.filter(t => t.amount <= parseFloat(maxAmount as string));
      }

      // Filter by status
      if (status) {
        filtered = filtered.filter(t => t.status === status);
      }

      // Filter by type
      if (type) {
        filtered = filtered.filter(t => t.type === type);
      }

      res.json({
        success: true,
        transactions: filtered,
        count: filtered.length,
      });
    } catch (error) {
      console.error('[Transaction] Search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search transactions'
      });
    }
  }
}
