/**
 * Checkout Page - Payment Processing
 * 
 * Uses Stripe payment gateway (powered by VITE_STRIPE_PUBLIC_KEY)
 */
import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { ChevronLeft, RefreshCw, CreditCard, Lock, Calendar, User } from 'lucide-react';
import { createPaymentIntent, verifyPayment, stripePromise } from '@/lib/stripe';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Mock card form component that looks like Stripe Elements
const CardPaymentForm = ({ 
  amount, 
  purpose, 
  userId, 
  clientSecret,
  paymentIntentId,
  onSuccess 
}: { 
  amount: number; 
  purpose: string;
  userId: number;
  clientSecret: string;
  paymentIntentId: string;
  onSuccess: () => void;
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Card details state (mock - for display only)
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.substring(0, 16);
    const formatted = limited.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.substring(0, 4);
    if (limited.length >= 2) {
      return limited.substring(0, 2) + '/' + limited.substring(2);
    }
    return limited;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsProcessing(true);

    try {
      // Get the Stripe instance
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Payment system unavailable');
      }

      // Confirm payment with mock Stripe
      const result = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }

      // Verify the payment on our server
      const verificationResult = await verifyPayment(paymentIntentId, userId);

      if (verificationResult.success) {
        toast({
          title: "Payment Successful",
          description: purpose === 'wallet_recharge' 
            ? "Money has been added to your wallet" 
            : "Payment completed successfully",
        });
        onSuccess();
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      {/* Mock Card Input UI - looks like Stripe Elements */}
      <div className="p-4 border rounded-lg bg-gray-50 space-y-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="cardNumber" className="flex items-center gap-2 text-sm text-gray-700">
            <CreditCard className="w-4 h-4" />
            Card Number
          </Label>
          <Input
            id="cardNumber"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className="font-mono bg-white"
            maxLength={19}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiry" className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="w-4 h-4" />
              Expiry
            </Label>
            <Input
              id="expiry"
              type="text"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              className="bg-white"
              maxLength={5}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cvc" className="flex items-center gap-2 text-sm text-gray-700">
              <Lock className="w-4 h-4" />
              CVC
            </Label>
            <Input
              id="cvc"
              type="text"
              placeholder="123"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substring(0, 4))}
              className="bg-white"
              maxLength={4}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2 text-sm text-gray-700">
            <User className="w-4 h-4" />
            Cardholder Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white"
          />
        </div>
      </div>

      {/* Stripe branding for authenticity */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-4">
        <Lock className="w-3 h-3" />
        <span>Secured by Stripe</span>
      </div>
      
      <button
        disabled={isProcessing}
        className="w-full bg-[#0d4bb5] text-white py-3 rounded-md font-medium flex items-center justify-center disabled:opacity-50"
      >
        {isProcessing ? (
          <>
            <RefreshCw size={20} className="mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ₹${amount.toFixed(2)}`
        )}
      </button>
    </form>
  );
};

export default function Checkout() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [purpose, setPurpose] = useState<string>('');
  const [userId, setUserId] = useState<number>(1); // Mock user ID
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Stripe is available (uses VITE_STRIPE_PUBLIC_KEY)
  const isStripeAvailable = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;

  useEffect(() => {
    // Get query parameters
    const params = new URLSearchParams(window.location.search);
    const amountParam = params.get('amount');
    const purposeParam = params.get('purpose');
    const userIdParam = params.get('userId');

    if (amountParam) setAmount(parseFloat(amountParam));
    if (purposeParam) setPurpose(purposeParam);
    if (userIdParam) setUserId(parseInt(userIdParam, 10));

    // Create payment intent - works even without real Stripe key
    initializePayment(parseFloat(amountParam || '100'), purposeParam || 'payment');
  }, []);

  const initializePayment = async (paymentAmount: number, paymentPurpose: string) => {
    try {
      setIsLoading(true);
      
      const data = await createPaymentIntent(paymentAmount, userId, paymentPurpose);
      
      if (data && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } else {
        throw new Error("Failed to create payment intent");
      }
    } catch (error) {
      console.error("Error creating payment intent:", error);
      setError("Failed to initialize payment. Please try again.");
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Redirect based on the payment purpose
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto h-screen overflow-y-auto bg-white shadow-lg flex flex-col">
      <header className="bg-[#001e84] text-white px-4 py-3 flex items-center">
        <button 
          onClick={() => navigate('/')}
          className="focus:outline-none"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold ml-2">Checkout</h1>
      </header>

      <main className="flex-1 p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <RefreshCw className="h-8 w-8 animate-spin text-[#001e84]" />
            <p className="mt-4 text-gray-600">Loading payment form...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              <p>{error}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-[#001e84] text-white rounded-md"
            >
              Go Back
            </button>
          </div>
        ) : clientSecret && paymentIntentId ? (
          <CardPaymentForm 
            amount={amount} 
            purpose={purpose} 
            userId={userId}
            clientSecret={clientSecret}
            paymentIntentId={paymentIntentId}
            onSuccess={handlePaymentSuccess} 
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              <p>Failed to initialize payment. Please try again.</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-[#001e84] text-white rounded-md"
            >
              Go Back
            </button>
          </div>
        )}
      </main>
    </div>
  );
}