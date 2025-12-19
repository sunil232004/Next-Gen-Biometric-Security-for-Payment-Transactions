import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Lightbulb, BadgeCheck, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BiometricAuthModal from "@/components/BiometricAuthModal";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface Provider {
  id: number;
  name: string;
  regions: string[];
}

interface BillDetails {
  billNumber: string;
  name: string;
  amount: number;
  dueDate: string;
}

export default function ElectricityBill() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [consumerNumber, setConsumerNumber] = useState("");
  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingBill, setFetchingBill] = useState(false);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  
  // Mock data - in a real app, these would come from API
  const providers: Provider[] = [
    { 
      id: 1, 
      name: "Tata Power", 
      regions: ["Mumbai", "Delhi", "Ajmer", "Jamshedpur"] 
    },
    { 
      id: 2, 
      name: "Reliance Energy", 
      regions: ["Mumbai", "Delhi", "Orissa"] 
    },
    { 
      id: 3, 
      name: "BEST", 
      regions: ["Mumbai"] 
    },
    { 
      id: 4, 
      name: "Adani Electricity", 
      regions: ["Mumbai", "Ahmedabad"] 
    },
  ];

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 3) {
        setBillDetails(null);
      }
    } else {
      navigate("/");
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedProvider || !selectedRegion) {
        toast({
          title: "Incomplete information",
          description: "Please select both provider and region",
          variant: "destructive"
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!consumerNumber || consumerNumber.length < 8) {
        toast({
          title: "Invalid consumer number",
          description: "Please enter a valid consumer number",
          variant: "destructive"
        });
        return;
      }
      fetchBillDetails();
    }
  };

  const fetchBillDetails = () => {
    setFetchingBill(true);
    
    // Simulating API call to fetch bill details
    setTimeout(() => {
      // Mock bill details
      const mockBill: BillDetails = {
        billNumber: "EL" + Math.floor(Math.random() * 1000000),
        name: "John Doe",
        amount: Math.floor(Math.random() * 3001) + 500,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
      };
      
      setBillDetails(mockBill);
      setFetchingBill(false);
      setStep(3);
    }, 1500);
  };

  const handlePayment = () => {
    if (!billDetails) return;
    setIsBiometricModalOpen(true);
  };

  const handleBiometricSuccess = async (type: string, data: string) => {
    setIsBiometricModalOpen(false);
    setLoading(true);
    
    try {
      // Create a transaction
      const response = await apiRequest("/api/transaction", {
        method: "POST",
        body: {
          userId: 1, // In a real app, get from auth context
          type: "bill_payment",
          amount: billDetails?.amount || 0,
          status: "success",
          description: `Electricity Bill Payment - ${selectedProvider?.name} (${selectedRegion}) - ${consumerNumber}`,
          timestamp: new Date().toISOString(),
          authMethod: type, // fingerprint, face, or voice
          createdAt: new Date().toISOString()
        }
      });

      // Invalidate transactions cache to refresh data
      queryClient.invalidateQueries({queryKey: ["/api/transactions"]});
      queryClient.invalidateQueries({queryKey: ['payment-history']});
      
      toast({
        title: "Bill Payment Successful!",
        description: `Your electricity bill payment of ₹${billDetails?.amount} was successful.`,
      });
      
      // Navigate to home after success
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Bill payment failed:", error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-white shadow-lg flex flex-col">
      <header className="bg-[#00baf2] text-white p-4 flex items-center">
        <button onClick={handleBack} className="mr-4">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold">Electricity Bill Payment</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4">
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
                Electricity Provider
              </label>
              <Select
                value={selectedProvider ? String(selectedProvider.id) : ""}
                onValueChange={(value) => {
                  const provider = providers.find(p => p.id === parseInt(value));
                  setSelectedProvider(provider || null);
                  setSelectedRegion("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(provider => (
                    <SelectItem key={provider.id} value={String(provider.id)}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedProvider && (
              <div className="space-y-3">
                <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                  Region
                </label>
                <Select
                  value={selectedRegion}
                  onValueChange={setSelectedRegion}
                  disabled={!selectedProvider}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProvider?.regions.map(region => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="bg-amber-50 p-3 rounded-lg flex">
              <Lightbulb className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-1" />
              <p className="text-sm text-amber-700">
                Select your electricity provider and region to proceed with bill payment
              </p>
            </div>
            
            <Button 
              onClick={handleNext} 
              className="w-full py-6 text-lg"
              disabled={!selectedProvider || !selectedRegion}
            >
              Continue
            </Button>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-1">Provider Details</h2>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <span>Provider:</span>
                <span className="font-medium">{selectedProvider?.name}</span>
                <span>Region:</span>
                <span className="font-medium">{selectedRegion}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <label htmlFor="consumerNumber" className="block text-sm font-medium text-gray-700">
                Consumer Number / Customer ID
              </label>
              <Input
                id="consumerNumber"
                value={consumerNumber}
                onChange={(e) => setConsumerNumber(e.target.value.replace(/\s/g, ""))}
                placeholder="Enter consumer number"
                className="text-lg"
              />
              <p className="text-xs text-gray-500">
                You can find your consumer number on your electricity bill or registered mobile number
              </p>
            </div>
            
            <Button 
              onClick={handleNext} 
              className="w-full py-6 text-lg"
              disabled={fetchingBill || consumerNumber.length < 8}
            >
              {fetchingBill ? "Fetching Bill Details..." : "Fetch Bill"}
            </Button>
          </div>
        )}
        
        {step === 3 && billDetails && (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-gray-900">Bill Details</h2>
                <BadgeCheck className="h-6 w-6 text-green-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-gray-600">Consumer Number:</span>
                <span className="font-medium">{consumerNumber}</span>
                <span className="text-gray-600">Consumer Name:</span>
                <span className="font-medium">{billDetails.name}</span>
                <span className="text-gray-600">Bill Number:</span>
                <span className="font-medium">{billDetails.billNumber}</span>
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">{billDetails.dueDate}</span>
                <span className="text-gray-600">Provider:</span>
                <span className="font-medium">{selectedProvider?.name}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Bill Amount:</span>
                <span className="font-semibold text-lg">₹{billDetails.amount.toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              onClick={handlePayment} 
              className="w-full py-6 text-lg"
              disabled={loading}
            >
              {loading ? "Processing..." : `Pay ₹${billDetails.amount.toFixed(2)}`}
            </Button>
            
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Lightbulb className="h-4 w-4 mr-1" />
              <span>Secure Payment via Paytm</span>
            </div>
          </div>
        )}
      </main>
      
      <BiometricAuthModal 
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        onSuccess={handleBiometricSuccess}
        mode="verify"
        userId={1} // In a real app, get from auth context
      />
    </div>
  );
}