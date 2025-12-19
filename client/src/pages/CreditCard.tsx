import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { ChevronLeft, CreditCard as CreditCardIcon, Calendar, Lock, Check, DollarSign } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface CardPaymentForm {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  amount: number;
}

export default function CreditCard() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<CardPaymentForm>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    amount: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'payment' | 'bills'>('payment');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      const formattedValue = formatCardNumber(value);
      setFormData({ ...formData, [name]: formattedValue });
    } else if (name === 'expiryDate') {
      const formattedValue = formatExpiryDate(value);
      setFormData({ ...formData, [name]: formattedValue });
    } else if (name === 'cvv') {
      const formattedValue = value.replace(/\D/g, '').substring(0, 3);
      setFormData({ ...formData, [name]: formattedValue });
    } else if (name === 'amount') {
      const numValue = Number(value);
      setFormData({ ...formData, [name]: numValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return;
    }

    if (formData.cardNumber.replace(/\s/g, '').length < 16) {
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
          amount: formData.amount,
          cardDetails: {
            cardNumber: formData.cardNumber,
            expiryDate: formData.expiryDate,
            cvv: formData.cvv,
            cardholderName: formData.cardholderName
          },
          paymentType: 'credit_card_bill'
        }
      });

      setIsSuccess(true);
      
      // Invalidate transaction caches
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ['payment-history'] });
      
      toast({
        title: "Payment Successful",
        description: `₹${formData.amount} has been paid towards your credit card bill`,
      });
      
      // Reset form after successful payment
      setFormData({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: '',
        amount: 0
      });
      
      // Navigate back to home after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Payment Failed",
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
        <h1 className="text-lg font-semibold">Credit Card</h1>
        <div className="w-8"></div>
      </div>

      {/* Tabs */}
      <div className="bg-white flex border-b">
        <button
          className={`flex-1 py-3 font-medium text-sm ${activeTab === 'payment' ? 'text-[#0d4bb5] border-b-2 border-[#0d4bb5]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('payment')}
        >
          Make Payment
        </button>
        <button
          className={`flex-1 py-3 font-medium text-sm ${activeTab === 'bills' ? 'text-[#0d4bb5] border-b-2 border-[#0d4bb5]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('bills')}
        >
          View Bills
        </button>
      </div>

      <div className="p-4">
        {isSuccess ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">₹{formData.amount} has been paid towards your credit card bill</p>
            <p className="text-gray-500 text-sm">Redirecting to home...</p>
          </div>
        ) : activeTab === 'payment' ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4">
            <div className="mb-6">
              <label htmlFor="amount" className="block text-gray-600 mb-2">Enter Amount (₹)</label>
              <div className="relative">
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount || ''}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="0"
                  required
                />
                <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="cardNumber" className="block text-gray-600 mb-2">Card Number</label>
              <div className="relative">
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1234 5678 9012 3456"
                  required
                />
                <CreditCardIcon size={20} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>
            
            <div className="flex space-x-4 mb-4">
              <div className="w-1/2">
                <label htmlFor="expiryDate" className="block text-gray-600 mb-2">Expiry Date</label>
                <div className="relative">
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
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
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleChange}
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
                name="cardholderName"
                value={formData.cardholderName}
                onChange={handleChange}
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
              {isProcessing ? 'Processing...' : 'Pay Now'}
            </button>
            
            <p className="text-xs text-gray-500 mt-4 text-center">
              Your card details are securely processed. We do not store your full card information.
            </p>
          </form>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-center py-8">
              <CreditCardIcon size={64} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-600">No Credit Card Bills</h3>
              <p className="text-sm text-gray-500 mt-1">You don't have any pending credit card bills at the moment.</p>
              <button
                onClick={() => setActiveTab('payment')}
                className="mt-4 bg-[#0d4bb5] text-white py-2 px-4 rounded-md text-sm"
              >
                Make a Payment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}