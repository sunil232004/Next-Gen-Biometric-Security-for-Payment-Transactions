import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useSafeNavigation } from "@/hooks/use-safe-navigation";
import { useToast } from "@/hooks/use-toast";

export default function PersonalLoan() {
  const [, navigate] = useSafeNavigation();
  const { toast } = useToast();
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleBackClick = () => {
    navigate("/");
  };

  const handleGetItNow = () => {
    if (!agreeToTerms) {
      toast({
        title: "Terms & Conditions Required",
        description: "Please agree to the terms and conditions to proceed.",
        variant: "destructive"
      });
      return;
    }
    
    navigate("/personal-loan/application");
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <div className="p-4 flex items-center space-x-3 border-b border-gray-200">
        <button onClick={handleBackClick} className="focus:outline-none">
          <ArrowLeft className="h-5 w-5 text-black" />
        </button>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
            <span className="text-lg">₹</span>
          </div>
          <div>
            <h1 className="text-md font-bold">Personal Loan</h1>
          </div>
        </div>
        <div className="text-blue-500 text-sm ml-auto">Loan Advisor ID</div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h2 className="text-xl font-semibold text-center my-4">
          Fulfill all your wishes with an Instant Loan
        </h2>

        <div className="bg-blue-500 text-white rounded-lg p-5 my-4">
          <div className="flex items-center mb-2">
            <div className="bg-yellow-400 rounded-full h-12 w-12 flex items-center justify-center mr-2">
              <span className="text-xl">₹</span>
            </div>
            <span className="text-4xl font-bold">15Lakh</span>
          </div>
          <p className="text-sm mb-4">in just a few minutes</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-600" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-sm">100% Paperless</span>
            </div>
            
            <div className="flex items-center">
              <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-yellow-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 14C8.45714 15.4 10.0286 17 12 17C13.9714 17 15.5429 15.4 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M9 9H9.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M15 9H15.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-sm">Collateral Free</span>
            </div>
            
            <div className="flex items-center">
              <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange-500" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M22 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M19.0711 4.92896L17.6569 6.34317" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6.34315 17.6569L4.92894 19.0711" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M19.0711 19.0711L17.6569 17.6569" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6.34315 6.34317L4.92894 4.92896" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <span className="text-sm">Affordable EMIs</span>
            </div>
            
            <div className="flex items-center">
              <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-300" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 15H16" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 3V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M16 3V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-sm">Flexible Tenure</span>
            </div>
          </div>
        </div>

        <div className="mt-auto mb-4">
          <div className="flex items-start mb-3">
            <div 
              className={`w-5 h-5 border rounded mr-2 flex-shrink-0 flex items-center justify-center cursor-pointer ${agreeToTerms ? 'bg-[#0d4bb5] border-[#0d4bb5]' : 'border-gray-300'}`}
              onClick={() => setAgreeToTerms(!agreeToTerms)}
            >
              {agreeToTerms && <Check className="h-3 w-3 text-white" />}
            </div>
            <div className="text-xs">
              I agree to the <span className="text-teal-500 font-semibold">Terms and Conditions</span> and <span className="text-teal-500 font-semibold">Privacy Policy</span> of One97 Communications Ltd. (Paytm) and authorize Paytm to collect, <span className="text-teal-500 font-semibold">Read more</span>
            </div>
          </div>
          
          <button 
            className="w-full bg-[#00baf2] hover:bg-[#00a0d2] text-white rounded-lg p-4 font-semibold flex items-center justify-center"
            onClick={handleGetItNow}
          >
            Get it Now
            <svg className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 6L15 12L9 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}