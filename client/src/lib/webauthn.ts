/**
 * WebAuthn Utilities for Biometric Authentication
 * 
 * This module provides a wrapper around the Web Authentication API
 * for fingerprint and biometric authentication on smartphones and devices.
 */

// Check if WebAuthn is supported
export const isWebAuthnSupported = (): boolean => {
  return !!(window.PublicKeyCredential && 
    navigator.credentials && 
    typeof navigator.credentials.create === 'function' && 
    typeof navigator.credentials.get === 'function');
};

// Check if platform authenticator (fingerprint/face) is available
export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) return false;
  
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (error) {
    console.error('Error checking platform authenticator:', error);
    return false;
  }
};

// Generate a random challenge
const generateChallenge = (): ArrayBuffer => {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge.buffer as ArrayBuffer;
};

// Convert ArrayBuffer to Base64 string
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Convert Base64 string to ArrayBuffer
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Relying Party info
const getRelyingParty = () => ({
  name: 'Paytm Clone - Biometric Payment',
  id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
});

// User info for registration
interface WebAuthnUser {
  id: string;
  name: string;
  displayName: string;
}

// Credential data returned after registration
export interface WebAuthnCredential {
  credentialId: string;
  publicKey: string;
  authenticatorType: string;
  transports?: string[];
}

// Registration result
export interface RegistrationResult {
  success: boolean;
  credential?: WebAuthnCredential;
  error?: string;
}

// Verification result
export interface VerificationResult {
  success: boolean;
  credentialId?: string;
  error?: string;
}

/**
 * Register a new WebAuthn credential (fingerprint/biometric)
 * This creates a new public key credential on the device
 */
export const registerWebAuthnCredential = async (
  user: WebAuthnUser
): Promise<RegistrationResult> => {
  if (!isWebAuthnSupported()) {
    return { 
      success: false, 
      error: 'WebAuthn is not supported on this device' 
    };
  }

  try {
    const challenge = generateChallenge();
    const rp = getRelyingParty();

    // Create credential options
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp,
      user: {
        id: new TextEncoder().encode(user.id),
        name: user.name,
        displayName: user.displayName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Use built-in authenticator (fingerprint/face)
        userVerification: 'required',        // Require biometric verification
        residentKey: 'preferred',
      },
      timeout: 60000, // 60 seconds
      attestation: 'direct',
    };

    // Create the credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'Failed to create credential' };
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    
    // Extract credential data
    const credentialData: WebAuthnCredential = {
      credentialId: arrayBufferToBase64(credential.rawId),
      publicKey: arrayBufferToBase64(response.getPublicKey() || new ArrayBuffer(0)),
      authenticatorType: 'platform',
      transports: response.getTransports?.() || ['internal'],
    };

    console.log('[WebAuthn] Credential registered successfully');
    
    return { 
      success: true, 
      credential: credentialData 
    };
  } catch (error: any) {
    console.error('[WebAuthn] Registration error:', error);
    
    // Handle specific errors
    if (error.name === 'NotAllowedError') {
      return { 
        success: false, 
        error: 'Biometric authentication was cancelled or denied' 
      };
    }
    if (error.name === 'SecurityError') {
      return { 
        success: false, 
        error: 'Security error - ensure you are using HTTPS' 
      };
    }
    if (error.name === 'NotSupportedError') {
      return { 
        success: false, 
        error: 'No compatible authenticator found on this device' 
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to register biometric' 
    };
  }
};

/**
 * Verify a WebAuthn credential (authenticate with fingerprint/biometric)
 * This verifies the user's identity using a previously registered credential
 */
export const verifyWebAuthnCredential = async (
  credentialIds?: string[]
): Promise<VerificationResult> => {
  if (!isWebAuthnSupported()) {
    return { 
      success: false, 
      error: 'WebAuthn is not supported on this device' 
    };
  }

  try {
    const challenge = generateChallenge();
    const rp = getRelyingParty();

    // Build allow credentials list if provided
    const allowCredentials: PublicKeyCredentialDescriptor[] | undefined = credentialIds?.map(id => ({
      id: base64ToArrayBuffer(id),
      type: 'public-key' as const,
      transports: ['internal'] as AuthenticatorTransport[],
    }));

    // Create assertion options
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: rp.id,
      allowCredentials: allowCredentials || [],
      userVerification: 'required', // Require biometric verification
      timeout: 60000, // 60 seconds
    };

    // Get the credential (this triggers biometric verification)
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    if (!assertion) {
      return { success: false, error: 'Failed to verify credential' };
    }

    console.log('[WebAuthn] Credential verified successfully');
    
    return { 
      success: true, 
      credentialId: arrayBufferToBase64(assertion.rawId)
    };
  } catch (error: any) {
    console.error('[WebAuthn] Verification error:', error);
    
    // Handle specific errors
    if (error.name === 'NotAllowedError') {
      return { 
        success: false, 
        error: 'Biometric verification was cancelled or denied' 
      };
    }
    if (error.name === 'SecurityError') {
      return { 
        success: false, 
        error: 'Security error - ensure you are using HTTPS' 
      };
    }
    if (error.name === 'InvalidStateError') {
      return { 
        success: false, 
        error: 'No registered credentials found' 
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to verify biometric' 
    };
  }
};

/**
 * Quick biometric verification without specific credential
 * Uses any available platform authenticator
 */
export const quickBiometricVerify = async (): Promise<VerificationResult> => {
  if (!isWebAuthnSupported()) {
    return { 
      success: false, 
      error: 'WebAuthn is not supported on this device' 
    };
  }

  const platformAvailable = await isPlatformAuthenticatorAvailable();
  if (!platformAvailable) {
    return { 
      success: false, 
      error: 'No platform authenticator (fingerprint/face) available' 
    };
  }

  // Verify without specific credentials (uses discoverable credentials)
  return verifyWebAuthnCredential();
};

/**
 * Check device biometric capabilities
 */
export interface BiometricCapabilities {
  webAuthnSupported: boolean;
  platformAuthenticatorAvailable: boolean;
  canUseBiometrics: boolean;
}

export const checkBiometricCapabilities = async (): Promise<BiometricCapabilities> => {
  const webAuthnSupported = isWebAuthnSupported();
  const platformAuthenticatorAvailable = webAuthnSupported 
    ? await isPlatformAuthenticatorAvailable() 
    : false;

  return {
    webAuthnSupported,
    platformAuthenticatorAvailable,
    canUseBiometrics: webAuthnSupported && platformAuthenticatorAvailable,
  };
};
