import { useState } from "react";
import { ArrowLeft, Check, Info } from "lucide-react";
import { useSafeNavigation } from "@/hooks/use-safe-navigation";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  pan: string;
  email: string;
  occupationType: 'salaried' | 'self-employed' | null;
  pincode: string;
  agreeToTerms1: boolean;
  agreeToTerms2: boolean;
  agreeToTerms3: boolean;
}

export default function PersonalLoanApplication() {
  const [, navigate] = useSafeNavigation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    pan: '',
    email: '',
    occupationType: null,
    pincode: '560060',
    agreeToTerms1: true,
    agreeToTerms2: true,
    agreeToTerms3: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleBackClick = () => {
    navigate("/personal-loan");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error for this field if any
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleRadioChange = (value: 'salaried' | 'self-employed') => {
    setFormData({
      ...formData,
      occupationType: value
    });
    
    if (errors.occupationType) {
      setErrors({
        ...errors,
        occupationType: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // PAN validation - simple regex for Indian PAN
    if (!formData.pan.trim()) {
      newErrors.pan = 'PAN is required';
      isValid = false;
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.trim())) {
      newErrors.pan = 'Invalid PAN format';
      isValid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    }

    // Occupation type validation
    if (!formData.occupationType) {
      newErrors.occupationType = 'Please select your occupation type';
      isValid = false;
    }

    // Pincode validation
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
      isValid = false;
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must be 6 digits';
      isValid = false;
    }

    // Terms and conditions validation
    if (!formData.agreeToTerms1 || !formData.agreeToTerms2 || !formData.agreeToTerms3) {
      newErrors.terms = 'You must agree to all terms and conditions';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Process the loan application
      navigate("/personal-loan/approved");
    } else {
      toast({
        title: "Form Validation Failed",
        description: "Please correct the errors in the form.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <button onClick={handleBackClick} className="focus:outline-none">
          <ArrowLeft className="h-5 w-5 text-black" />
        </button>
        <h1 className="text-md font-semibold">Enter your basic details to get started</h1>
        <div className="w-5"></div> {/* Empty div for spacing */}
      </div>

      <div className="p-4">
        <div className="mb-4 bg-blue-100 p-3 rounded-md flex items-center">
          <div className="mr-2 text-blue-600">
            <Info className="h-5 w-5" />
          </div>
          <p className="text-sm text-blue-800">Your data is 100% safe and secure</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* PAN Input */}
            <div>
              <div className="relative">
                <input
                  type="text"
                  name="pan"
                  placeholder="Enter PAN"
                  className={`w-full p-3 border ${errors.pan ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  value={formData.pan}
                  onChange={handleChange}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 text-sm font-medium">
                  Forgot PAN
                </div>
              </div>
              {errors.pan && <p className="mt-1 text-xs text-red-500">{errors.pan}</p>}
            </div>

            {/* Email Input */}
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                className={`w-full p-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Occupation Type */}
            <div>
              <p className="mb-2 text-sm font-medium">Occupation Type</p>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer ${
                      formData.occupationType === 'salaried' ? 'border-blue-500' : 'border-gray-300'
                    }`}
                    onClick={() => handleRadioChange('salaried')}
                  >
                    {formData.occupationType === 'salaried' && (
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                  <span className="ml-2 text-sm">Salaried</span>
                </div>

                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer ${
                      formData.occupationType === 'self-employed' ? 'border-blue-500' : 'border-gray-300'
                    }`}
                    onClick={() => handleRadioChange('self-employed')}
                  >
                    {formData.occupationType === 'self-employed' && (
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                  <span className="ml-2 text-sm">Self Employed / Business</span>
                </div>
              </div>
              {errors.occupationType && <p className="mt-1 text-xs text-red-500">{errors.occupationType}</p>}
            </div>

            {/* Pincode */}
            <div className="relative">
              <p className="mb-1 text-xs text-gray-500">Pincode</p>
              <div className="flex">
                <input
                  type="text"
                  name="pincode"
                  className={`w-full p-3 border ${errors.pincode ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  value={formData.pincode}
                  onChange={handleChange}
                  maxLength={6}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              </div>
              {errors.pincode && <p className="mt-1 text-xs text-red-500">{errors.pincode}</p>}
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-3 mt-4">
              <div className="flex items-start">
                <div 
                  className={`w-5 h-5 border rounded mr-2 flex-shrink-0 flex items-center justify-center cursor-pointer mt-0.5 ${formData.agreeToTerms1 ? 'bg-[#0d4bb5] border-[#0d4bb5]' : 'border-gray-300'}`}
                  onClick={() => setFormData({...formData, agreeToTerms1: !formData.agreeToTerms1})}
                >
                  {formData.agreeToTerms1 && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="text-xs">
                  I agree to <span className="text-blue-500">Terms and Conditions & Privacy Policy</span>. I authorize One97 Communications Ltd to access my credit report from Credit bureaus and store it to process my Personal Loan Application.
                </div>
              </div>

              <div className="flex items-start">
                <div 
                  className={`w-5 h-5 border rounded mr-2 flex-shrink-0 flex items-center justify-center cursor-pointer mt-0.5 ${formData.agreeToTerms2 ? 'bg-[#0d4bb5] border-[#0d4bb5]' : 'border-gray-300'}`}
                  onClick={() => setFormData({...formData, agreeToTerms2: !formData.agreeToTerms2})}
                >
                  {formData.agreeToTerms2 && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="text-xs">
                  I authorize One97 Communications Ltd to share my basic details i.e. PAN, Date of Birth, Email ID & Occupation Type, with the Lending Partners for generating a loan offer. <span className="text-blue-500">List of Lending Partners</span>
                </div>
              </div>

              <div className="flex items-start">
                <div 
                  className={`w-5 h-5 border rounded mr-2 flex-shrink-0 flex items-center justify-center cursor-pointer mt-0.5 ${formData.agreeToTerms3 ? 'bg-[#0d4bb5] border-[#0d4bb5]' : 'border-gray-300'}`}
                  onClick={() => setFormData({...formData, agreeToTerms3: !formData.agreeToTerms3})}
                >
                  {formData.agreeToTerms3 && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="text-xs">
                  I allow One97 Communications Ltd to reach out to me with personalised offers on new products through SMS, WhatsAPP, Email and Voice.
                </div>
              </div>

              {errors.terms && <p className="mt-1 text-xs text-red-500">{errors.terms}</p>}
            </div>

            <button 
              type="submit"
              className="w-full bg-[#00baf2] text-white py-3 rounded-md font-semibold mt-4"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}