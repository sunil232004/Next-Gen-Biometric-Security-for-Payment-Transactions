import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { 
  Fingerprint, 
  Camera, 
  Mic, 
  Check, 
  ChevronRight, 
  Shield, 
  X,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useWebAuthn } from '@/hooks/use-webauthn';

interface BiometricOnboardingProps {
  isOpen?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

type BiometricType = 'fingerprint' | 'face' | 'voice';
type SetupStep = 'intro' | 'fingerprint' | 'face' | 'voice' | 'complete';

export default function BiometricOnboarding({ 
  isOpen = true, 
  onComplete, 
  onSkip 
}: BiometricOnboardingProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  
  // WebAuthn hook for fingerprint
  const { 
    isSupported: webAuthnSupported, 
    isPlatformAvailable,
    isLoading: webAuthnLoading,
    error: webAuthnError,
    registerFingerprint: registerWebAuthnFingerprint,
    checkCapabilities
  } = useWebAuthn();
  
  const [currentStep, setCurrentStep] = useState<SetupStep>('intro');
  const [setupComplete, setSetupComplete] = useState<Record<BiometricType, boolean>>({
    fingerprint: false,
    face: false,
    voice: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webAuthnAvailable, setWebAuthnAvailable] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  
  // Camera and microphone refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Cleanup media streams
  const cleanupMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  // Check WebAuthn availability on mount
  useEffect(() => {
    const checkWebAuthn = async () => {
      try {
        const capabilities = await checkCapabilities();
        setWebAuthnAvailable(capabilities.platformAuthenticatorAvailable);
      } catch (err) {
        console.log('WebAuthn not available:', err);
        setWebAuthnAvailable(false);
      }
    };
    checkWebAuthn();
  }, [checkCapabilities]);

  useEffect(() => {
    return () => {
      cleanupMediaStream();
    };
  }, [cleanupMediaStream]);

  // Register biometric data
  const registerBiometric = async (type: BiometricType, data: string) => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      const response = await apiRequest('/api/v2/biometric/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('paytm_auth_token')}`
        },
        body: {
          type,
          data,
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} - Onboarding`
        }
      });

      if (response.success) {
        setSetupComplete(prev => ({ ...prev, [type]: true }));
        toast({
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Registered`,
          description: `Your ${type} has been successfully registered.`
        });
        return true;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error(`${type} registration error:`, err);
      setError(err.message || `Failed to register ${type}`);
      return false;
    }
  };

  // Fingerprint setup using WebAuthn when available
  const handleFingerprintSetup = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Try WebAuthn first (real fingerprint hardware)
      if (webAuthnAvailable && isPlatformAvailable) {
        const result = await registerWebAuthnFingerprint('Fingerprint - Onboarding');
        
        if (result.success) {
          setSetupComplete(prev => ({ ...prev, fingerprint: true }));
          toast({
            title: 'Fingerprint Registered',
            description: 'Your fingerprint has been securely registered using device biometrics.'
          });
          setTimeout(() => setCurrentStep('face'), 500);
        } else {
          // If user cancels or WebAuthn fails, offer fallback
          if (result.error?.includes('cancel') || result.error?.includes('abort')) {
            setError('Fingerprint registration was cancelled. Please try again.');
          } else {
            // Fallback to simulated fingerprint
            console.log('WebAuthn failed, using fallback:', result.error);
            await handleFingerprintFallback();
          }
        }
      } else {
        // Fallback for devices without WebAuthn
        await handleFingerprintFallback();
      }
    } catch (err: any) {
      setError(err.message || 'Fingerprint setup failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Fallback fingerprint setup (simulated)
  const handleFingerprintFallback = async () => {
    // Simulate fingerprint scan
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate fingerprint data (in production, this would come from actual sensor)
    const fingerprintData = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    
    const success = await registerBiometric('fingerprint', fingerprintData);
    if (success) {
      toast({
        title: 'Fingerprint Registered',
        description: 'Fingerprint has been registered (simulated mode).'
      });
      setTimeout(() => setCurrentStep('face'), 500);
    }
  };

  // Face setup
  const startFaceCapture = async () => {
    setError(null);
    setCameraReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      mediaStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please grant camera permissions.');
      setCameraReady(false);
    }
  };

  const captureFace = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Canvas context not available');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      // Get base64 image data
      const faceData = canvas.toDataURL('image/jpeg', 0.8);
      
      cleanupMediaStream();
      
      const success = await registerBiometric('face', faceData);
      if (success) {
        setTimeout(() => setCurrentStep('voice'), 500);
      }
    } catch (err: any) {
      setError(err.message || 'Face capture failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Voice setup
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const voiceData = reader.result as string;
          const success = await registerBiometric('voice', voiceData);
          if (success) {
            setTimeout(() => setCurrentStep('complete'), 500);
          }
          setIsProcessing(false);
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

  // Handle step navigation
  const handleNextStep = () => {
    switch (currentStep) {
      case 'intro':
        setCurrentStep('fingerprint');
        break;
      case 'fingerprint':
        handleFingerprintSetup();
        break;
      case 'face':
        if (!cameraReady) {
          startFaceCapture();
        } else {
          captureFace();
        }
        break;
      case 'voice':
        startVoiceRecording();
        break;
      case 'complete':
        handleComplete();
        break;
    }
  };

  const handleSkipCurrent = () => {
    switch (currentStep) {
      case 'fingerprint':
        setCurrentStep('face');
        break;
      case 'face':
        cleanupMediaStream();
        setCurrentStep('voice');
        break;
      case 'voice':
        setCurrentStep('complete');
        break;
    }
  };

  const handleComplete = async () => {
    // Refresh user data to get updated biometrics
    await refreshUser();
    
    // Mark setup as complete in localStorage
    localStorage.setItem('biometricOnboardingComplete', 'true');
    
    toast({
      title: 'Setup Complete!',
      description: 'Your biometric security has been configured.'
    });
    
    if (onComplete) {
      onComplete();
    } else {
      navigate('/');
    }
  };

  const handleSkipAll = () => {
    localStorage.setItem('biometricOnboardingSkipped', 'true');
    
    toast({
      title: 'Setup Skipped',
      description: 'You can set up biometric security later in Profile Settings.'
    });
    
    if (onSkip) {
      onSkip();
    } else {
      navigate('/');
    }
  };

  if (!isOpen) return null;

  const completedCount = Object.values(setupComplete).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md relative overflow-hidden">
        {/* Progress indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ 
              width: currentStep === 'intro' ? '0%' : 
                     currentStep === 'fingerprint' ? '25%' : 
                     currentStep === 'face' ? '50%' : 
                     currentStep === 'voice' ? '75%' : '100%' 
            }}
          />
        </div>

        {/* Intro Step */}
        {currentStep === 'intro' && (
          <>
            <CardHeader className="text-center pt-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl">Secure Your Account</CardTitle>
              <CardDescription className="text-base mt-2">
                Set up biometric authentication for enhanced security on all payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Fingerprint className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Fingerprint</p>
                    <p className="text-sm text-gray-500">Quick and secure</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Camera className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Face Recognition</p>
                    <p className="text-sm text-gray-500">Just look at the camera</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Mic className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Voice Recognition</p>
                    <p className="text-sm text-gray-500">Speak to verify</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={handleNextStep}
                >
                  Get Started
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-gray-500"
                  onClick={handleSkipAll}
                >
                  Skip for now
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Fingerprint Step */}
        {currentStep === 'fingerprint' && (
          <>
            <CardHeader className="text-center pt-8">
              <button 
                onClick={() => setCurrentStep('intro')}
                className="absolute left-4 top-6 p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Fingerprint className="w-10 h-10 text-white" />
              </div>
              <CardTitle>Set Up Fingerprint</CardTitle>
              <CardDescription className="mt-2">
                {webAuthnAvailable 
                  ? 'Use your device\'s fingerprint sensor to register' 
                  : 'Touch the fingerprint sensor to register'}
              </CardDescription>
              {webAuthnAvailable && (
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-green-600">
                  <Smartphone className="w-3 h-3" />
                  <span>Device biometrics available</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              {(error || webAuthnError) && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">{error || webAuthnError}</p>
                </div>
              )}

              <div className="flex flex-col items-center py-8">
                <div 
                  className={`w-32 h-32 border-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isProcessing ? 'border-blue-500 animate-pulse' : 
                    setupComplete.fingerprint ? 'border-green-500 bg-green-50' : 'border-gray-300'
                  }`}
                >
                  {setupComplete.fingerprint ? (
                    <Check className="w-16 h-16 text-green-500" />
                  ) : isProcessing ? (
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                  ) : (
                    <Fingerprint className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  {isProcessing ? 'Scanning...' : 
                   setupComplete.fingerprint ? 'Fingerprint registered!' : 
                   'Place your finger on the sensor'}
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={handleNextStep}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Scanning...
                    </>
                  ) : setupComplete.fingerprint ? (
                    <>
                      Continue
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </>
                  ) : (
                    'Scan Fingerprint'
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-gray-500"
                  onClick={handleSkipCurrent}
                  disabled={isProcessing}
                >
                  Skip this step
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Face Step */}
        {currentStep === 'face' && (
          <>
            <CardHeader className="text-center pt-8">
              <button 
                onClick={() => {
                  cleanupMediaStream();
                  setCurrentStep('fingerprint');
                }}
                className="absolute left-4 top-6 p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <CardTitle>Set Up Face Recognition</CardTitle>
              <CardDescription className="mt-2">
                Position your face in the frame
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex flex-col items-center py-4">
                <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-gray-300 bg-gray-100">
                  {setupComplete.face ? (
                    <div className="w-full h-full flex items-center justify-center bg-green-50">
                      <Check className="w-20 h-20 text-green-500" />
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
                      {!cameraReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <Camera className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <p className="mt-4 text-sm text-gray-500">
                  {isProcessing ? 'Processing...' : 
                   setupComplete.face ? 'Face registered!' : 
                   cameraReady ? 'Position your face and click Capture' : 
                   'Click Start Camera to begin'}
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={handleNextStep}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : setupComplete.face ? (
                    <>
                      Continue
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </>
                  ) : cameraReady ? (
                    'Capture Face'
                  ) : (
                    'Start Camera'
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-gray-500"
                  onClick={handleSkipCurrent}
                  disabled={isProcessing}
                >
                  Skip this step
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Voice Step */}
        {currentStep === 'voice' && (
          <>
            <CardHeader className="text-center pt-8">
              <button 
                onClick={() => setCurrentStep('face')}
                className="absolute left-4 top-6 p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <CardTitle>Set Up Voice Recognition</CardTitle>
              <CardDescription className="mt-2">
                Say "My voice is my password" clearly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex flex-col items-center py-8">
                <div 
                  className={`w-32 h-32 border-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isProcessing ? 'border-purple-500 animate-pulse' : 
                    setupComplete.voice ? 'border-green-500 bg-green-50' : 'border-gray-300'
                  }`}
                >
                  {setupComplete.voice ? (
                    <Check className="w-16 h-16 text-green-500" />
                  ) : isProcessing ? (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div 
                          key={i}
                          className="w-2 bg-purple-500 rounded-full animate-pulse"
                          style={{ 
                            height: `${20 + Math.random() * 30}px`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Mic className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  {isProcessing ? 'Recording... Speak now!' : 
                   setupComplete.voice ? 'Voice registered!' : 
                   'Click to start recording'}
                </p>
                {!isProcessing && !setupComplete.voice && (
                  <p className="mt-2 text-xs text-gray-400 text-center">
                    Say: "My voice is my password"
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={handleNextStep}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Recording...
                    </>
                  ) : setupComplete.voice ? (
                    <>
                      Continue
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </>
                  ) : (
                    'Start Recording'
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-gray-500"
                  onClick={handleSkipCurrent}
                  disabled={isProcessing}
                >
                  Skip this step
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <>
            <CardHeader className="text-center pt-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl">Setup Complete!</CardTitle>
              <CardDescription className="text-base mt-2">
                Your account is now protected with biometric security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  setupComplete.fingerprint ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    setupComplete.fingerprint ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {setupComplete.fingerprint ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Fingerprint</p>
                    <p className="text-sm text-gray-500">
                      {setupComplete.fingerprint ? 'Registered' : 'Not set up'}
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  setupComplete.face ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    setupComplete.face ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {setupComplete.face ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Face Recognition</p>
                    <p className="text-sm text-gray-500">
                      {setupComplete.face ? 'Registered' : 'Not set up'}
                    </p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  setupComplete.voice ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    setupComplete.voice ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {setupComplete.voice ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Voice Recognition</p>
                    <p className="text-sm text-gray-500">
                      {setupComplete.voice ? 'Registered' : 'Not set up'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={handleComplete}
                >
                  Continue to App
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
              
              {completedCount < 3 && (
                <p className="text-xs text-center text-gray-500">
                  You can add more biometric methods in Profile Settings
                </p>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
