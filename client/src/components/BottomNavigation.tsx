import { Home, Store, History, Building, IndianRupee } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";

export default function BottomNavigation() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const navItems = [
    { 
      id: "home", 
      icon: <Home className="h-5 w-5 sm:h-6 sm:w-6" />, 
      label: "Home", 
      path: "/",
      active: location === "/" 
    },
    { 
      id: "stores", 
      icon: <Store className="h-5 w-5 sm:h-6 sm:w-6" />, 
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
      icon: <IndianRupee className="h-6 w-6 sm:h-7 sm:w-7 text-white" />, 
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
      icon: <History className="h-5 w-5 sm:h-6 sm:w-6" />, 
      label: "History", 
      path: "/transaction-history",
      active: location === "/transaction-history" 
    },
    { 
      id: "banking", 
      icon: <Building className="h-5 w-5 sm:h-6 sm:w-6" />, 
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 safe-area-bottom">
      <div className="max-w-md md:max-w-lg mx-auto grid grid-cols-5 py-2 px-2 sm:px-4">
        {navItems.map((item, index) => (
          index === 2 ? (
            <div 
              key={item.id} 
              className="flex justify-center"
              onClick={() => handleNavClick(item)}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 -mt-6 sm:-mt-7 rounded-full bg-[#0d4bb5] flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#0a3d96] transition-colors">
                {item.icon}
              </div>
            </div>
          ) : (
            <button 
              key={item.id} 
              className="flex flex-col items-center space-y-0.5 sm:space-y-1 min-h-[44px]"
              onClick={() => handleNavClick(item)}
            >
              <div className={item.active ? "text-[#0d4bb5]" : "text-gray-500"}>
                {item.icon}
              </div>
              <span className={`text-[10px] sm:text-xs ${item.active ? "text-[#0d4bb5] font-medium" : "text-gray-500"}`}>{item.label}</span>
            </button>
          )
        ))}
      </div>
    </nav>
  );
}
