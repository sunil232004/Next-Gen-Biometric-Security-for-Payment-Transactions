import { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, Check, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

export default function CreditCardApplication() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    pan: '',
    email: '',
    pincode: '',
    occupationType: 'Salaried'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: string) => {
    setFormData(prev => ({ ...prev, occupationType: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real app, this would send the application data to the server
      // For demo purposes, we'll just simulate a success after a delay
      setTimeout(() => {
        setStep(3); // Go to success step
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  const validateStep1 = () => {
    return true; // No validation in step 1
  };

  const validateStep2 = () => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(formData.pan)) {
      toast({
        title: "Invalid PAN",
        description: "Please enter a valid PAN number",
        variant: "destructive"
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return false;
    }

    if (formData.pincode.length !== 6 || !/^\d+$/.test(formData.pincode)) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const renderStepOne = () => (
    <>
      <div className="p-5 text-center">
        <h1 className="text-xl font-semibold mb-3">Get the best credit card as per your needs</h1>
        <div className="flex justify-center items-center my-3">
          <div className="flex space-x-1">
            <img src="https://assetscdn1.paytm.com/images/catalog/view_item/854117/1626176577528.png" 
                alt="HDFC" className="h-6" />
            <img src="https://assetscdn1.paytm.com/images/catalog/view_item/854118/1626176694604.png" 
                alt="SBI" className="h-6" />
            <img src="https://assetscdn1.paytm.com/images/catalog/view_item/854119/1626176712093.png" 
                alt="ICICI" className="h-6" />
            <span className="text-sm text-gray-600">+4 Banking partners</span>
          </div>
        </div>
      </div>

      <div className="h-56 relative overflow-hidden bg-gradient-to-b from-blue-500 to-blue-600">
        <div className="absolute -bottom-5 left-0 right-0 flex justify-center">
          <div className="flex items-center space-x-2">
            <img src="https://assetscdn1.paytm.com/images/catalog/view_item/1063658/1665751095984.png" 
                alt="Credit Card" className="h-36 transform -rotate-12" />
            <img src="https://assetscdn1.paytm.com/images/catalog/view_item/1063660/1665751157421.png" 
                alt="Credit Card" className="h-40" />
            <img src="https://assetscdn1.paytm.com/images/catalog/view_item/1063659/1665751133235.png" 
                alt="Credit Card" className="h-36 transform rotate-12" />
          </div>
        </div>
      </div>

      <div className="relative mt-10 p-5 pt-8 bg-white rounded-lg mx-4 shadow-md -mt-6">
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-1 rounded-md text-sm font-medium">
          TOP BENEFITS
        </div>

        <div className="grid grid-cols-3 gap-4 my-5">
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 p-3 rounded-full mb-2 relative">
              <img src="https://assetscdn1.paytm.com/images/catalog/view_item/725979/1665752511708.png" 
                  alt="Rewards" className="h-8 w-8" />
              <div className="absolute -top-2 -left-2 bg-yellow-400 text-xs p-1 rounded-md transform -rotate-12">
                LIMITED TIME OFFER
              </div>
            </div>
            <p className="text-xs font-medium">Reward Points on every spend</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 p-3 rounded-full mb-2">
              <img src="https://assetscdn1.paytm.com/images/catalog/view_item/725981/1665752558975.png" 
                  alt="Vouchers" className="h-8 w-8" />
            </div>
            <p className="text-xs font-medium">₹50,000 in vouchers</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 p-3 rounded-full mb-2">
              <img src="https://assetscdn1.paytm.com/images/catalog/view_item/725982/1665752595190.png" 
                  alt="UPI" className="h-8 w-8" />
            </div>
            <p className="text-xs font-medium">Credit Card on UPI</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 p-3 rounded-full mb-2">
              <img src="https://assetscdn1.paytm.com/images/catalog/view_item/725983/1665752622951.png" 
                  alt="Airport" className="h-8 w-8" />
            </div>
            <p className="text-xs font-medium">Free Airport Lounge access</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 p-3 rounded-full mb-2">
              <img src="https://assetscdn1.paytm.com/images/catalog/view_item/1066755/1665762927753.png" 
                  alt="Lifetime" className="h-8 w-8" />
            </div>
            <p className="text-xs font-medium">Lifetime free Credit Card</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-100 p-3 rounded-full mb-2">
              <img src="https://assetscdn1.paytm.com/images/catalog/view_item/725984/1665752642862.png" 
                  alt="Fuel" className="h-8 w-8" />
            </div>
            <p className="text-xs font-medium">Fuel Surcharge waiver</p>
          </div>
        </div>

        <button 
          onClick={handleNext}
          className="w-full bg-[#00B9F1] text-white py-3 rounded-md font-medium text-lg"
        >
          Get Started
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          *Offers will vary depending on bank partner
        </p>
      </div>
    </>
  );

  const renderStepTwo = () => (
    <div className="p-4">
      <div className="flex items-center mb-5">
        <img src="https://assetscdn1.paytm.com/images/catalog/view/310944/1654517453942.png" 
             alt="Paytm" className="h-6 mr-2" />
        <div className="flex-1"></div>
        <div className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
          <span>CARD ISSUED BY</span>
          <img src="https://assetscdn1.paytm.com/images/catalog/view_item/854118/1626176694604.png" 
               alt="SBI" className="h-5 ml-1" />
        </div>
      </div>

      <h1 className="text-lg font-medium mb-6">
        Confirm your details and get the best credit card offers.
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <input
              type="text"
              name="pan"
              value={formData.pan}
              onChange={handleInputChange}
              placeholder="Enter PAN"
              className="w-full p-3 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email ID"
              className="w-full p-3 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleInputChange}
              placeholder="Current address pincode"
              className="w-full p-3 border border-gray-300 rounded-md"
              maxLength={6}
              required
            />
          </div>

          <div>
            <p className="mb-2">Occupation Type</p>
            <div className="flex space-x-4">
              <div 
                className={`border rounded-md p-3 flex-1 ${formData.occupationType === 'Salaried' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                onClick={() => handleRadioChange('Salaried')}
              >
                <div className="flex items-start mb-1">
                  <div className="h-5 w-5 rounded-full border border-gray-300 flex items-center justify-center mr-2 bg-white">
                    {formData.occupationType === 'Salaried' && (
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                  <div className="font-medium">Salaried</div>
                </div>
                <p className="text-xs text-gray-600 ml-7">Receive salary from company/organisation</p>
              </div>
              
              <div 
                className={`border rounded-md p-3 flex-1 ${formData.occupationType === 'SelfEmployed' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                onClick={() => handleRadioChange('SelfEmployed')}
              >
                <div className="flex items-start mb-1">
                  <div className="h-5 w-5 rounded-full border border-gray-300 flex items-center justify-center mr-2 bg-white">
                    {formData.occupationType === 'SelfEmployed' && (
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                  <div className="font-medium">Self Employed</div>
                </div>
                <p className="text-xs text-gray-600 ml-7">Own business, shopkeeper, trader etc</p>
              </div>
            </div>
          </div>

          <div className="flex items-start mt-4">
            <input
              type="checkbox"
              id="consent"
              className="mt-1 mr-2"
              required
            />
            <label htmlFor="consent" className="text-xs">
              I grant One97 Communications Limited (Paytm) explicit authorisation to collect, store and utilize my
              Credit Information Report obtained from Credit Bureaus and further, acknowledge and consent to the 
              <span className="text-blue-500"> Terms and Conditions</span> outlined for the processing of
              my Credit Card application.
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-[#00B9F1] text-white py-3 rounded-md font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Continue'}
          </button>

          <div className="flex items-center justify-center text-xs text-gray-600 mt-4">
            <Info className="h-3 w-3 mr-1 text-blue-500" />
            <span>This will not affect your credit score</span>
          </div>
        </div>
      </form>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="p-5 flex flex-col items-center justify-center h-[80vh]">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
        <Check className="h-10 w-10 text-green-600" />
      </div>
      <h2 className="text-xl font-semibold mb-3">Application Submitted!</h2>
      <p className="text-center text-gray-600 mb-6">
        Your credit card application has been successfully submitted. 
        We'll review your application and get back to you shortly.
      </p>
      <button
        onClick={() => navigate("/")}
        className="w-full bg-[#0d4bb5] text-white py-3 rounded-md font-medium"
      >
        Back to Home
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0d4bb5] text-white p-4 flex items-center">
        <button 
          className="flex items-center" 
          onClick={() => step > 1 ? setStep(step - 1) : navigate("/")}
        >
          <ChevronLeft size={24} />
          <span className="ml-2">Back</span>
        </button>
        {step === 2 && <div className="flex-1 text-center text-lg font-medium">Credit Card Application</div>}
        {step === 3 && <div className="flex-1 text-center text-lg font-medium">Application Status</div>}
      </div>

      {step === 1 && renderStepOne()}
      {step === 2 && renderStepTwo()}
      {step === 3 && renderSuccessStep()}
    </div>
  );
}