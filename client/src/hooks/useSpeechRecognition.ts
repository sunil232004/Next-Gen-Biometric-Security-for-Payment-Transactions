/**
 * Custom hook for Web Speech API integration
 * Converts speech to text in the browser
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface VoiceCommandResult {
    transcript: string;
    action?: string;
    route?: string;
    params?: Record<string, any>;
}

interface UseSpeechRecognitionReturn {
    isListening: boolean;
    transcript: string;
    error: string | null;
    isSupported: boolean;
    startListening: () => void;
    stopListening: () => void;
    processCommand: (text: string) => Promise<VoiceCommandResult | null>;
}

// Web Speech API types (not included in standard lib.dom.d.ts in all versions)
interface WebSpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: {
        length: number;
        [index: number]: {
            isFinal: boolean;
            [index: number]: { transcript: string };
        };
    };
}

interface WebSpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface WebSpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: ((this: WebSpeechRecognition, ev: Event) => any) | null;
    onresult: ((this: WebSpeechRecognition, ev: WebSpeechRecognitionEvent) => any) | null;
    onerror: ((this: WebSpeechRecognition, ev: WebSpeechRecognitionErrorEvent) => any) | null;
    onend: ((this: WebSpeechRecognition, ev: Event) => any) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

interface WebSpeechRecognitionConstructor {
    new(): WebSpeechRecognition;
}

declare global {
    interface Window {
        SpeechRecognition: WebSpeechRecognitionConstructor;
        webkitSpeechRecognition: WebSpeechRecognitionConstructor;
    }
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<WebSpeechRecognition | null>(null);

    // Check if Web Speech API is supported
    const isSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    useEffect(() => {
        if (!isSupported) return;

        const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionClass();

        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            console.log('[Speech] Recognition started');
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            const currentTranscript = finalTranscript || interimTranscript;
            setTranscript(currentTranscript);
            console.log('[Speech] Transcript:', currentTranscript);
        };

        recognition.onerror = (event) => {
            console.error('[Speech] Error:', event.error);
            setError(event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            console.log('[Speech] Recognition ended');
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [isSupported]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            setError('Speech recognition not supported');
            return;
        }

        setTranscript('');
        setError(null);

        try {
            recognitionRef.current.start();
        } catch (err) {
            // May already be running
            console.warn('[Speech] Start error:', err);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    /**
     * Send transcribed command to backend for processing
     */
    const processCommand = useCallback(async (text: string): Promise<VoiceCommandResult | null> => {
        if (!text.trim()) return null;

        try {
            const response = await apiRequest('/api/v2/voice/command', {
                method: 'POST',
                body: { text }
            });

            if (response.success && response.action) {
                return {
                    transcript: text,
                    action: response.action,
                    route: response.route,
                    params: response.params
                };
            }

            return { transcript: text };
        } catch (err) {
            console.error('[Speech] Command processing error:', err);
            return null;
        }
    }, []);

    return {
        isListening,
        transcript,
        error,
        isSupported,
        startListening,
        stopListening,
        processCommand
    };
}
