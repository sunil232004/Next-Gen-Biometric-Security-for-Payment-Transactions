import React, { useState, useRef, useEffect } from 'react';
import { X, Fingerprint, Camera, Mic, AlertCircle, Check } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/api";

type BiometricType = 'fingerprint' | 'face' | 'voice';

interface BiometricAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (type: BiometricType, data: string) => void;
  mode: 'register' | 'verify';
  userId?: number;
}

// Add necessary feature policy meta tags
if (typeof document !== 'undefined') {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Feature-Policy';
  meta.content = "camera 'self'; microphone 'self'; geolocation 'self'";
  document.head.appendChild(meta);
}

export default function BiometricAuthModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  userId = 1
}: BiometricAuthModalProps) {
  const { toast } = useToast();
  const [activeMethod, setActiveMethod] = useState<BiometricType | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [label, setLabel] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      stopMediaTracks();
    };
  }, []);

  const stopMediaTracks = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const resetState = () => {
    setActiveMethod(null);
    setScanning(false);
    setScanComplete(false);
    setScanSuccess(false);
    setErrorMessage("");
    stopMediaTracks();
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const startFingerprint = () => {
    setActiveMethod('fingerprint');
    setScanning(true);
    setErrorMessage("");
    
    // Simulating fingerprint scan
    timerRef.current = setTimeout(() => {
      const fingerprintData = generateFingerprintData();
      
      if (mode === 'register') {
        registerBiometric('fingerprint', fingerprintData);
      } else {
        verifyBiometric('fingerprint', fingerprintData);
      }
    }, 2000);
  };

  const startFaceScan = async () => {
    setActiveMethod('face');
    setScanning(true);
    setErrorMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Capture after 3 seconds
      timerRef.current = setTimeout(() => {
        if (canvasRef.current && videoRef.current) {
          const context = canvasRef.current.getContext('2d');
          if (context) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0);
            
            const faceData = canvasRef.current.toDataURL('image/png');
            if (mode === 'register') {
              registerBiometric('face', faceData);
            } else {
              verifyBiometric('face', faceData);
            }
          }
        }
        stopMediaTracks();
      }, 3001);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setScanning(false);
      setErrorMessage("Could not access camera. Please check permissions.");
    }
  };

  const startVoiceRecognition = async () => {
    setActiveMethod('voice');
    setScanning(true);
    setErrorMessage("");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        
        reader.onloadend = () => {
          const base64data = reader.result as string;
          if (mode === 'register') {
            registerBiometric('voice', base64data);
          } else {
            verifyBiometric('voice', base64data);
          }
        };
        
        reader.readAsDataURL(audioBlob);
        
        // Create audio element for playback
        if (audioRef.current) {
          const audioUrl = URL.createObjectURL(audioBlob);
          audioRef.current.src = audioUrl;
        }
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      
      // Record for 3 seconds
      timerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        stopMediaTracks();
      }, 3001);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setScanning(false);
      setErrorMessage("Could not access microphone. Please check permissions.");
    }
  };

  const generateFingerprintData = () => {
    // In a real app, this would be actual fingerprint data
    // For demo purposes, we'll create a unique string
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000000);
    return `fp_${timestamp}_${random}`;
  };

  const registerBiometric = async (type: BiometricType, data: string) => {
    setScanning(false);
    setScanComplete(true);

    try {
      const biometricData = {
        userId,
        type,
        label: label || `My ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        data,
        createdAt: new Date().toISOString()
      };

      const response = await fetch(getApiUrl("/api/biometric/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(biometricData)
      });
      const result = await response.json();

      if (response.ok) {
        setScanSuccess(true);
        toast({
          title: "Registration Successful",
          description: `Your ${type} has been registered successfully.`,
        });
        
        setTimeout(() => {
          onSuccess(type, data);
        }, 1500);
      } else {
        setScanSuccess(false);
        setErrorMessage(result.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      setScanSuccess(false);
      setErrorMessage("An error occurred during registration. Please try again.");
    }
  };

  const verifyBiometric = async (type: BiometricType, data: string) => {
    setScanning(false);
    setScanComplete(true);

    try {
      const verifyData = {
        userId,
        type,
        data
      };

      const response = await fetch(getApiUrl("/api/biometric/verify"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(verifyData)
      });
      const result = await response.json();

      if (response.ok && result.verified) {
        setScanSuccess(true);
        toast({
          title: "Verification Successful",
          description: `Your ${type} has been verified.`,
        });
        
        setTimeout(() => {
          onSuccess(type, data);
        }, 1500);
      } else {
        setScanSuccess(false);
        setErrorMessage(result.message || "Verification failed. Please try again.");
      }
    } catch (error) {
      setScanSuccess(false);
      setErrorMessage("An error occurred during verification. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">
            {mode === 'register' ? 'Register Biometric' : 'Verify Payment'}
          </h2>
          <button onClick={handleClose} className="focus:outline-none">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          {!activeMethod ? (
            <div className="space-y-4">
              <p className="text-center text-sm text-gray-600 mb-4">
                {mode === 'register' 
                  ? 'Choose a biometric method to register'
                  : 'Verify your identity to complete payment'}
              </p>

              {mode === 'register' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Label (optional)</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder={`My Biometric`}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </div>
              )}

              <button
                onClick={startFingerprint}
                className="w-full flex items-center justify-between p-3 border rounded hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded mr-3">
                    <Fingerprint className="h-5 w-5 text-blue-600" />
                  </div>
                  <span>Fingerprint</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>

              <button
                onClick={startFaceScan}
                className="w-full flex items-center justify-between p-3 border rounded hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded mr-3">
                    <Camera className="h-5 w-5 text-green-600" />
                  </div>
                  <span>Face Recognition</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>

              <button
                onClick={startVoiceRecognition}
                className="w-full flex items-center justify-between p-3 border rounded hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded mr-3">
                    <Mic className="h-5 w-5 text-purple-600" />
                  </div>
                  <span>Voice Recognition</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              {/* Scanning UI */}
              {scanning && (
                <div className="text-center">
                  {activeMethod === 'fingerprint' && (
                    <div className="mb-4 relative">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <Fingerprint className="h-10 w-10 text-blue-600" />
                      </div>
                      <div className="absolute inset-0 bg-blue-400 bg-opacity-20 rounded-full animate-pulse"></div>
                    </div>
                  )}

                  {activeMethod === 'face' && (
                    <div className="relative mb-4">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-64 h-48 bg-black rounded mx-auto"
                      ></video>
                      <div className="absolute inset-0 border-4 border-green-400 border-opacity-50 rounded animate-pulse"></div>
                      <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>
                  )}

                  {activeMethod === 'voice' && (
                    <div className="mb-4 relative">
                      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                        <Mic className="h-10 w-10 text-purple-600" />
                      </div>
                      <div className="absolute inset-0 bg-purple-400 bg-opacity-20 rounded-full animate-pulse"></div>
                      <audio ref={audioRef} className="hidden"></audio>
                    </div>
                  )}

                  <p className="text-lg font-medium">
                    {activeMethod === 'fingerprint' && 'Place your finger on the scanner'}
                    {activeMethod === 'face' && 'Look at the camera'}
                    {activeMethod === 'voice' && 'Say "verify payment" clearly'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Scanning...</p>
                </div>
              )}

              {/* Result UI */}
              {scanComplete && (
                <div className="text-center">
                  {scanSuccess ? (
                    <div className="mb-4">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-10 w-10 text-green-600" />
                      </div>
                      <p className="text-lg font-medium mt-4">
                        {mode === 'register' ? 'Registration Successful' : 'Verification Successful'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {mode === 'register' 
                          ? `Your ${activeMethod} has been registered` 
                          : 'Your identity has been verified'}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="h-10 w-10 text-red-600" />
                      </div>
                      <p className="text-lg font-medium mt-4">
                        {mode === 'register' ? 'Registration Failed' : 'Verification Failed'}
                      </p>
                      <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
                      
                      <button
                        onClick={() => {
                          resetState();
                        }}
                        className="mt-4 px-4 py-2 border border-gray-300 rounded text-sm font-medium"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {!activeMethod && (
          <div className="p-4 border-t">
            <button
              onClick={handleClose}
              className="w-full py-2 border border-gray-300 rounded text-center"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}