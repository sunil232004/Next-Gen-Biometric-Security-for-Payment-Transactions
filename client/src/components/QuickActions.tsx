import { QrCode, Smartphone, Building2, User, FileText, PlusCircle, Wallet } from "lucide-react";
import { useSafeNavigation } from "@/hooks/use-safe-navigation";
import { useToast } from "@/hooks/use-toast";

export default function QuickActions() {
  const [, navigate] = useSafeNavigation();
  const { toast } = useToast();

  const quickActions = [
    {
      id: "scan-pay",
      icon: <QrCode className="text-white h-5 w-5" />,
      title: "Scan & Pay",
      onClick: () => navigate("scan-qr") // Removed leading slash
    },
    {
      id: "mobile-transfer",
      icon: <Smartphone className="text-white h-5 w-5" />,
      title: "To Mobile or Contact",
      onClick: () => navigate("money-transfer") // Removed leading slash
    },
    {
      id: "bank-transfer",
      icon: <Building2 className="text-white h-5 w-5" />,
      title: "To Bank A/c or UPI ID",
      onClick: () => navigate("money-transfer?mode=bank") // Removed leading slash
    },
    {
      id: "self-transfer", 
      icon: <User className="text-white h-5 w-5" />,
      title: "To Self A/c",
      onClick: () => navigate("money-transfer?mode=self") // Removed leading slash
    }
  ];

  return (
    <>
      <div className="grid grid-cols-4 px-4 py-3">
        {quickActions.map((action) => (
          <div 
            key={action.id} 
            className="flex flex-col items-center cursor-pointer"
            onClick={action.onClick}
          >
            <div className="w-12 h-12 bg-[#0d4bb5] rounded-lg flex items-center justify-center mb-1">
              {action.icon}
            </div>
            <span className="text-xs text-center whitespace-pre-line">
              {action.title.replace(/ /g, '\n')}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between px-4 py-2">
        <button 
          className="flex items-center border border-[#e1e1e1] rounded-md py-1.5 px-3 text-[#333333]"
          onClick={() => navigate("transaction-history")} // Removed leading slash
        >
          <FileText className="h-5 w-5 mr-2 text-[#0d4bb5]" />
          <span className="text-sm">Check Balance<br/>&amp; History</span>
        </button>

        <button 
          className="flex items-center border border-[#e1e1e1] rounded-md py-1.5 px-3 text-[#333333]"
          onClick={() => navigate("receive-qr")} // Removed leading slash
        >
          <QrCode className="h-5 w-5 mr-2 text-[#0d4bb5]" />
          <span className="text-sm">Receive<br/>Money QR</span>
        </button>

        <button 
          className="flex items-center border border-[#e1e1e1] rounded-md py-1.5 px-3 text-[#333333] bg-[#f5f7ff]"
          onClick={() => navigate("add-money")} // Removed leading slash
        >
          <PlusCircle className="h-5 w-5 mr-2 text-[#0d4bb5]" />
          <span className="text-sm">Add<br/>Money</span>
        </button>
      </div>
    </>
  );
}