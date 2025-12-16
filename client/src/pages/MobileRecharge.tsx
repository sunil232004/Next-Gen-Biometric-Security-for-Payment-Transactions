import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Phone, BadgeCheck, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UPIPinVerification } from "@/components/UpiPinVerification";
import TransactionReceipt from "@/components/TransactionReceipt";
import PaymentVerificationGate from "@/components/PaymentVerificationGate";
import { useAuth } from "@/contexts/AuthContext";

interface RechargeOperator {
  id: number;
  name: string;
  logo: string;
}

interface RechargePlan {
  id: number;
  amount: number;
  validity: string;
  data: string;
  description: string;
}

export default function MobileRecharge() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, biometrics } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [operator, setOperator] = useState<RechargeOperator | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showUPIPin, setShowUPIPin] = useState(false);
  const [showBiometricVerification, setShowBiometricVerification] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  
  // Mock data - in a real app, these would come from API
  const operators: RechargeOperator[] = [
    { id: 1, name: "Jio", logo: "jio" },
    { id: 2, name: "Airtel", logo: "airtel" },
    { id: 3, name: "Vodafone Idea", logo: "vi" },
    { id: 4, name: "BSNL", logo: "bsnl" },
  ];
  
  const plans: RechargePlan[] = [
    { id: 1, amount: 239, validity: "28 days", data: "1.5GB/day", description: "Unlimited calls, 100 SMS/day" },
    { id: 2, amount: 479, validity: "56 days", data: "1.5GB/day", description: "Unlimited calls, 100 SMS/day" },
    { id: 3, amount: 666, validity: "84 days", data: "1.5GB/day", description: "Unlimited calls, 100 SMS/day" },
    { id: 4, amount: 719, validity: "84 days", data: "2GB/day", description: "Unlimited calls, 100 SMS/day" },
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!phoneNumber || phoneNumber.length !== 10) {
        toast({
          title: "Invalid phone number",
          description: "Please enter a valid 10-digit phone number",
          variant: "destructive"
        });
        return;
      }
      setStep(2);
    } else if (step === 2 && !operator) {
      toast({
        title: "Select an operator",
        description: "Please select your mobile operator",
        variant: "destructive"
      });
    } else if (step === 2 && operator) {
      setStep(3);
    } else if (step === 3 && !selectedPlan) {
      toast({
        title: "Select a plan",
        description: "Please select a recharge plan",
        variant: "destructive"
      });
    } else if (step === 3 && selectedPlan) {
      // Check if user has biometrics, use that first
      if (biometrics && biometrics.length > 0) {
        setShowBiometricVerification(true);
      } else {
        setShowUPIPin(true);
      }
    }
  };

  const handleBiometricSuccess = async (method: string) => {
    setShowBiometricVerification(false);
    await processRecharge(method);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate("/");
    }
  };

  const handleUPIPinSuccess = async () => {
    setShowUPIPin(false);
    await processRecharge('upi_pin');
  };

  const processRecharge = async (authMethod: string) => {
    setLoading(true);
    
    try {
      // Create transaction data with metadata
      const transactionData = {
        userId: user?._id || 1,
        type: "recharge",
        amount: selectedPlan?.amount || 0,
        status: "success",
        description: `Mobile Recharge for ${phoneNumber} (${operator?.name}) - ${selectedPlan?.data}`,
        timestamp: new Date().toISOString(),
        authMethod: authMethod,
        createdAt: new Date().toISOString(),
        metadata: JSON.stringify({
          recipientName: "Your Mobile Number",
          phoneNumber: phoneNumber,
          operator: operator?.name,
          plan: selectedPlan?.data,
          validity: selectedPlan?.validity
        })
      };
      
      // Create a transaction
      const response = await apiRequest("/api/transaction", {
        method: "POST",
        body: transactionData
      });

      // Merge server response with original data (server may not return all fields)
      const serverTransaction = response?.transaction || response;
      const transaction = {
        ...transactionData,
        ...serverTransaction,
        id: serverTransaction?.id || serverTransaction?._id || Date.now(),
        amount: selectedPlan?.amount || 0,
        description: transactionData.description,
        authMethod: authMethod,
        metadata: transactionData.metadata
      };
      
      // Set the completed transaction and show receipt
      setCompletedTransaction(transaction);
      setShowReceipt(true);

      // Invalidate transactions cache to refresh data
      queryClient.invalidateQueries({queryKey: ["/api/transactions"]});
    } catch (error) {
      console.error("Recharge failed:", error);
      toast({
        title: "Recharge Failed",
        description: "There was an error processing your recharge. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container mx-auto min-h-screen bg-white shadow-lg flex flex-col">
      <header className="bg-[#00baf2] text-white p-responsive flex items-center sticky top-0 z-10">
        <button onClick={handleBack} className="mr-3 sm:mr-4 tap-target">
          <ChevronLeft className="icon-responsive-lg" />
        </button>
        <h1 className="text-responsive-lg font-semibold">Mobile Recharge</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-responsive scroll-smooth-touch">
        {step === 1 && (
          <div className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-responsive-sm font-medium text-gray-700">
                Mobile Number
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                maxLength={10}
                className="input-responsive text-responsive-base"
              />
            </div>
            
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg sm:rounded-xl flex">
              <Phone className="icon-responsive-md text-blue-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-responsive-sm text-blue-700">
                Please enter the mobile number you wish to recharge
              </p>
            </div>
            
            <Button 
              onClick={handleNext} 
              className="w-full btn-responsive-lg"
              disabled={phoneNumber.length !== 10}
            >
              Proceed to Recharge
            </Button>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Select Operator</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {operators.map(op => (
                <div 
                  key={op.id}
                  className={`border rounded-lg p-4 flex items-center cursor-pointer ${
                    operator?.id === op.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setOperator(op)}
                >
                  <div className="mr-3 h-10 w-10 flex items-center justify-center">
                    <span className="text-xl font-semibold text-blue-600">{op.name.charAt(0)}</span>
                  </div>
                  <span className="font-medium">{op.name}</span>
                  {operator?.id === op.id && (
                    <BadgeCheck className="ml-auto h-5 w-5 text-blue-500" />
                  )}
                </div>
              ))}
            </div>
            
            <Button onClick={handleNext} className="w-full py-6 text-lg" disabled={!operator}>
              Continue
            </Button>
          </div>
        )}
        
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-1">Recharge Details</h2>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <span>Mobile Number:</span>
                <span className="font-medium">{phoneNumber}</span>
                <span>Operator:</span>
                <span className="font-medium">{operator?.name}</span>
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900">Select Plan</h3>
            
            <div className="space-y-3">
              {plans.map(plan => (
                <div 
                  key={plan.id}
                  className={`border rounded-lg p-3 cursor-pointer ${
                    selectedPlan?.id === plan.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">₹{plan.amount}</span>
                    <span className="text-sm text-gray-500">Validity: {plan.validity}</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-medium">{plan.data}</div>
                    <div className="text-xs text-gray-500">{plan.description}</div>
                  </div>
                  {selectedPlan?.id === plan.id && (
                    <BadgeCheck className="absolute right-6 h-5 w-5 text-blue-500" />
                  )}
                </div>
              ))}
            </div>
            
            <Button 
              onClick={handleNext} 
              className="w-full py-6 text-lg"
              disabled={!selectedPlan || loading}
            >
              {loading ? "Processing..." : `Pay ₹${selectedPlan?.amount || 0}`}
            </Button>
          </div>
        )}
      </main>
      
      {showUPIPin && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Complete Payment</h2>
            <UPIPinVerification
              userId={user?._id ? parseInt(user._id) : 1}
              amount={selectedPlan.amount}
              purpose="mobile_recharge"
              onSuccess={handleUPIPinSuccess}
              onCancel={() => setShowUPIPin(false)}
            />
          </div>
        </div>
      )}

      {/* Biometric Verification Modal */}
      {selectedPlan && (
        <PaymentVerificationGate
          isOpen={showBiometricVerification}
          onClose={() => setShowBiometricVerification(false)}
          onSuccess={handleBiometricSuccess}
          amount={selectedPlan.amount}
          recipient={`${operator?.name} - ${phoneNumber}`}
          description="Mobile Recharge"
        />
      )}
      
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