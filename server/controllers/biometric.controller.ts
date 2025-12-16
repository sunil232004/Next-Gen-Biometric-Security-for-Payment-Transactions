import { Request, Response } from 'express';
import { BiometricModel } from '../models/biometric.model.js';

export class BiometricController {
  // Register biometric
  static async register(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { type, data, label } = req.body;

      if (!type || !data) {
        return res.status(400).json({
          success: false,
          message: 'Biometric type and data are required'
        });
      }

      if (!['fingerprint', 'face', 'voice'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid biometric type. Must be fingerprint, face, or voice'
        });
      }

      const biometric = await BiometricModel.create({
        userId,
        type,
        data,
        label,
      });

      console.log(`[Biometric] Registered ${type} for user ${userId}`);

      res.status(201).json({
        success: true,
        message: `${type} registered successfully`,
        biometric: BiometricModel.toPublic(biometric),
      });
    } catch (error: any) {
      console.error('[Biometric] Register error:', error);
      
      if (error.message.includes('already registered')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to register biometric'
      });
    }
  }

  // Get user's biometrics
  static async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const biometrics = await BiometricModel.findByUserId(userId);

      res.json({
        success: true,
        biometrics: biometrics.map(b => BiometricModel.toPublic(b)),
      });
    } catch (error) {
      console.error('[Biometric] Get all error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get biometrics'
      });
    }
  }

  // Get specific biometric type
  static async getByType(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { type } = req.params;

      const biometric = await BiometricModel.findByUserAndType(userId, type);

      if (!biometric) {
        return res.status(404).json({
          success: false,
          message: `No ${type} biometric registered`
        });
      }

      res.json({
        success: true,
        biometric: BiometricModel.toPublic(biometric),
      });
    } catch (error) {
      console.error('[Biometric] Get by type error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get biometric'
      });
    }
  }

  // Verify biometric
  static async verify(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { type, data } = req.body;

      if (!type || !data) {
        return res.status(400).json({
          success: false,
          verified: false,
          message: 'Biometric type and data are required'
        });
      }

      const result = await BiometricModel.verify(userId, type, data);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          verified: false,
          message: result.message
        });
      }

      console.log(`[Biometric] Verified ${type} for user ${userId}`);

      res.json({
        success: true,
        verified: true,
        message: result.message,
        biometricId: result.biometricId,
      });
    } catch (error) {
      console.error('[Biometric] Verify error:', error);
      res.status(500).json({
        success: false,
        verified: false,
        message: 'Failed to verify biometric'
      });
    }
  }

  // Toggle biometric active status
  static async toggle(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { id } = req.params;

      const biometric = await BiometricModel.findById(id);

      if (!biometric || !biometric.userId.equals(userId)) {
        return res.status(404).json({
          success: false,
          message: 'Biometric not found'
        });
      }

      await BiometricModel.toggleActive(id);
      const updated = await BiometricModel.findById(id);

      res.json({
        success: true,
        message: `Biometric ${updated?.isActive ? 'enabled' : 'disabled'}`,
        biometric: updated ? BiometricModel.toPublic(updated) : null,
      });
    } catch (error) {
      console.error('[Biometric] Toggle error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle biometric'
      });
    }
  }

  // Delete biometric
  static async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { id } = req.params;

      const biometric = await BiometricModel.findById(id);

      if (!biometric || !biometric.userId.equals(userId)) {
        return res.status(404).json({
          success: false,
          message: 'Biometric not found'
        });
      }

      await BiometricModel.delete(id);

      console.log(`[Biometric] Deleted ${biometric.type} for user ${userId}`);

      res.json({
        success: true,
        message: `${biometric.type} deleted successfully`
      });
    } catch (error) {
      console.error('[Biometric] Delete error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete biometric'
      });
    }
  }

  // Update biometric label
  static async updateLabel(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { id } = req.params;
      const { label } = req.body;

      const biometric = await BiometricModel.findById(id);

      if (!biometric || !biometric.userId.equals(userId)) {
        return res.status(404).json({
          success: false,
          message: 'Biometric not found'
        });
      }

      await BiometricModel.update(id, { label });
      const updated = await BiometricModel.findById(id);

      res.json({
        success: true,
        message: 'Label updated',
        biometric: updated ? BiometricModel.toPublic(updated) : null,
      });
    } catch (error) {
      console.error('[Biometric] Update label error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update label'
      });
    }
  }
}
