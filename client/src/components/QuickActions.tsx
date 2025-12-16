import { QrCode, Smartphone, Building2, User, FileText, PlusCircle, Wallet } from "lucide-react";
import { useSafeNavigation } from "@/hooks/use-safe-navigation";
import { useToast } from "@/hooks/use-toast";

export default function QuickActions() {
  const [, navigate] = useSafeNavigation();
  const { toast } = useToast();

  const quickActions = [
    {
      id: "scan-pay",
      icon: <QrCode className="text-white h-5 w-5 sm:h-6 sm:w-6" />,
      title: "Scan & Pay",
      onClick: () => navigate("scan-qr")
    },
    {
      id: "mobile-transfer",
      icon: <Smartphone className="text-white h-5 w-5 sm:h-6 sm:w-6" />,
      title: "To Mobile or Contact",
      onClick: () => navigate("money-transfer")
    },
    {
      id: "bank-transfer",
      icon: <Building2 className="text-white h-5 w-5 sm:h-6 sm:w-6" />,
      title: "To Bank A/c or UPI ID",
      onClick: () => navigate("money-transfer?mode=bank")
    },
    {
      id: "self-transfer", 
      icon: <User className="text-white h-5 w-5 sm:h-6 sm:w-6" />,
      title: "To Self A/c",
      onClick: () => navigate("money-transfer?mode=self")
    }
  ];

  return (
    <>
      {/* Quick action icons grid */}
      <div className="grid grid-cols-4 px-3 sm:px-4 py-2.5 sm:py-3 gap-1 sm:gap-2">
        {quickActions.map((action) => (
          <div 
            key={action.id} 
            className="flex flex-col items-center cursor-pointer group transition-transform active:scale-95"
            onClick={action.onClick}
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#0d4bb5] rounded-lg flex items-center justify-center mb-1 group-hover:bg-[#0a3d96] transition-colors">
              {action.icon}
            </div>
            <span className="text-[10px] sm:text-xs text-center leading-tight line-clamp-2">
              {action.title.replace(/ /g, '\n')}
            </span>
          </div>
        ))}
      </div>

      {/* Action buttons row */}
      <div className="flex justify-between gap-2 px-3 sm:px-4 py-2">
        <button 
          className="flex-1 flex items-center justify-center border border-[#e1e1e1] rounded-lg py-2 sm:py-2.5 px-2 sm:px-3 text-[#333333] hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[44px]"
          onClick={() => navigate("transaction-history")}
        >
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-[#0d4bb5] flex-shrink-0" />
          <span className="text-[10px] sm:text-xs text-left leading-tight">Check Balance<br/>&amp; History</span>
        </button>

        <button 
          className="flex-1 flex items-center justify-center border border-[#e1e1e1] rounded-lg py-2 sm:py-2.5 px-2 sm:px-3 text-[#333333] hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[44px]"
          onClick={() => navigate("receive-qr")}
        >
          <QrCode className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-[#0d4bb5] flex-shrink-0" />
          <span className="text-[10px] sm:text-xs text-left leading-tight">Receive<br/>Money QR</span>
        </button>

        <button 
          className="flex-1 flex items-center justify-center border border-[#e1e1e1] rounded-lg py-2 sm:py-2.5 px-2 sm:px-3 text-[#333333] bg-[#f5f7ff] hover:bg-[#ebeeff] active:bg-[#dde3ff] transition-colors min-h-[44px]"
          onClick={() => navigate("add-money")}
        >
          <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-[#0d4bb5] flex-shrink-0" />
          <span className="text-[10px] sm:text-xs text-left leading-tight">Add<br/>Money</span>
        </button>
      </div>
    </>
  );
}