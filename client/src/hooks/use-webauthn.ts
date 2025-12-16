import { useState, useEffect, useCallback } from 'react';
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  registerWebAuthnCredential,
  verifyWebAuthnCredential,
  checkBiometricCapabilities,
  BiometricCapabilities,
  WebAuthnCredential,
  RegistrationResult,
  VerificationResult,
} from '@/lib/webauthn';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';

interface UseWebAuthnReturn {
  // State
  isSupported: boolean;
  isPlatformAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  capabilities: BiometricCapabilities | null;
  
  // Actions
  checkCapabilities: () => Promise<BiometricCapabilities>;
  registerFingerprint: (label?: string) => Promise<RegistrationResult>;
  verifyFingerprint: (credentialIds?: string[]) => Promise<VerificationResult>;
  
  // Helpers
  clearError: () => void;
}

export function useWebAuthn(): UseWebAuthnReturn {
  const { user, refreshUser } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<BiometricCapabilities | null>(null);

  // Check support on mount
  useEffect(() => {
    const checkSupport = async () => {
      const supported = isWebAuthnSupported();
      setIsSupported(supported);
      
      if (supported) {
        const platformAvailable = await isPlatformAuthenticatorAvailable();
        setIsPlatformAvailable(platformAvailable);
      }
    };
    
    checkSupport();
  }, []);

  // Check full capabilities
  const checkCapabilities = useCallback(async (): Promise<BiometricCapabilities> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const caps = await checkBiometricCapabilities();
      setCapabilities(caps);
      setIsSupported(caps.webAuthnSupported);
      setIsPlatformAvailable(caps.platformAuthenticatorAvailable);
      return caps;
    } catch (err: any) {
      setError(err.message || 'Failed to check capabilities');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register fingerprint using WebAuthn
  const registerFingerprint = useCallback(async (label?: string): Promise<RegistrationResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    if (!isSupported || !isPlatformAvailable) {
      return { 
        success: false, 
        error: 'Fingerprint authentication is not available on this device' 
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Register WebAuthn credential
      const result = await registerWebAuthnCredential({
        id: user._id,
        name: user.email,
        displayName: user.name,
      });

      if (!result.success || !result.credential) {
        setError(result.error || 'Registration failed');
        return result;
      }

      // Save credential to backend
      const token = localStorage.getItem('paytm_auth_token');
      const response = await apiRequest('/api/v2/biometric/register', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: {
          type: 'fingerprint',
          label: label || 'My Fingerprint',
          data: JSON.stringify({
            credentialId: result.credential.credentialId,
            publicKey: result.credential.publicKey,
            authenticatorType: result.credential.authenticatorType,
            transports: result.credential.transports,
            webauthn: true,
          }),
        },
      });

      if (response.success) {
        await refreshUser();
        return { success: true, credential: result.credential };
      } else {
        setError(response.message || 'Failed to save credential');
        return { success: false, error: response.message };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to register fingerprint';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported, isPlatformAvailable, refreshUser]);

  // Verify fingerprint using WebAuthn
  const verifyFingerprint = useCallback(async (
    credentialIds?: string[]
  ): Promise<VerificationResult> => {
    if (!isSupported || !isPlatformAvailable) {
      return { 
        success: false, 
        error: 'Fingerprint authentication is not available on this device' 
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyWebAuthnCredential(credentialIds);
      
      if (!result.success) {
        setError(result.error || 'Verification failed');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to verify fingerprint';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, isPlatformAvailable]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSupported,
    isPlatformAvailable,
    isLoading,
    error,
    capabilities,
    checkCapabilities,
    registerFingerprint,
    verifyFingerprint,
    clearError,
  };
}

export default useWebAuthn;
