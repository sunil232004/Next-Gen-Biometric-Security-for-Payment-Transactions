import { Wallet, CreditCard, PieChart, Plane, Briefcase, Film, Grid, Train, Bus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSafeNavigation } from '@/hooks/use-safe-navigation';

export default function DoMoreSection() {
  const { toast } = useToast();
  const [, navigate] = useSafeNavigation();

  const handleServiceClick = (title: string) => {
    toast({
      title: title,
      description: `${title} service coming soon!`,
    });
  };

  const doMoreOptions = [
    {
      id: "personal-loan",
      icon: <Briefcase className="text-[#0d4bb5] h-6 w-6" />,
      title: "Personal Loan",
      onClick: () => navigate("/personal-loan")
    },
    {
      id: "credit-card",
      icon: <CreditCard className="text-[#0d4bb5] h-6 w-6" />,
      title: "Credit Card Carnival",
      onClick: () => navigate("/credit-card")
    },
    {
      id: "paytm-money",
      icon: <Wallet className="text-[#0d4bb5] h-6 w-6" />,
      title: "Paytm Money",
      onClick: () => handleServiceClick("Paytm Money")
    },
    {
      id: "sbi-mf",
      icon: <PieChart className="text-[#0d4bb5] h-6 w-6" />,
      title: "SBI MF SIP @ ₹250",
      onClick: () => handleServiceClick("SBI MF SIP")
    },
    {
      id: "travel",
      icon: <Plane className="text-[#0d4bb5] h-6 w-6" />,
      title: "Flight Booking",
      onClick: () => navigate("/flight-booking")
    },
    {
      id: "train",
      icon: <Train className="text-[#0d4bb5] h-6 w-6" />,
      title: "Train Booking",
      onClick: () => navigate("/train-booking")
    },
    {
      id: "bus",
      icon: <Bus className="text-[#0d4bb5] h-6 w-6" />,
      title: "Bus Booking",
      onClick: () => navigate("/bus-booking")
    },
    {
      id: "all-services",
      icon: <Grid className="text-[#0d4bb5] h-6 w-6" />,
      title: "All Services",
      onClick: () => navigate("/all-services")
    }
  ];

  return (
    <div className="px-3 sm:px-4 py-2.5 sm:py-3 mt-1">
      <h2 className="font-semibold text-[#333333] text-sm sm:text-base mb-2.5 sm:mb-3">DO MORE WITH PAYTM</h2>
      
      <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {doMoreOptions.map((option) => (
          <div 
            key={option.id} 
            className="flex flex-col items-center cursor-pointer group transition-transform active:scale-95"
            onClick={option.onClick}
          >
            <div className="bg-white p-1.5 sm:p-2 rounded-lg shadow-sm mb-1.5 sm:mb-2 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center group-hover:bg-gray-50 transition-colors">
              {option.icon}
            </div>
            <span className="text-[10px] sm:text-xs text-center leading-tight line-clamp-2">
              {option.title.replace(/ /g, '\n')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
