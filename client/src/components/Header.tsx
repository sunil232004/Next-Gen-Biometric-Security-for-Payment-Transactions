import { useState, useEffect } from "react";
import { Search, Bell, User, Settings } from "lucide-react";
import { useSafeNavigation } from "@/hooks/use-safe-navigation";
import { useQuery } from "@tanstack/react-query";
import NotificationPanel from "./NotificationPanel";
import SearchPanel from "./SearchPanel";

interface Transaction {
  id: number;
  userId: number;
  type: string;
  amount: number;
  status: string;
  timestamp: string;
  description: string;
  authMethod?: string;
  createdAt: string;
  metadata?: string | null;
}

export default function Header() {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [, navigate] = useSafeNavigation();
  const [notificationCount, setNotificationCount] = useState(0);

  // Mock user ID - in a real app would come from auth context
  const userId = 1;
  
  // Fetch transactions to count notifications
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${userId}`],
  });

  // Calculate notification count (transactions in the last 24 hours)
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const recentTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.timestamp);
        return transactionDate > oneDayAgo;
      });
      
      setNotificationCount(recentTransactions.length);
    }
  }, [transactions]);

  const handleSearch = () => {
    setShowSearch(true);
  };

  const handleNotifications = () => {
    setShowNotifications(true);
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  return (
    <>
      <header className="bg-[#001e84] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div 
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer"
            onClick={handleProfile}
          >
            <User className="text-gray-400 h-5 w-5" />
          </div>
          <div className="flex items-center bg-yellow-400 text-[#001e84] px-2 py-1 rounded-full text-xs font-semibold">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-3 w-3 mr-1" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M2 22h20" />
              <path d="M6.36 17.4 4 17l-2-4 1.1-2.2c.2-.5.3-1 .3-1.5 0-1.7 1.3-3 3-3h.5c.5 0 .9.1 1.4.3l3.8 1.5c.6.2 1 .8 1 1.4V12c0 1.1-.9 2-2 2h-2" />
              <path d="m4 12 3.5-3.5" />
              <path d="M2 4v4" />
              <path d="m5 7 4-1" />
              <path d="M22 13v9" />
              <path d="m16 16 2 2 4-4" />
            </svg>
            <span>Travel Sale LIVE</span>
            <span className="ml-1 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            className="focus:outline-none" 
            onClick={handleSearch}
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            className="focus:outline-none"
            onClick={handleSettings}
          >
            <Settings className="h-5 w-5" />
          </button>
          <div className="relative">
            <button 
              className="focus:outline-none" 
              onClick={handleNotifications}
            >
              <Bell className="h-5 w-5" />
            </button>
            {notificationCount > 0 && (
              <div className="absolute -top-1 -right-1 notification-badge bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                <span>{notificationCount > 9 ? '9+' : notificationCount}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Panel */}
      {showSearch && (
        <SearchPanel onClose={() => setShowSearch(false)} />
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
}
