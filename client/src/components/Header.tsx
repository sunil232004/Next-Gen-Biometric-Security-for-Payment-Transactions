import { useState, useEffect } from "react";
import { Search, Bell, User, Settings, LogOut } from "lucide-react";
import { useSafeNavigation } from "@/hooks/use-safe-navigation";
import { useAuth } from "@/contexts/AuthContext";
import NotificationPanel from "./NotificationPanel";
import SearchPanel from "./SearchPanel";

export default function Header() {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [, navigate] = useSafeNavigation();
  const [notificationCount, setNotificationCount] = useState(0);
  const { user, logout } = useAuth();

  // Calculate notification count - simplified for now
  useEffect(() => {
    // Could fetch recent transactions here using the auth context
    setNotificationCount(0);
  }, [user]);

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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="bg-[#001e84] text-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-10 safe-area-top">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div 
            className="avatar-responsive-sm rounded-full bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden tap-target"
            onClick={handleProfile}
          >
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="text-gray-400 icon-responsive-md" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs text-gray-300">Hello,</span>
            <span className="text-xs sm:text-sm font-semibold truncate max-w-[100px] sm:max-w-[150px]">{user?.name || 'User'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button 
            className="focus:outline-none tap-target" 
            onClick={handleSearch}
          >
            <Search className="icon-responsive-md" />
          </button>
          <button
            className="focus:outline-none tap-target"
            onClick={handleSettings}
          >
            <Settings className="icon-responsive-md" />
          </button>
          <div className="relative">
            <button 
              className="focus:outline-none tap-target" 
              onClick={handleNotifications}
            >
              <Bell className="icon-responsive-md" />
            </button>
            {notificationCount > 0 && (
              <div className="absolute -top-1 -right-1 notification-badge bg-red-500 text-white text-[10px] w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full">
                <span>{notificationCount > 9 ? '9+' : notificationCount}</span>
              </div>
            )}
          </div>
          <button
            className="focus:outline-none tap-target"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="icon-responsive-md" />
          </button>
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
