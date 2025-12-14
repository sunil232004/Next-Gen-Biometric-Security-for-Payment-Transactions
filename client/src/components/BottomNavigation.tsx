import { Home, Store, History, Building, IndianRupee } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";

export default function BottomNavigation() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const navItems = [
    { 
      id: "home", 
      icon: <Home className="h-5 w-5" />, 
      label: "Home", 
      path: "/",
      active: location === "/" 
    },
    { 
      id: "stores", 
      icon: <Store className="h-5 w-5" />, 
      label: "Stores", 
      onClick: () => {
        toast({
          title: "Nearby Stores",
          description: "Loading nearby stores that accept Paytm...",
        });
      },
      active: false 
    },
    { 
      id: "scan", 
      icon: <IndianRupee className="h-6 w-6 text-white" />, 
      label: "", 
      onClick: () => {
        toast({
          title: "Scan & Pay",
          description: "Opening camera to scan QR code...",
        });
      },
      active: false
    },
    { 
      id: "history", 
      icon: <History className="h-5 w-5" />, 
      label: "History", 
      path: "/transaction-history",
      active: location === "/transaction-history" 
    },
    { 
      id: "banking", 
      icon: <Building className="h-5 w-5" />, 
      label: "Banking", 
      onClick: () => {
        toast({
          title: "Paytm Banking",
          description: "Loading banking services...",
        });
      },
      active: false 
    }
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <nav className="bg-white border-t border-[#e1e1e1] py-2 px-4 grid grid-cols-5 fixed bottom-0 w-full max-w-md mx-auto shadow-lg safe-bottom">
      {navItems.map((item, index) => (
        index === 2 ? (
          <div 
            key={item.id} 
            className="flex justify-center"
            onClick={() => handleNavClick(item)}
          >
            <div className="w-12 h-12 -mt-6 rounded-full bg-[#0d4bb5] flex items-center justify-center cursor-pointer">
              {item.icon}
            </div>
          </div>
        ) : (
          <button 
            key={item.id} 
            className="flex flex-col items-center space-y-1"
            onClick={() => handleNavClick(item)}
          >
            <div className={item.active ? "text-[#0d4bb5]" : "text-gray-500"}>
              {item.icon}
            </div>
            <span className={`text-[10px] ${item.active ? "text-[#0d4bb5]" : "text-gray-500"}`}>{item.label}</span>
          </button>
        )
      ))}
    </nav>
  );
}
