import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from 'wouter';
import { ChevronLeft, RefreshCw } from 'lucide-react';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
let stripePromise: Promise<any>;
try {
  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    console.error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
    // Create a dummy promise that will never resolve to prevent errors
    stripePromise = Promise.resolve(null);
  } else {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  }
} catch (error) {
  console.error('Error initializing Stripe:', error);
  // Create a dummy promise that will never resolve to prevent errors
  stripePromise = Promise.resolve(null);
}

const CheckoutForm = ({ amount, purpose, userId, onSuccess }: { 
  amount: number; 
  purpose: string;
  userId: number;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment",
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      toast({
        title: "Payment Successful",
        description: purpose === 'wallet_recharge' 
          ? "Money has been added to your wallet" 
          : "Payment completed successfully",
      });
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="mb-6">
        <PaymentElement className="mb-6" />
      </div>
      
      <button
        disabled={!stripe || isProcessing}
        className="w-full bg-[#0d4bb5] text-white py-3 rounded-md font-medium flex items-center justify-center"
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
  const [amount, setAmount] = useState<number>(0);
  const [purpose, setPurpose] = useState<string>('');
  const [userId, setUserId] = useState<number>(1); // Mock user ID
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Stripe is available
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

    // Create payment intent if Stripe is available
    if (isStripeAvailable) {
      createPaymentIntent();
    } else {
      setIsLoading(false);
      setError('Payment processing is currently unavailable. Please try again later.');
    }
  }, []);

  const createPaymentIntent = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest("/api/create-payment-intent", {
        method: "POST",
        body: {
          amount: amount || 100, 
          userId,
          purpose: purpose || 'wallet_recharge'
        }
      });
      
      if (data && data.clientSecret) {
        setClientSecret(data.clientSecret);
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
    if (purpose === 'wallet_recharge') {
      navigate('/');
    } else {
      navigate('/');
    }
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
        ) : !isStripeAvailable ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md mb-4">
              <p>Payment processing is currently unavailable. Please try again later.</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-[#001e84] text-white rounded-md"
            >
              Go Back
            </button>
          </div>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm 
              amount={amount} 
              purpose={purpose} 
              userId={userId} 
              onSuccess={handlePaymentSuccess} 
            />
          </Elements>
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