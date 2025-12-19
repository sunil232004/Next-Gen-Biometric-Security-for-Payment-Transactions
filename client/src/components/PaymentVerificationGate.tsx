import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Fingerprint, 
  Camera, 
  Mic, 
  Check, 
  X,
  AlertCircle,
  Loader2,
  Shield,
  Lock,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useWebAuthn } from '@/hooks/use-webauthn';

type BiometricType = 'fingerprint' | 'face' | 'voice';

interface PaymentVerificationGateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (method: BiometricType) => void;
  amount?: number;
  recipient?: string;
  description?: string;
}

export default function PaymentVerificationGate({
  isOpen,
  onClose,
  onSuccess,
  amount,
  recipient,
  description
}: PaymentVerificationGateProps) {
  const { toast } = useToast();
  const { user, biometrics } = useAuth();
  
  // WebAuthn hook for fingerprint
  const {
    isSupported: webAuthnSupported,
    isPlatformAvailable,
    isLoading: webAuthnLoading,
    error: webAuthnError,
    verifyFingerprint: verifyWebAuthnFingerprint,
    clearError: clearWebAuthnError
  } = useWebAuthn();
  
  const [selectedMethod, setSelectedMethod] = useState<BiometricType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [webAuthnAvailable, setWebAuthnAvailable] = useState(false);
  
  // Camera and microphone refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Get available biometric methods for user
  const availableMethods = biometrics?.map(b => b.type) || [];
  const hasFingerprint = availableMethods.includes('fingerprint');
  const hasFace = availableMethods.includes('face');
  const hasVoice = availableMethods.includes('voice');
  
  // Always show fingerprint and voice options regardless of registration
  // Face requires registration since it needs stored data for comparison
  const showFingerprint = true; // Always available
  const showVoice = true; // Always available  
  const showFace = hasFace; // Only if registered
  const hasAnyBiometric = true; // At least fingerprint/voice always available

  // Check WebAuthn availability
  useEffect(() => {
    setWebAuthnAvailable(webAuthnSupported && isPlatformAvailable);
  }, [webAuthnSupported, isPlatformAvailable]);

  // Cleanup media streams
  const cleanupMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    audioChunksRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cleanupMediaStream();
    };
  }, [cleanupMediaStream]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMethod(null);
      setIsProcessing(false);
      setError(null);
      setVerificationStatus('idle');
      cleanupMediaStream();
      clearWebAuthnError();
    }
  }, [isOpen, cleanupMediaStream, clearWebAuthnError]);

  // Verify biometric data
  const verifyBiometric = async (type: BiometricType, data: string): Promise<boolean> => {
    try {
      const response = await apiRequest('/api/v2/biometric/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('paytm_auth_token')}`
        },
        body: { type, data }
      });

      return response.success === true && response.verified === true;
    } catch (err: any) {
      console.error(`${type} verification error:`, err);
      throw err;
    }
  };

  // Fingerprint verification using WebAuthn when available
  const handleFingerprintVerify = async () => {
    setIsProcessing(true);
    setError(null);
    setVerificationStatus('verifying');

    try {
      // Try WebAuthn first (real fingerprint hardware)
      if (webAuthnAvailable) {
        // Get stored WebAuthn credential IDs for this user
        const fingerprintBiometric = biometrics?.find(b => b.type === 'fingerprint');
        let credentialIds: string[] | undefined;
        
        if (fingerprintBiometric?.data) {
          try {
            const bioData = JSON.parse(fingerprintBiometric.data);
            if (bioData.webauthn && bioData.credentialId) {
              credentialIds = [bioData.credentialId];
            }
          } catch (e) {
            // Not WebAuthn data, continue with verification
          }
        }

        const result = await verifyWebAuthnFingerprint(credentialIds);
        
        if (result.success) {
          setVerificationStatus('success');
          toast({
            title: 'Verification Successful',
            description: 'Fingerprint verified. Processing payment...'
          });
          setTimeout(() => {
            onSuccess('fingerprint');
          }, 500);
          return;
        } else if (result.error?.includes('cancel') || result.error?.includes('abort')) {
          setVerificationStatus('failed');
          setError('Verification was cancelled. Please try again.');
          setIsProcessing(false);
          return;
        }
        // If WebAuthn fails (non-cancel), fall through to server verification
      }

      // Fallback to server verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const fingerprintData = `fp_verify_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
      const success = await verifyBiometric('fingerprint', fingerprintData);
      
      if (success) {
        setVerificationStatus('success');
        toast({
          title: 'Verification Successful',
          description: 'Fingerprint verified. Processing payment...'
        });
        setTimeout(() => {
          onSuccess('fingerprint');
        }, 500);
      } else {
        throw new Error('Fingerprint verification failed');
      }
    } catch (err: any) {
      setVerificationStatus('failed');
      setError(err.message || 'Fingerprint verification failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Face verification - auto-capture for payment (quick verification)
  const startFaceCapture = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      mediaStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Auto-capture after 2.5 seconds for quick payment verification
        setTimeout(() => {
          captureFaceAndVerify();
        }, 2500);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please grant camera permissions.');
      setIsProcessing(false);
    }
  };

  const captureFaceAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setVerificationStatus('verifying');

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Canvas context not available');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const faceData = canvas.toDataURL('image/jpeg', 0.8);
      cleanupMediaStream();
      
      const success = await verifyBiometric('face', faceData);
      
      if (success) {
        setVerificationStatus('success');
        toast({
          title: 'Verification Successful',
          description: 'Face verified. Processing payment...'
        });
        setTimeout(() => {
          onSuccess('face');
        }, 500);
      } else {
        throw new Error('Face verification failed');
      }
    } catch (err: any) {
      setVerificationStatus('failed');
      setError(err.message || 'Face verification failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Voice verification
  const startVoiceRecording = async () => {
    setIsProcessing(true);
    setError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setVerificationStatus('verifying');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          try {
            const voiceData = reader.result as string;
            const success = await verifyBiometric('voice', voiceData);
            
            if (success) {
              setVerificationStatus('success');
              toast({
                title: 'Verification Successful',
                description: 'Voice verified. Processing payment...'
              });
              setTimeout(() => {
                onSuccess('voice');
              }, 500);
            } else {
              throw new Error('Voice verification failed');
            }
          } catch (err: any) {
            setVerificationStatus('failed');
            setError(err.message || 'Voice verification failed. Please try again.');
          } finally {
            setIsProcessing(false);
          }
        };
        
        reader.readAsDataURL(audioBlob);
        cleanupMediaStream();
      };
      
      mediaRecorder.start();
      
      // Record for 3 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 3000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setError('Unable to access microphone. Please grant microphone permissions.');
      setIsProcessing(false);
    }
  };

  const handleMethodSelect = (method: BiometricType) => {
    setSelectedMethod(method);
    setError(null);
    setVerificationStatus('idle');
    cleanupMediaStream();
  };

  const handleVerify = () => {
    switch (selectedMethod) {
      case 'fingerprint':
        handleFingerprintVerify();
        break;
      case 'face':
        // Auto-capture flow - just start camera, it will auto-capture
        startFaceCapture();
        break;
      case 'voice':
        startVoiceRecording();
        break;
    }
  };

  const handleRetry = () => {
    setError(null);
    setVerificationStatus('idle');
    cleanupMediaStream();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Verify Payment</h2>
              <p className="text-white/80 text-sm">Biometric authentication required</p>
            </div>
          </div>
          
          {/* Payment details */}
          {amount !== undefined && (
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Amount</span>
                <span className="text-2xl font-bold">₹{amount.toLocaleString()}</span>
              </div>
              {recipient && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-white/80">To</span>
                  <span className="font-medium">{recipient}</span>
                </div>
              )}
              {description && (
                <p className="text-white/60 text-sm mt-2">{description}</p>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {!hasAnyBiometric ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No Security Credentials Set Up</h3>
              <p className="text-gray-500 mb-4">
                Please set up at least one security credential (fingerprint, face, or voice) to make payments.
              </p>
              <Button onClick={() => {
                onClose();
                window.location.href = '/security-credentials';
              }}>Set Up Security Credentials</Button>
            </div>
          ) : !selectedMethod ? (
            <>
              <h3 className="font-semibold text-lg mb-4">Select Verification Method</h3>
              <div className="space-y-3">
                {showFingerprint && (
                  <button
                    onClick={() => handleMethodSelect('fingerprint')}
                    className="w-full flex items-center gap-4 p-4 border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Fingerprint className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium">Fingerprint</p>
                      <p className="text-sm text-gray-500">
                        {webAuthnAvailable ? 'Use device biometrics' : 'Quick and secure'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {hasFingerprint && (
                        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          Registered
                        </div>
                      )}
                      {webAuthnAvailable && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          <Smartphone className="w-3 h-3" />
                          <span>Native</span>
                        </div>
                      )}
                    </div>
                  </button>
                )}
                
                {showVoice && (
                  <button
                    onClick={() => handleMethodSelect('voice')}
                    className="w-full flex items-center gap-4 p-4 border-2 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Mic className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium">Voice Recognition</p>
                      <p className="text-sm text-gray-500">Speak to verify</p>
                    </div>
                    {hasVoice && (
                      <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        Registered
                      </div>
                    )}
                  </button>
                )}
                
                {showFace && (
                  <button
                    onClick={() => handleMethodSelect('face')}
                    className="w-full flex items-center gap-4 p-4 border-2 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium">Face Recognition</p>
                      <p className="text-sm text-gray-500">Look at the camera</p>
                    </div>
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      Registered
                    </div>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-4">
              {/* Back to method selection */}
              <button
                onClick={() => {
                  setSelectedMethod(null);
                  cleanupMediaStream();
                }}
                className="text-blue-600 text-sm mb-4 hover:underline"
                disabled={isProcessing}
              >
                ← Choose different method
              </button>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Fingerprint Verification */}
              {selectedMethod === 'fingerprint' && (
                <div className="text-center">
                  <div 
                    className={`w-24 h-24 mx-auto mb-4 border-4 rounded-full flex items-center justify-center transition-all ${
                      verificationStatus === 'verifying' ? 'border-blue-500 animate-pulse' :
                      verificationStatus === 'success' ? 'border-green-500 bg-green-50' :
                      verificationStatus === 'failed' ? 'border-red-500 bg-red-50' :
                      'border-gray-300'
                    }`}
                  >
                    {verificationStatus === 'success' ? (
                      <Check className="w-12 h-12 text-green-500" />
                    ) : verificationStatus === 'failed' ? (
                      <X className="w-12 h-12 text-red-500" />
                    ) : verificationStatus === 'verifying' ? (
                      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    ) : (
                      <Fingerprint className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">
                    {verificationStatus === 'verifying' ? 'Verifying fingerprint...' :
                     verificationStatus === 'success' ? 'Verified!' :
                     verificationStatus === 'failed' ? 'Verification failed' :
                     'Touch the fingerprint sensor'}
                  </p>
                </div>
              )}

              {/* Face Verification */}
              {selectedMethod === 'face' && (
                <div className="text-center">
                  <div className="w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden border-4 border-gray-300 bg-gray-100">
                    {verificationStatus === 'success' ? (
                      <div className="w-full h-full flex items-center justify-center bg-green-50">
                        <Check className="w-16 h-16 text-green-500" />
                      </div>
                    ) : verificationStatus === 'failed' ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-50">
                        <X className="w-16 h-16 text-red-500" />
                      </div>
                    ) : (
                      <>
                        <video 
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          autoPlay
                          playsInline
                          muted
                        />
                        {!mediaStreamRef.current && !isProcessing && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Camera className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <p className="text-gray-600 mb-4">
                    {verificationStatus === 'verifying' ? 'Verifying face...' :
                     verificationStatus === 'success' ? 'Verified!' :
                     verificationStatus === 'failed' ? 'Verification failed' :
                     mediaStreamRef.current ? 'Position your face and click Verify' :
                     'Click to start camera'}
                  </p>
                </div>
              )}

              {/* Voice Verification */}
              {selectedMethod === 'voice' && (
                <div className="text-center">
                  <div 
                    className={`w-24 h-24 mx-auto mb-4 border-4 rounded-full flex items-center justify-center transition-all ${
                      isProcessing && verificationStatus !== 'verifying' ? 'border-purple-500 animate-pulse' :
                      verificationStatus === 'verifying' ? 'border-blue-500' :
                      verificationStatus === 'success' ? 'border-green-500 bg-green-50' :
                      verificationStatus === 'failed' ? 'border-red-500 bg-red-50' :
                      'border-gray-300'
                    }`}
                  >
                    {verificationStatus === 'success' ? (
                      <Check className="w-12 h-12 text-green-500" />
                    ) : verificationStatus === 'failed' ? (
                      <X className="w-12 h-12 text-red-500" />
                    ) : isProcessing ? (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div 
                            key={i}
                            className="w-1.5 bg-purple-500 rounded-full animate-pulse"
                            style={{ 
                              height: `${15 + Math.random() * 20}px`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <Mic className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">
                    {isProcessing && verificationStatus !== 'verifying' ? 'Recording... Speak now!' :
                     verificationStatus === 'verifying' ? 'Verifying voice...' :
                     verificationStatus === 'success' ? 'Verified!' :
                     verificationStatus === 'failed' ? 'Verification failed' :
                     'Click to start recording'}
                  </p>
                  {!isProcessing && verificationStatus === 'idle' && (
                    <p className="text-xs text-gray-400">Say: "My voice is my password"</p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3 mt-6">
                {verificationStatus === 'failed' ? (
                  <Button 
                    className="w-full"
                    size="lg"
                    onClick={handleRetry}
                  >
                    Try Again
                  </Button>
                ) : verificationStatus !== 'success' ? (
                  <Button 
                    className="w-full"
                    size="lg"
                    onClick={handleVerify}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        {selectedMethod === 'face' && mediaStreamRef.current ? 'Capturing...' :
                         selectedMethod === 'voice' ? 'Recording...' : 'Verifying...'}
                      </>
                    ) : selectedMethod === 'face' && mediaStreamRef.current ? (
                      'Capture & Verify'
                    ) : selectedMethod === 'face' ? (
                      'Start Camera'
                    ) : (
                      'Verify'
                    )}
                  </Button>
                ) : null}
                
                <Button 
                  variant="ghost" 
                  className="w-full text-gray-500"
                  onClick={onClose}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
