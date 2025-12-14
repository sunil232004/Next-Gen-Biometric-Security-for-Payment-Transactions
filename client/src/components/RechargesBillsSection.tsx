import { Smartphone, Lightbulb, CreditCard, Receipt } from "lucide-react";
import { useSafeNavigation } from "@/hooks/use-safe-navigation";
import { useToast } from "@/hooks/use-toast";

export default function RechargesBillsSection() {
  const [, navigate] = useSafeNavigation();
  const { toast } = useToast();

  const rechargeBillOptions = [
    {
      id: "mobile-recharge",
      icon: <Smartphone className="text-[#0d4bb5] h-6 w-6" />,
      title: "Mobile Recharge",
      path: "/mobile-recharge"
    },
    {
      id: "electricity-bill",
      icon: <Lightbulb className="text-[#0d4bb5] h-6 w-6" />,
      title: "Electricity Bill",
      path: "/electricity-bill"
    },
    {
      id: "credit-card",
      icon: <CreditCard className="text-[#0d4bb5] h-6 w-6" />,
      title: "Credit Card",
      path: "/",
      onClick: () => {
        toast({
          title: "Credit Card",
          description: "Credit Card payment feature coming soon!",
        });
      }
    },
    {
      id: "my-bills",
      icon: <Receipt className="text-[#0d4bb5] h-6 w-6" />,
      title: "My Bills",
      path: "/transaction-history"
    }
  ];

  const navigateToPath = (option: typeof rechargeBillOptions[0]) => {
    if (option.onClick) {
      option.onClick();
    } else {
      navigate(option.path);
    }
  };

  return (
    <div className="px-4 py-3 mt-2">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-[#333333]">RECHARGES &amp; BILL PAYMENTS</h2>
        <button 
          className="text-[#0d4bb5] text-sm flex items-center"
          onClick={() => navigate("/all-services")}
        >
          View all
          <div className="w-4 h-4 ml-1 rounded-full bg-gray-200 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-2 w-2 text-gray-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {rechargeBillOptions.map((option) => (
          <div 
            key={option.id} 
            className="flex flex-col items-center cursor-pointer"
            onClick={() => navigateToPath(option)}
          >
            <div className="bg-white p-2 rounded-lg shadow-sm mb-2 w-14 h-14 flex items-center justify-center hover:bg-gray-50">
              {option.icon}
            </div>
            <span className="text-xs text-center whitespace-pre-line">
              {option.title.replace(/ /g, '\n')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
