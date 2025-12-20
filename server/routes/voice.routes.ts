import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * Process voice command
 * POST /api/v2/voice/command
 * Body: { text: string }
 * 
 * This endpoint accepts transcribed voice commands and maps them to app actions.
 * The actual speech-to-text happens in the browser using Web Speech API.
 */
router.post('/command', async (req: Request, res: Response) => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Voice command text is required'
            });
        }

        const command = text.toLowerCase().trim();
        console.log(`[Voice] Received command: "${command}"`);

        // Parse command and return action
        let action: string | null = null;
        let route: string | null = null;
        let params: Record<string, any> = {};

        // Navigation commands
        if (command.includes('send money') || command.includes('transfer')) {
            action = 'navigate';
            route = '/money-transfer';
        } else if (command.includes('recharge') || command.includes('mobile')) {
            action = 'navigate';
            route = '/mobile-recharge';
        } else if (command.includes('scan') || command.includes('qr')) {
            action = 'navigate';
            route = '/qr-scanner';
        } else if (command.includes('history') || command.includes('transactions')) {
            action = 'navigate';
            route = '/transaction-history';
        } else if (command.includes('settings')) {
            action = 'navigate';
            route = '/settings';
        } else if (command.includes('home')) {
            action = 'navigate';
            route = '/';
        } else if (command.includes('balance') || command.includes('check balance')) {
            action = 'show_balance';
        } else if (command.includes('add money')) {
            action = 'navigate';
            route = '/add-money';
        } else if (command.includes('electricity') || command.includes('bill')) {
            action = 'navigate';
            route = '/electricity-bill';
        } else if (command.includes('profile')) {
            action = 'navigate';
            route = '/profile';
        }

        if (action) {
            console.log(`[Voice] Mapped to action: ${action}, route: ${route}`);
            return res.json({
                success: true,
                action,
                route,
                params,
                originalCommand: text
            });
        }

        // Unknown command
        return res.json({
            success: false,
            message: 'Command not recognized',
            originalCommand: text
        });
    } catch (error) {
        console.error('[Voice] Command error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process voice command'
        });
    }
});

export default router;
