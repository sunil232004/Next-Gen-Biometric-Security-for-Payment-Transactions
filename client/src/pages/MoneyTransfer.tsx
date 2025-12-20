import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Users, Search, BadgeCheck, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";
import { addOrUpdateTransaction } from "@/store/transactionsSlice";
import { PaymentHistory } from "@/types/paymentHistory";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PaymentVerificationGate from "@/components/PaymentVerificationGate";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import TransactionReceipt from "@/components/TransactionReceipt";
import { useAuth } from "@/contexts/AuthContext";

interface Contact {
  id: number;
  name: string;
  phoneNumber: string;
  upiId: string;
  recentlyPaid?: boolean;
}

export default function MoneyTransfer() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, biometrics } = useAuth();
  const dispatch = useAppDispatch();
  const userId = user?._id?.toString();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const selectedContact: Contact | null = recipient
    ? {
        id: 0,
        name: recipient,
        phoneNumber: recipient,
        upiId: recipient,
      }
    : null;

  // ...existing code...
  const handleBack = () => {
    navigate("/");
  };

  const handleNext = () => {
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Transfer Failed",
        description: "Amount and recipient (email or phone) are required",
        variant: "destructive"
      });
      return;
    }
    // Show biometric verification if user has biometrics
    if (biometrics && biometrics.length > 0) {
      setShowVerification(true);
    } else {
      // No biometrics, proceed directly
      processTransfer('none');
    }
  };

  const handleVerificationSuccess = async (method: string) => {
    setShowVerification(false);
    await processTransfer(method);
  };

  const processTransfer = async (authMethod: string) => {
    setLoading(true);

    try {
      const token = localStorage.getItem('paytm_auth_token');
      
      // Determine if recipient is email or phone
      const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
      const isEmail = emailRegex.test(recipient);
      
      const endpoint = getApiUrl("/api/v2/payments/transfer");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ 
          recipientEmail: isEmail ? recipient : undefined,
          recipientPhone: !isEmail ? recipient : undefined,
          amount: parseFloat(amount),
          pin: '1234', // Default PIN - will be overridden by biometric if used
          description: note || undefined,
          authMethod: authMethod
        })
      });

      const result = await response.json();

      console.log('[MoneyTransfer] Transfer response:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Transfer failed");
      }

      const now = new Date().toISOString();
      const normalizedTransaction: PaymentHistory = {
        _id: result.transaction?._id || result.transaction?.transactionId || `local-${Date.now()}`,
        userId: user?._id || result.transaction?.userId || userId || '',
        accountId: result.transaction?.accountId,
        transactionId: result.transaction?.transactionId || `TXN-${Date.now()}`,
        type: 'transfer',
        direction: 'debit',
        amount: parseFloat(amount),
        currency: result.transaction?.currency || 'INR',
        status: 'completed',
        paymentMethod: result.transaction?.paymentMethod || 'wallet',
        paymentMethodDetails: result.transaction?.paymentMethodDetails,
        senderDetails: result.transaction?.senderDetails || {
          name: user?.name || 'You',
          upiId: user?.upiId
        },
        receiverDetails: result.transaction?.receiverDetails || {
          name: recipient,
          upiId: recipient
        },
        description: result.transaction?.description || `Money Transfer to ${recipient}${note ? ` - ${note}` : ''}`,
        category: result.transaction?.category,
        remarks: result.transaction?.remarks,
        fee: result.transaction?.fee,
        tax: result.transaction?.tax,
        totalAmount: result.transaction?.totalAmount,
        balanceBefore: result.transaction?.balanceBefore,
        balanceAfter: result.transaction?.balanceAfter,
        statusHistory: result.transaction?.statusHistory || [
          { status: 'completed', timestamp: now }
        ],
        initiatedAt: result.transaction?.initiatedAt || now,
        createdAt: result.transaction?.createdAt || now,
        completedAt: result.transaction?.completedAt || now,
        metadata: {
          ...(result.transaction?.metadata || {}),
          authMethod,
          note,
          recipient
        }
      };

      setCompletedTransaction(normalizedTransaction);
      dispatch(addOrUpdateTransaction(normalizedTransaction));

      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ['payment-history'] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['payment-history', userId] });
      }

      // Show receipt instead of the step 3 success screen
      setShowReceipt(true);
      setPaymentSuccess(true);
    } catch (error: any) {
      console.error("Transfer failed:", error);
      toast({
        title: "Transfer Failed",
        description: error.message || "There was an error processing your transfer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const handleQuickAmountSelect = (value: number) => {
    setAmount(value.toString());
  };

  const handlePayment = async () => {
    // Validate required fields
    if (!selectedContact) {
      toast({
        title: "No contact selected",
        description: "Please select a contact to continue",
        variant: "destructive"
      });
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than zero",
        variant: "destructive"
      });
      return;
    }
    // Validate UPI ID format
    const upiRegex = /^[\w\.\-]+@[a-zA-Z]+$/;
    if (!selectedContact.upiId || !upiRegex.test(selectedContact.upiId)) {
      toast({
        title: "Invalid UPI ID",
        description: "Please enter a valid UPI ID for the recipient",
        variant: "destructive"
      });
      return;
    }
    // Show biometric verification if user has biometrics
    if (biometrics && biometrics.length > 0) {
      setShowVerification(true);
    } else {
      // No biometrics, proceed directly
      processTransfer('none');
    }
  };


  return (
    <div className="app-container mx-auto min-h-screen bg-white shadow-lg flex flex-col">
      <header className="bg-[#00baf2] text-white p-responsive flex items-center sticky top-0 z-10">
        <button onClick={handleBack} className="mr-3 sm:mr-4 tap-target">
          <ChevronLeft className="icon-responsive-lg" />
        </button>
        <h1 className="text-responsive-lg font-semibold">
          {paymentSuccess ? "Payment Successful" : "Pay to Contact/UPI ID"}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6 max-w-md mx-auto">
          <div className="space-y-3">
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">
              Recipient (Email or Phone)
            </label>
            <Input
              id="recipient"
              type="text"
              placeholder="Enter recipient email or phone"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="text-base"
            />
          </div>
          <div className="space-y-3">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-lg font-medium"
                min="1"
              />
            </div>
            <div className="flex space-x-2 mt-2">
              {[100, 200, 500, 1000].map((value) => (
                <button
                  key={value}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
                  onClick={() => setAmount(value.toString())}
                >
                  ₹{value}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label htmlFor="note" className="block text-sm font-medium text-gray-700">
              Add a note (optional)
            </label>
            <Input
              id="note"
              placeholder="What's this payment for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              // Validate amount
              const amt = parseFloat(amount);
              if (!amount || isNaN(amt) || amt <= 0) {
                toast({
                  title: "Transfer Failed",
                  description: "Please enter a valid amount greater than zero.",
                  variant: "destructive"
                });
                return;
              }
              // Validate recipient (email or phone)
              const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
              const phoneRegex = /^\d{10,}$/;
              if (!recipient || (!emailRegex.test(recipient) && !phoneRegex.test(recipient))) {
                toast({
                  title: "Transfer Failed",
                  description: "Please enter a valid recipient email or phone number.",
                  variant: "destructive"
                });
                return;
              }
              if (biometrics && biometrics.length > 0) {
                setShowVerification(true);
              } else {
                processTransfer('none');
              }
            }}
            className="w-full py-6 text-lg mt-6"
            disabled={loading}
          >
            {loading ? "Processing..." : `Transfer ₹${amount || '0'}`}
          </Button>
        </div>
        {/* Receipt and verification UI remain unchanged below */}

        {paymentSuccess && completedTransaction && (
          <div className="flex flex-col items-center py-8 space-y-6">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">₹{amount}</h2>
              <p className="text-gray-500 mt-1">Paid Successfully</p>
            </div>
            <div className="bg-gray-50 w-full p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">From</span>
                <span className="font-medium">Paytm Wallet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">To</span>
                <span className="font-medium">{recipient}</span>
              </div>
              {note && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Note</span>
                  <span className="font-medium">{note}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Date & Time</span>
                <span className="font-medium">{new Date().toLocaleString()}</span>
              </div>
            </div>
            <Button
              onClick={handleBack}
              className="w-full py-6 text-lg"
            >
              Done
            </Button>
          </div>
        )}
      </main>

      {/* Payment Verification Modal */}
      <PaymentVerificationGate
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        onSuccess={handleVerificationSuccess}
        amount={parseFloat(amount) || 0}
        recipient={recipient}
        description={`Transfer to ${recipient}`}
      />

      {showReceipt && completedTransaction && (
        <TransactionReceipt
          transaction={completedTransaction}
          onClose={() => {
            setShowReceipt(false);
            navigate("/");
          }}
        />
      )}
    </div>
  );
}