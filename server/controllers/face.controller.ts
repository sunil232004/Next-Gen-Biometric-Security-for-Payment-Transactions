import { Request, Response } from 'express';
import { UserModel } from '../models/user.model.js';

/**
 * Euclidean distance between two face embeddings
 */
function calculateDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

export class FaceController {
    /**
     * Register face embedding
     * POST /api/v2/face/register
     * Body: { embedding: number[] }
     */
    static async register(req: Request, res: Response) {
        try {
            const userId = (req as any).user._id;
            const { embedding } = req.body;

            if (!embedding || !Array.isArray(embedding)) {
                return res.status(400).json({
                    success: false,
                    message: 'Face embedding is required'
                });
            }

            // Validate embedding length (should be 128)
            if (embedding.length !== 128) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid embedding length. Expected 128 dimensions.'
                });
            }

            // Save embedding to user document
            const updatedUser = await UserModel.update(userId, {
                faceEmbedding: embedding
            });

            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            console.log(`[Face] Registered face embedding for user ${userId}`);

            res.json({
                success: true,
                message: 'Face registered successfully'
            });
        } catch (error) {
            console.error('[Face] Register error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to register face'
            });
        }
    }

    /**
     * Verify face embedding
     * POST /api/v2/face/verify
     * Body: { embedding: number[] }
     */
    static async verify(req: Request, res: Response) {
        try {
            const userId = (req as any).user._id;
            const { embedding } = req.body;

            if (!embedding || !Array.isArray(embedding)) {
                return res.status(400).json({
                    success: false,
                    verified: false,
                    message: 'Face embedding is required'
                });
            }

            // Get user's stored embedding
            const user = await UserModel.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    verified: false,
                    message: 'User not found'
                });
            }

            if (!user.faceEmbedding || user.faceEmbedding.length === 0) {
                return res.status(400).json({
                    success: false,
                    verified: false,
                    message: 'No face registered for this user'
                });
            }

            // Calculate distance
            const distance = calculateDistance(embedding, user.faceEmbedding);
            const threshold = 0.6;
            const verified = distance < threshold;

            console.log(`[Face] Verification for user ${userId}: distance=${distance.toFixed(4)}, verified=${verified}`);

            res.json({
                success: true,
                verified,
                distance: Math.round(distance * 10000) / 10000,
                message: verified ? 'Face verified successfully' : 'Face verification failed'
            });
        } catch (error) {
            console.error('[Face] Verify error:', error);
            res.status(500).json({
                success: false,
                verified: false,
                message: 'Failed to verify face'
            });
        }
    }

    /**
     * Check if user has registered face
     * GET /api/v2/face/status
     */
    static async status(req: Request, res: Response) {
        try {
            const userId = (req as any).user._id;
            const user = await UserModel.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const hasRegisteredFace = !!(user.faceEmbedding && user.faceEmbedding.length === 128);

            res.json({
                success: true,
                registered: hasRegisteredFace
            });
        } catch (error) {
            console.error('[Face] Status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check face status'
            });
        }
    }
}
