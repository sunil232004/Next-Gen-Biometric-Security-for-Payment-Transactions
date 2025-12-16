import { Request, Response } from 'express';
import { UserModel } from '../models/user.model.js';
import { SessionModel } from '../models/session.model.js';
import { BiometricModel } from '../models/biometric.model.js';
import { TransactionModel } from '../models/transaction.model.js';

export class AuthController {
  // Register new user
  static async signup(req: Request, res: Response) {
    try {
      const { email, password, name, phone } = req.body;

      // Validation
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, and name are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        });
      }

      // Create user
      const user = await UserModel.create({ email, password, name, phone });
      
      // Create session
      const session = await SessionModel.create({
        userId: user._id!,
        deviceInfo: req.headers['user-agent'],
        ipAddress: req.ip,
      });

      console.log('[Auth] User registered:', email);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        user: UserModel.toPublic(user),
        token: session.token,
      });
    } catch (error: any) {
      console.error('[Auth] Signup error:', error);
      
      if (error.message === 'Email already registered') {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create account'
      });
    }
  }

  // Login
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isValid = await UserModel.comparePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Create session
      const session = await SessionModel.create({
        userId: user._id!,
        deviceInfo: req.headers['user-agent'],
        ipAddress: req.ip,
      });

      console.log('[Auth] User logged in:', email);

      res.json({
        success: true,
        message: 'Login successful',
        user: UserModel.toPublic(user),
        token: session.token,
      });
    } catch (error) {
      console.error('[Auth] Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }

  // Logout
  static async logout(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        await SessionModel.invalidate(token);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  // Logout from all devices
  static async logoutAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      await SessionModel.invalidateAllForUser(userId);

      res.json({
        success: true,
        message: 'Logged out from all devices'
      });
    } catch (error) {
      console.error('[Auth] Logout all error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to logout from all devices'
      });
    }
  }

  // Get current user
  static async me(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      // Get biometric methods
      const biometrics = await BiometricModel.findByUserId(user._id);
      
      res.json({
        success: true,
        user: UserModel.toPublic(user),
        biometrics: biometrics.map(b => BiometricModel.toPublic(b)),
      });
    } catch (error) {
      console.error('[Auth] Get me error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user info'
      });
    }
  }

  // Update profile
  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { name, phone, profileImage } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (profileImage) updateData.profileImage = profileImage;

      const user = await UserModel.update(userId, updateData);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Profile updated',
        user: UserModel.toPublic(user),
      });
    } catch (error) {
      console.error('[Auth] Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  // Change password
  static async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters'
        });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValid = await UserModel.comparePassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      const hashedPassword = await UserModel.hashPassword(newPassword);
      await UserModel.update(userId, { password: hashedPassword });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('[Auth] Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }

  // Set UPI PIN
  static async setUpiPin(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { pin } = req.body;

      if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({
          success: false,
          message: 'UPI PIN must be 4 digits'
        });
      }

      await UserModel.setUpiPin(userId, pin);

      res.json({
        success: true,
        message: 'UPI PIN set successfully'
      });
    } catch (error) {
      console.error('[Auth] Set UPI PIN error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set UPI PIN'
      });
    }
  }

  // Verify UPI PIN
  static async verifyUpiPin(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { pin } = req.body;

      if (!pin) {
        return res.status(400).json({
          success: false,
          message: 'UPI PIN is required'
        });
      }

      const isValid = await UserModel.verifyUpiPin(userId, pin);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid UPI PIN'
        });
      }

      res.json({
        success: true,
        message: 'UPI PIN verified'
      });
    } catch (error) {
      console.error('[Auth] Verify UPI PIN error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify UPI PIN'
      });
    }
  }

  // Verify password (for sensitive operations)
  static async verifyPassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required'
        });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const isValid = await UserModel.comparePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }

      res.json({
        success: true,
        message: 'Password verified'
      });
    } catch (error) {
      console.error('[Auth] Verify password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify password'
      });
    }
  }

  // Delete account and all data
  static async deleteAccount(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;
      const { password } = req.body;

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify password
      const isValid = await UserModel.comparePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }

      // Delete all user data
      await BiometricModel.deleteByUserId(userId);
      await TransactionModel.deleteByUserId(userId);
      await SessionModel.invalidateAllForUser(userId);
      
      // Delete user
      const db = (await import('../mongodb.js')).getDb();
      await db.collection('users').deleteOne({ _id: userId });

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('[Auth] Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete account'
      });
    }
  }
}
