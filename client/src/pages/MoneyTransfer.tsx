import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Users, Search, BadgeCheck, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Mock contacts - in a real app, these would come from API
  const contacts: Contact[] = [
    { id: 1, name: "Vikram Sharma", phoneNumber: "9876543210", upiId: "vikram@paytm", recentlyPaid: true },
    { id: 2, name: "Priya Patel", phoneNumber: "9876543211", upiId: "priya@okaxis" },
    { id: 3, name: "Rahul Singh", phoneNumber: "9876543212", upiId: "rahul@icici", recentlyPaid: true },
    { id: 4, name: "Kiran Reddy", phoneNumber: "9876543213", upiId: "kiran@ybl" },
    { id: 5, name: "Ananya Desai", phoneNumber: "9876543214", upiId: "ananya@upi" },
  ];

  const filteredContacts = searchTerm
    ? contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phoneNumber.includes(searchTerm) ||
        contact.upiId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : contacts;

  const recentContacts = contacts.filter(contact => contact.recentlyPaid);

  const handleBack = () => {
    if (step > 1 && !paymentSuccess) {
      setStep(step - 1);
      if (step === 2) {
        setSelectedContact(null);
      }
    } else if (!paymentSuccess) {
      navigate("/");
    } else {
      // After successful payment, go home
      navigate("/");
    }
  };

  const handleNext = () => {
    if (step === 1 && selectedContact) {
      setStep(2);
    } else if (step === 1 && !selectedContact) {
      toast({
        title: "No contact selected",
        description: "Please select a contact to continue",
        variant: "destructive"
      });
    } else if (step === 2) {
      if (!amount || parseFloat(amount) <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount",
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
      
      // Use v2 transfer API with proper authentication
      const response = await fetch(getApiUrl("/api/v2/payments/transfer"), {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ 
          recipientUpiId: selectedContact?.upiId,
          recipientName: selectedContact?.name,
          amount: parseFloat(amount),
          pin: '1234', // Will be overridden by biometric if used
          note: note || undefined,
          authMethod: authMethod
        })
      });

      const result = await response.json();

      if (result.success) {
        // Set the completed transaction data
        const transaction = {
          id: result.transaction?._id || result.transaction?.transactionId || Date.now(),
          type: "transfer_out",
          amount: parseFloat(amount),
          status: "success",
          description: `Money Transfer to ${selectedContact?.name} (${selectedContact?.upiId})${note ? ` - ${note}` : ''}`,
          timestamp: new Date().toISOString(),
          authMethod: authMethod,
          recipientName: selectedContact?.name,
          upiId: selectedContact?.upiId,
          ...result.transaction
        };
        
        setCompletedTransaction(transaction);

        // Invalidate transactions cache to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        queryClient.invalidateQueries({ queryKey: ['payment-history'] });

        // Show receipt instead of the step 3 success screen
        setShowReceipt(true);
        setPaymentSuccess(true);
      } else {
        throw new Error(result.message || "Transfer failed");
      }
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
    if (!selectedContact || !amount) return;

    // Validate UPI ID format
    const upiRegex = /^[\w\.\-]+@[a-zA-Z]+$/;
    if (selectedContact.upiId && !upiRegex.test(selectedContact.upiId)) {
      toast({
        title: "Invalid UPI ID",
        description: "Please enter a valid UPI ID",
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
        {step === 1 && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
              <Input
                placeholder="Search contacts, phone or UPI ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-base"
              />
            </div>

            {recentContacts.length > 0 && !searchTerm && (
              <>
                <h2 className="font-medium text-gray-700">Recent</h2>
                <div className="grid grid-cols-4 gap-4">
                  {recentContacts.map(contact => (
                    <div
                      key={contact.id}
                      className="flex flex-col items-center cursor-pointer"
                      onClick={() => setSelectedContact(contact)}
                    >
                      <Avatar className={`h-14 w-14 ${selectedContact?.id === contact.id ? 'ring-2 ring-blue-500' : ''}`}>
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs mt-1 text-center">{contact.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="space-y-3">
              <h2 className="font-medium text-gray-700">All Contacts</h2>
              {filteredContacts.length > 0 ? (
                <div className="space-y-2">
                  {filteredContacts.map(contact => (
                    <div
                      key={contact.id}
                      className={`flex items-center p-3 rounded-lg cursor-pointer ${
                        selectedContact?.id === contact.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-xs text-gray-500">{contact.upiId}</div>
                      </div>
                      {selectedContact?.id === contact.id && (
                        <BadgeCheck className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No contacts found</p>
                </div>
              )}
            </div>

            <Button
              onClick={handleNext}
              className="w-full py-6 text-lg mt-4"
              disabled={!selectedContact}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && selectedContact && (
          <div className="space-y-6">
            <div className="flex flex-col items-center py-4">
              <Avatar className="h-16 w-16 mb-2">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                  {getInitials(selectedContact.name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-medium">{selectedContact.name}</h2>
              <p className="text-sm text-gray-500">{selectedContact.upiId}</p>
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
                    onClick={() => handleQuickAmountSelect(value)}
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
              onClick={handlePayment}
              className="w-full py-6 text-lg mt-6"
              disabled={!amount || parseFloat(amount) <= 0 || loading}
            >
              {loading ? "Processing..." : `Pay ₹${amount || '0'}`}
            </Button>
          </div>
        )}

        {step === 3 && selectedContact && paymentSuccess && (
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
                <span className="font-medium">{selectedContact.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">UPI ID</span>
                <span className="font-medium">{selectedContact.upiId}</span>
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
        recipient={selectedContact?.name}
        description={`Transfer to ${selectedContact?.upiId}`}
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