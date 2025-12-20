/**
 * Voice Command Button Component
 * Floating microphone button that activates voice commands
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

export default function VoiceCommandButton() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const {
        isListening,
        transcript,
        error,
        isSupported,
        startListening,
        stopListening,
        processCommand
    } = useSpeechRecognition();

    const [isProcessing, setIsProcessing] = useState(false);

    // Process transcript when it changes and recognition ends
    useEffect(() => {
        if (!isListening && transcript && !isProcessing) {
            handleCommand(transcript);
        }
    }, [isListening, transcript]);

    // Show error toast
    useEffect(() => {
        if (error) {
            toast({
                title: 'Voice Error',
                description: error === 'not-allowed'
                    ? 'Microphone access denied. Please allow microphone access.'
                    : `Voice recognition error: ${error}`,
                variant: 'destructive'
            });
        }
    }, [error]);

    const handleCommand = async (text: string) => {
        if (!text.trim()) return;

        setIsProcessing(true);

        try {
            const result = await processCommand(text);

            if (result?.action === 'navigate' && result.route) {
                toast({
                    title: 'Voice Command',
                    description: `Navigating to ${result.route.replace(/[/-]/g, ' ').trim()}`
                });
                navigate(result.route);
            } else if (result?.action === 'show_balance') {
                toast({
                    title: 'Voice Command',
                    description: 'Check your balance in the header section'
                });
            } else if (result) {
                toast({
                    title: 'Command not recognized',
                    description: `"${text}" - Try "send money", "recharge", "scan QR", or "history"`,
                    variant: 'destructive'
                });
            }
        } catch (err) {
            console.error('Voice command error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    // Don't render if not supported
    if (!isSupported) {
        return null;
    }

    return (
        <div className="fixed bottom-24 right-4 z-40">
            {/* Transcript display */}
            {(isListening || transcript) && (
                <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-3 min-w-[200px] max-w-[280px] mb-2">
                    <p className="text-xs text-gray-500 mb-1">
                        {isListening ? 'Listening...' : 'Processing...'}
                    </p>
                    <p className="text-sm font-medium">
                        {transcript || 'Speak now...'}
                    </p>
                </div>
            )}

            {/* Mic button */}
            <Button
                onClick={toggleListening}
                disabled={isProcessing}
                className={`
          w-14 h-14 rounded-full shadow-lg
          ${isListening
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-gradient-to-r from-[#00baf2] to-[#0095d9] hover:from-[#0095d9] hover:to-[#00baf2]'}
        `}
            >
                {isProcessing ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : isListening ? (
                    <MicOff className="h-6 w-6 text-white" />
                ) : (
                    <Mic className="h-6 w-6 text-white" />
                )}
            </Button>
        </div>
    );
}
