import { useState, useEffect, useRef } from 'react';
import QrReader from 'react-qr-scanner';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, X, RefreshCw, QrCode, AtSign, Camera, ImageIcon, Image, Trash2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import PaymentVerificationGate from '@/components/PaymentVerificationGate';

interface PaymentData {
  upiId?: string;
  userId?: number;
  name?: string;
  amount?: number;
}

interface RecentContact {
  id: number;
  name: string;
  upiId: string;
  photoUrl?: string;
}

export default function QRScanner() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, biometrics } = useAuth();
  const [delay] = useState(500);
  const [result, setResult] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [manualUpiId, setManualUpiId] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showQROptions, setShowQROptions] = useState(true);
  const [scanMode, setScanMode] = useState<'camera' | 'gallery'>('camera');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showVerification, setShowVerification] = useState(false);
  
  const recentContacts: RecentContact[] = [
    { id: 1, name: 'Harshith VKIT 2', upiId: 'harshith@okaxis', photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { id: 2, name: 'Badava Rascal Abhi', upiId: 'abhi@ybl', photoUrl: 'https://randomuser.me/api/portraits/men/45.jpg' },
    { id: 3, name: 'Nithin VKIT', upiId: 'nithin@okicici', photoUrl: 'https://randomuser.me/api/portraits/men/67.jpg' },
  ];

  useEffect(() => {
    if (result) {
      try {
        // Try to parse QR code data
        const parsedData = JSON.parse(result);
        setPaymentData(parsedData);
        setIsScanning(false);
      } catch (error) {
        // If it's not JSON, assume it's a UPI ID
        setPaymentData({ upiId: result });
        setIsScanning(false);
      }
    }
  }, [result]);
  
  // Set camera error state automatically
  useEffect(() => {
    // For Replit and most web environments, camera access will likely fail
    // So we'll pre-emptively show the manual entry form
    setCameraError(true);
    setShowManualEntry(true);
    
    // We'll also disable the toast notification since we're showing the manual entry by default
    // This avoids confusing the user with an error message
  }, []);

  const handleScan = (data: any) => {
    if (data && data.text) {
      setResult(data.text);
    }
  };

  const handleError = (err: any) => {
    console.error("Camera error:", err);
    setCameraError(true);
    setShowManualEntry(true);
    // We're not showing the toast notification since we're already showing the manual entry form
    // This avoids confusing the user with unnecessary error messages
  };
  
  const handleManualEntry = () => {
    if (!manualUpiId) {
      toast({
        title: "Invalid UPI ID",
        description: "Please enter a valid UPI ID",
        variant: "destructive"
      });
      return;
    }
    
    setPaymentData({ upiId: manualUpiId });
    setIsScanning(false);
  };

  const resetScanner = () => {
    setResult(null);
    setPaymentData(null);
    setAmount(0);
    setIsScanning(true);
    setManualUpiId('');
    setShowManualEntry(false);
    // Don't reset cameraError as it will attempt to use the camera again
  };
  
  const toggleEntryMethod = () => {
    setShowManualEntry(!showManualEntry);
  };

  const initiatePayment = () => {
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return;
    }
    
    // Check if user has biometrics set up
    if (biometrics && biometrics.length > 0) {
      setShowVerification(true);
    } else {
      // No biometrics, proceed with payment directly
      completePayment();
    }
  };

  const handleVerificationSuccess = (method: string) => {
    setShowVerification(false);
    completePayment(method);
  };

  const completePayment = async (authMethod?: string) => {
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Use authenticated user ID or fallback
      const fromUserId = user?._id || 1;
      
      // Create transaction
      const transactionData = {
        userId: fromUserId,
        type: "payment",
        amount: amount,
        status: "success",
        description: `Payment to ${paymentData?.name || paymentData?.upiId}`,
        timestamp: new Date().toISOString(),
        authMethod: authMethod || 'none',
        createdAt: new Date().toISOString(),
        metadata: JSON.stringify({
          recipient: paymentData?.name || paymentData?.upiId,
          recipientId: paymentData?.userId || "unknown"
        })
      };

      const response = await apiRequest("/api/transaction", {
        method: "POST",
        body: transactionData
      });
      
      // apiRequest returns parsed JSON or empty array on error
      if (response && response.success) {
        // Invalidate transaction caches
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        queryClient.invalidateQueries({ queryKey: ['payment-history'] });
        
        toast({
          title: "Payment Successful!",
          description: `You've paid ₹${amount} to ${paymentData?.name || paymentData?.upiId}`,
        });
        
        // Navigate back to home after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        throw new Error(response?.message || "Failed to complete transaction");
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Could not complete the payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const previewStyle = {
    width: '100%',
    height: 'auto',
    borderRadius: '8px'
  };

  // Function to handle Gallery photo selection
  const handleGallerySelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleShowMyQR = () => {
    navigate('/receive-qr');
  };

  const handleRecentContactSelect = (contact: RecentContact) => {
    setPaymentData({ 
      upiId: contact.upiId,
      name: contact.name
    });
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      {/* Header */}
      <div className="bg-[#0d4bb5] text-white p-4 flex items-center justify-between">
        <button 
          className="flex items-center" 
          onClick={() => navigate("/")}
        >
          <ChevronLeft size={24} />
          <span className="ml-2">Back</span>
        </button>
        <h1 className="text-lg font-semibold">{showQROptions ? 'Scan Any QR Code' : 'Scan & Pay'}</h1>
        <button className="w-8 h-8 flex items-center justify-center">
          <Trash2 size={20} />
        </button>
      </div>

      {isScanning ? (
        <div className="relative">
          {showQROptions && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black bg-opacity-70 px-8">
              <div className="flex space-x-4 absolute top-20">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-800">
                  <QrCode size={24} />
                </div>
              </div>

              <div className="absolute bottom-36 flex flex-col space-y-2 w-full">
                <button 
                  onClick={() => {
                    setScanMode('gallery');
                    handleGallerySelect();
                  }}
                  className="w-full flex items-center justify-center bg-white bg-opacity-20 backdrop-blur-sm text-white py-2 px-4 rounded-md"
                >
                  <Image className="mr-2" size={20} />
                  Scan from Gallery
                </button>
                
                <button 
                  onClick={handleShowMyQR}
                  className="w-full flex items-center justify-center bg-white bg-opacity-20 backdrop-blur-sm text-white py-2 px-4 rounded-md"
                >
                  <QrCode className="mr-2" size={20} />
                  My QR
                </button>
              </div>

              <div className="absolute bottom-10 w-full">
                <div className="bg-green-100 text-green-800 py-2 px-4 rounded-md flex items-center justify-between">
                  <div>Get Cashback upto ₹50!</div>
                  <button className="font-medium">Pay Now</button>
                </div>
              </div>
            </div>
          )}

          <div className="p-4">
            <div className="mt-2 mb-4">
              <div className="overflow-hidden rounded-lg shadow-md bg-white p-3">
                <div className="p-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={manualUpiId}
                      onChange={(e) => setManualUpiId(e.target.value)}
                      className="w-full p-3 pl-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Mobile Number or Name"
                    />
                    <button className="absolute right-3 top-3 text-blue-500">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M20 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M20 18H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent contacts */}
            <div className="mt-6">
              <h3 className="font-medium text-gray-800 mb-3">Recents</h3>
              <div className="flex space-x-6 overflow-x-auto">
                {recentContacts.map(contact => (
                  <div 
                    key={contact.id}
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => handleRecentContactSelect(contact)}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden mb-1">
                      <img 
                        src={contact.photoUrl} 
                        alt={contact.name}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="text-xs text-center font-medium w-16 truncate">{contact.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 text-xs text-center text-gray-500">
              <span>Powered by</span>
              <img 
                src="https://pwebassets.paytm.com/commonwebassets/paytmweb/UPILogo.png" 
                alt="UPI"
                className="h-4 inline-block mx-1" 
              />
              <span>|</span>
              <img 
                src="https://pwebassets.paytm.com/commonwebassets/paytmweb/bhimLogo.png" 
                alt="BHIM"
                className="h-4 inline-block mx-1" 
              />
            </div>
          </div>

          {/* Hidden file input for gallery selection */}
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                // In a real app, you'd process this image to extract QR code
                // Here we'll simulate a successful scan after a short delay
                setTimeout(() => {
                  setPaymentData({ 
                    upiId: 'scanned@upi',
                    name: 'Scanned User'
                  });
                  setIsScanning(false);
                }, 1000);
              }
            }}
          />
        </div>
      ) : (
        <div className="p-4">
          <div className="mt-2 rounded-lg shadow-md bg-white p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Payment Details</h2>
              <button 
                className="text-gray-500"
                onClick={resetScanner}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Paying to:</span>
                <span className="font-medium">{paymentData?.name || paymentData?.upiId}</span>
              </div>
              {paymentData?.userId && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">User ID:</span>
                  <span className="font-medium">{paymentData.userId}</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="amount" className="block text-gray-600 mb-2">Enter Amount (₹)</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                placeholder="0.00"
              />
            </div>

            <button
              className="w-full bg-[#0d4bb5] text-white py-3 rounded-md font-medium flex items-center justify-center"
              onClick={initiatePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={20} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ₹${amount || '0'}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Biometric Verification Modal */}
      <PaymentVerificationGate
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        onSuccess={handleVerificationSuccess}
        amount={amount}
        recipient={paymentData?.name || paymentData?.upiId}
        description="QR Payment"
      />
    </div>
  );
}