import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, Camera, ChevronRight, Shield, HelpCircle, Settings, ShoppingBag, User, Users, FileText, HelpCircleIcon, Fingerprint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import BiometricManagement from '@/components/BiometricManagement';

interface SettingItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: () => void;
  hasArrow?: boolean;
}

interface UserData {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  profileImage: string | null;
}

export default function ProfileSettings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user: authUser, biometrics, refreshUser } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);

  // Use authenticated user ID, fallback to 1 for demo
  const userId = authUser?._id || 1;

  // Fetch user data from API
  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: [`/api/user/${userId}`],
  });

  // Profile image update mutation
  const updateProfileImageMutation = useMutation({
    mutationFn: (profileImage: string) => 
      apiRequest(`/api/user/${userId}/profile-image`, { 
        method: 'POST', 
        body: { profileImage } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}`] });
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating profile image:", error);
    }
  });

  // Set initial profile image from user data
  useEffect(() => {
    if (user?.profileImage) {
      setProfileImage(user.profileImage);
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const imageData = event.target.result as string;
          setProfileImage(imageData);
          // Update profile image in database
          updateProfileImageMutation.mutate(imageData);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const settingItems: SettingItem[] = [
    {
      id: "security",
      icon: <Shield className="w-6 h-6 text-blue-500" />,
      title: "Paytm Security Shield",
      description: "Protect your account",
      action: () => {
        toast({
          title: "Security Shield",
          description: "Activating security shield...",
        });
      },
      hasArrow: false,
    },
    {
      id: "biometric",
      icon: <Fingerprint className="w-6 h-6 text-blue-500" />,
      title: "Biometric Security",
      description: `Manage fingerprint, face & voice authentication (${biometrics?.length || 0} registered)`,
      action: () => setIsBiometricModalOpen(true),
      hasArrow: true,
    },
    {
      id: "help",
      icon: <HelpCircle className="w-6 h-6 text-blue-500" />,
      title: "Help & Support",
      description: "Customer Support, Your Queries, Frequently Asked Questions",
      hasArrow: true,
    },
    {
      id: "upi",
      icon: <Settings className="w-6 h-6 text-blue-500" />,
      title: "UPI & Payment Settings",
      description: "Change UPI PIN, Linked Bank Accounts, Automatic Payments & Subscriptions, Other Accounts",
      hasArrow: true,
    },
    {
      id: "orders",
      icon: <ShoppingBag className="w-6 h-6 text-blue-500" />,
      title: "Orders & Bookings",
      description: "Recharge, Bill Payments, Shopping, Movies, Travel & Others",
      hasArrow: true,
    },
    {
      id: "profile",
      icon: <User className="w-6 h-6 text-blue-500" />,
      title: "Profile Settings",
      description: "Profile, Addresses, Security & Privacy, Notifications, Language",
      hasArrow: true,
    },
    {
      id: "refer",
      icon: <Users className="w-6 h-6 text-blue-500" />,
      title: "Refer & Win",
      description: "Win up to ₹10000 Cashback on inviting friends to Paytm",
      hasArrow: true,
    },
    {
      id: "digilocker",
      icon: <FileText className="w-6 h-6 text-blue-500" />,
      title: "DigiLocker",
      description: "Access 1000+ documents like PAN, Aadhaar, DL instantly on DigiLocker",
      hasArrow: true,
    },
    {
      id: "guide",
      icon: <HelpCircleIcon className="w-6 h-6 text-blue-500" />,
      title: "Your Paytm Guide",
      description: "Uncover unexplored features and transform your Paytm experience",
      hasArrow: true,
    }
  ];

  const handleActivateSecurityShield = () => {
    toast({
      title: "Security Shield Activated",
      description: "Your account is now protected with Paytm Security Shield",
    });
  };

  const handleSettingItemClick = (item: SettingItem) => {
    if (item.action) {
      item.action();
    } else {
      toast({
        title: "Coming Soon",
        description: `${item.title} feature will be available soon`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Biometric Management Modal */}
      <BiometricManagement 
        isOpen={isBiometricModalOpen} 
        onClose={() => setIsBiometricModalOpen(false)} 
      />
      {/* Header */}
      <div className="bg-[#0d4bb5] text-white p-4 flex items-center justify-between">
        <button 
          className="flex items-center" 
          onClick={() => navigate("/")}
        >
          <ChevronLeft size={24} />
          <span className="ml-2">Back</span>
        </button>
        <h1 className="text-lg font-semibold">Profile</h1>
        <div className="w-8"></div>
      </div>

      {/* Profile Info */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex items-center">
          <div 
            className="relative cursor-pointer"
            onClick={handleProfileClick}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            {profileImage ? (
              <img 
                src={profileImage} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-400 flex items-center justify-center text-white text-xl font-semibold">
                {getInitial(user?.name || '')}
              </div>
            )}
            <div className="absolute bottom-0 right-0 bg-gray-200 rounded-full p-1">
              <Camera size={16} className="text-gray-600" />
            </div>
          </div>
          <div className="ml-4">
            <h2 className="text-lg font-semibold">{user?.name || 'Loading...'}</h2>
            <div className="flex items-center text-gray-600 text-sm">
              <div className="flex items-center">
                <span role="img" aria-label="lightning" className="mr-1">⚡</span>
                <span>{user?.phone}@ptyes</span>
              </div>
              <div className="ml-1 bg-gray-200 p-1 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="bg-white mt-2 p-4 flex flex-col items-center shadow-sm">
        <div className="border border-gray-200 rounded-lg w-full max-w-xs p-4 text-center">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${user?.phone || '7795129038'}@ptyes`} 
            alt="QR Code"
            className="w-48 h-48 mx-auto"
          />
          <div className="mt-2 text-sm text-gray-600 flex items-center justify-center">
            <img src="https://www.kvgbank.com/images/favicon.ico" alt="Bank" className="w-4 h-4 mr-1" />
            <span>Karnataka Vikas Grameena Bank</span>
          </div>
        </div>

        <div className="flex mt-4 gap-3 w-full max-w-xs">
          <button className="flex-1 border border-gray-300 rounded-full py-2 flex items-center justify-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
            Share QR
          </button>
          <button className="flex-1 border border-gray-300 rounded-full py-2 flex items-center justify-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Add to Home
          </button>
        </div>

        <button className="mt-3 border border-gray-300 rounded-full py-2 px-4 flex items-center justify-center text-sm w-full max-w-xs">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          Add QR to Home Screen
        </button>

        <div className="flex mt-3 gap-3 w-full max-w-xs">
          <button className="flex-1 border border-gray-300 rounded-full py-2 flex items-center justify-center text-sm">
            <span role="img" aria-label="lightning" className="mr-1">⚡</span>
            Link UPI Number
          </button>
          <button className="flex-1 border border-gray-300 rounded-full py-2 flex items-center justify-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            Link RuPay Card
          </button>
        </div>
      </div>

      {/* Settings Items */}
      <div className="mt-2 bg-white shadow-sm">
        {settingItems.map((item) => (
          <div 
            key={item.id}
            className="p-4 border-b border-gray-100 flex items-start cursor-pointer"
            onClick={() => handleSettingItemClick(item)}
          >
            <div className="mr-3 mt-1">{item.icon}</div>
            <div className="flex-1">
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </div>
            {item.id === "security" ? (
              <button 
                className="px-4 py-1 rounded-full text-sm border border-blue-500 text-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleActivateSecurityShield();
                }}
              >
                Activate
              </button>
            ) : (
              item.hasArrow && <ChevronRight size={18} className="text-gray-400 mt-2" />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-2 p-4 bg-white shadow-sm text-center text-xs text-gray-500">
        <div className="flex justify-center gap-1 mb-1">
          <span>Terms & Conditions,</span>
          <span>Privacy policy,</span>
        </div>
        <div className="flex justify-center gap-1 mb-1">
          <span>Grievance,</span>
          <span>Redressal Mechanism,</span>
          <span className="text-blue-500">See all policies</span>
        </div>
        <div className="mt-2">
          <span>v10.53.1</span>
          <span className="mx-2">|</span>
          <span>Made in India</span>
        </div>
      </div>
    </div>
  );
}