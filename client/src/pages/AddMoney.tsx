import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { ChevronLeft, CreditCard as CreditCardIcon, Calendar, Lock, Check, Wallet } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function AddMoney() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(0);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return;
    }

    if (cardNumber.length < 16) {
      toast({
        title: "Invalid Card Number",
        description: "Please enter a valid 16-digit card number",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Mock user ID 1 for demonstration
      const userId = 1;

      const response = await apiRequest("/api/card-payment", {
        method: "POST", 
        body: { 
          userId, 
          amount,
          cardDetails: {
            cardNumber,
            expiryDate,
            cvv,
            cardholderName
          }
        }
      });

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Money Added Successfully",
          description: `₹${amount} has been added to your wallet`,
        });

        // Reset form
        setAmount(0);
        setCardNumber('');
        setExpiryDate('');
        setCvv('');
        setCardholderName('');

        // Navigate back to home after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        throw new Error("Failed to add money");
      }
    } catch (error: any) {
      toast({
        title: "Failed to Add Money",
        description: error.message || "An error occurred while processing your payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Limit to 16 digits
    const truncated = digits.substring(0, 16);

    // Format with spaces after every 4 digits
    let formatted = '';
    for (let i = 0; i < truncated.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += truncated[i];
    }

    return formatted;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const formatExpiryDate = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Limit to 4 digits (MM/YY)
    const truncated = digits.substring(0, 4);

    // Format as MM/YY
    if (truncated.length > 2) {
      return truncated.substring(0, 2) + '/' + truncated.substring(2);
    }

    return truncated;
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setExpiryDate(formatted);
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
        <h1 className="text-lg font-semibold">Add Money</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-4">
        {isSuccess ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">₹{amount} has been added to your wallet</p>
            <p className="text-gray-500 text-sm">Redirecting to home...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="mb-6">
                <label htmlFor="amount" className="block text-gray-600 mb-2">Enter Amount (₹)</label>
                <input
                  type="number"
                  id="amount"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="0"
                  required
                />
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    if (amount <= 0) {
                      toast({
                        title: "Invalid Amount",
                        description: "Please enter a valid amount greater than 0",
                        variant: "destructive"
                      });
                      return;
                    }
                    // Navigate to Stripe checkout
                    navigate(`/checkout?amount=${amount}&purpose=wallet_recharge`);
                  }}
                  className="w-full bg-[#0d4bb5] text-white py-3 rounded-md font-medium flex items-center justify-center"
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  Pay with Stripe
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or pay with card directly</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4">
              <div className="mb-4">
                <label htmlFor="cardNumber" className="block text-gray-600 mb-2">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    id="cardNumber"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                  <CreditCardIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="flex space-x-4 mb-4">
                <div className="w-1/2">
                  <label htmlFor="expiryDate" className="block text-gray-600 mb-2">Expiry Date</label>
                  <div className="relative">
                    <input
                      type="text"
                      id="expiryDate"
                      value={expiryDate}
                      onChange={handleExpiryDateChange}
                      className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="MM/YY"
                      required
                    />
                    <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="w-1/2">
                  <label htmlFor="cvv" className="block text-gray-600 mb-2">CVV</label>
                  <div className="relative">
                    <input
                      type="password"
                      id="cvv"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                      className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123"
                      required
                    />
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="cardholderName" className="block text-gray-600 mb-2">Cardholder Name</label>
                <input
                  type="text"
                  id="cardholderName"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0d4bb5] text-white py-3 rounded-md font-medium flex items-center justify-center"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Add Money with Card'}
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Your card details are securely processed. We do not store your full card information.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}