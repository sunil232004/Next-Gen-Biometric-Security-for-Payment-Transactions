import { useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useSafeNavigation } from "@/hooks/use-safe-navigation";

// Service category interfaces
interface ServiceItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
  path?: string;
}

export default function AllServices() {
  const [, navigate] = useSafeNavigation();
  const [pageIndex, setPageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const handleBackClick = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    } else {
      navigate("/");
    }
  };

  // Popular services
  const popularServices = [
    {
      id: "mobile-recharge",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-green-600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 2H7C5.89543 2 5 2.89543 5 4V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V4C19 2.89543 18.1046 2 17 2Z" stroke="currentColor" strokeWidth="2" />
            <path d="M12 18H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ),
      title: "Mobile Recharge",
      path: "/mobile-recharge"
    },
    {
      id: "dth-recharge",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 8C2 6.34315 3.34315 5 5 5H19C20.6569 5 22 6.34315 22 8V16C22 17.6569 20.6569 19 19 19H5C3.34315 19 2 17.6569 2 16V8Z" stroke="currentColor" strokeWidth="2" />
            <path d="M12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z" stroke="currentColor" strokeWidth="2" />
            <path d="M12 12V16" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      ),
      title: "DTH Recharge",
      path: "/dth-recharge"
    },
    {
      id: "fastag-recharge",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-green-600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 3H18C19.1046 3 20 3.89543 20 5V7M16 3H8C6.89543 3 6 3.89543 6 5V19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19V5C18 3.89543 17.1046 3 16 3Z" stroke="currentColor" strokeWidth="2" />
            <path d="M9 7H15" stroke="currentColor" strokeWidth="2" />
            <path d="M9 11H15" stroke="currentColor" strokeWidth="2" />
            <path d="M9 15H13" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      ),
      title: "FASTag Recharge",
      path: "/fastag-recharge"
    },
    {
      id: "mobile-postpaid",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-orange-500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M10 8H14" stroke="currentColor" strokeWidth="2" />
            <path d="M12 16V16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ),
      title: "Mobile Postpaid",
      path: "/mobile-postpaid"
    },
    {
      id: "electricity-bill",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-yellow-400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.5 14.5L14.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2" />
            <path d="M5 12C5 8.13401 8.13401 5 12 5C15.866 5 19 8.13401 19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12Z" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      ),
      title: "Electricity Bill",
      path: "/electricity-bill"
    },
    {
      id: "credit-card-bill",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-red-500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
            <path d="M7 15H9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 15H14" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      ),
      title: "Credit Card Bill",
      path: "/credit-card"
    },
    {
      id: "loan-emi",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-green-500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M14.5 9.5L11 13L9.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ),
      title: "Loan EMI Payment",
      path: "/loan-emi"
    },
    {
      id: "insurance-lic",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ),
      title: "Insurance / LIC",
      path: "/insurance"
    }
  ];

  // Home bills
  const homeBills = [
    {
      id: "book-gas-cylinder",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-orange-500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 2C9 1.44772 9.44772 1 10 1H14C14.5523 1 15 1.44772 15 2V4H9V2Z" stroke="currentColor" strokeWidth="2" />
            <path d="M8 4H16V7C16 8.10457 15.1046 9 14 9H10C8.89543 9 8 8.10457 8 7V4Z" stroke="currentColor" strokeWidth="2" />
            <path d="M8 7V16C8 18.2091 9.79086 20 12 20V20C14.2091 20 16 18.2091 16 16V7" stroke="currentColor" strokeWidth="2" />
            <path d="M16 15H17C18.6569 15 20 13.6569 20 12V12C20 10.3431 18.6569 9 17 9H16" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      ),
      title: "Book Gas Cylinder",
      path: "/book-gas"
    },
    {
      id: "piped-gas-bill",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-green-600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 5L5 14L10 19L19 10L14 5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M7.5 11.5L12.5 16.5" stroke="currentColor" strokeWidth="2" />
            <path d="M10.5 8.5L15.5 13.5" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      ),
      title: "Piped Gas Bill",
      path: "/piped-gas"
    },
    {
      id: "broadband-landline",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-orange-400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9H21" stroke="currentColor" strokeWidth="2" />
            <path d="M7 14.5H17" stroke="currentColor" strokeWidth="2" />
            <path d="M2 5H22V19H2V5Z" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      ),
      title: "Broadband / Landline",
      path: "/broadband"
    },
    {
      id: "water-bill",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C16.4183 22 20 18.4183 20 14C20 9 12 2 12 2C12 2 4 9 4 14C4 18.4183 7.58172 22 12 22Z" stroke="currentColor" strokeWidth="2" />
            <path d="M16 14C16 16.2091 14.2091 18 12 18C9.79086 18 8 16.2091 8 14C8 11.7909 12 8 12 8C12 8 16 11.7909 16 14Z" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      ),
      title: "Water Bill",
      path: "/water-bill"
    }
  ];

  // Transit services
  const transitServices = [
    {
      id: "metro-recharge",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 9H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 18L14 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 18L10 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 5H21V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 14V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 14H17V18H7V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ),
      title: "Metro Recharge",
      path: "/metro-recharge"
    },
    {
      id: "traffic-challans",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5H5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 5H19V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 19H5V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 19H19V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ),
      title: "Traffic Challans",
      path: "/traffic-challans"
    },
    {
      id: "ncmc-recharge",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M2 10H22" stroke="currentColor" strokeWidth="2" />
            <path d="M8 15H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 15H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ),
      title: "NCMC Recharge",
      path: "/ncmc-recharge"
    }
  ];

  // New services
  const newServices = [
    {
      id: "hospital",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-green-600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 3H16V21H8V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M16 7H19V17H16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M8 7H5V17H8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 11V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M11 12H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ),
      title: "Hospital & Pathology",
      path: "/hospital"
    },
    {
      id: "clubs",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-yellow-700" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12.5H5V16.5H19V12.5H21" stroke="currentColor" strokeWidth="2" />
            <path d="M19 6.5H5V12.5H19V6.5Z" stroke="currentColor" strokeWidth="2" />
            <path d="M12 16.5V19.5" stroke="currentColor" strokeWidth="2" />
            <path d="M8 19.5H16" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      ),
      title: "Clubs and Associations",
      path: "/clubs"
    },
    {
      id: "recurring-deposits",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-orange-500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 6V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ),
      title: "Recurring Deposits",
      path: "/recurring-deposits"
    },
    {
      id: "education-fees",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-800" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3L21 8L12 13L3 8L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M19 10V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 10V15.5C5 15.5 5 19 12 19C19 19 19 15.5 19 15.5V10" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      ),
      title: "Education Fees",
      path: "/education-fees"
    },
    {
      id: "personal-loan",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M15 11H9V13H15V11Z" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      ),
      title: "Personal Loan",
      path: "/personal-loan"
    }
  ];

  // Other services
  const otherServices = [
    {
      id: "donations",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 7H18M6 17H18M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 7V7.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 17V17.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ),
      title: "Donations",
      path: "/donations"
    },
    {
      id: "devotion",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-yellow-600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 9L12 15L20 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 20L4 14V9L12 3L20 9V14L12 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ),
      title: "Devotion",
      path: "/devotion"
    },
    {
      id: "cashback-points",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
            <path d="M9 11.5V10.8C9 9.11984 9 8.27976 9.58579 7.69396C10.1716 7.10817 11.0117 7.10817 12.6 7.10817H12.7C14.2883 7.10817 15.0825 7.10817 15.6412 7.66212C16.2 8.21607 16.2 9.00541 16.2 10.5841V10.7C16.2 12.2787 16.2 13.068 15.6412 13.622C15.0825 14.1759 14.2883 14.1759 12.7 14.1759H12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.5 17H9.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ),
      title: "Cashback Points",
      path: "/cashback-points"
    },
    {
      id: "google-play-recharge",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4L17.5 12L6 20V4Z" fill="#4285F4" stroke="#4285F4" strokeWidth="2" strokeLinejoin="round" />
            <path d="M6 4L13 12L6 20" stroke="#34A853" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>
      ),
      title: "Google Play Recharge",
      path: "/google-play"
    },
    {
      id: "gift-cards",
      icon: (
        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-red-500" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9H21V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V9Z" stroke="currentColor" strokeWidth="2" />
            <path d="M3 9V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V9" stroke="currentColor" strokeWidth="2" />
            <path d="M3 9L12 14L21 9" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      ),
      title: "Gift Cards",
      path: "/gift-cards"
    }
  ];

  // Handle service click
  const handleServiceClick = (service: ServiceItem) => {
    if (service.path) {
      navigate(service.path);
    } else if (service.onClick) {
      service.onClick();
    }
  };

  // Promotion banner
  const PromotionBanner = () => (
    <div className="bg-[#d1ecff] rounded-lg m-4 p-4 flex justify-between items-center">
      <div className="flex-1">
        <h3 className="text-[#0d4bb5] font-semibold">Loan EMI Payment</h3>
        <p className="text-sm text-[#333]">Get up to 50% Off + ₹400 Off on Myntra</p>
        <button className="bg-[#0d4bb5] text-white text-xs px-3 py-1 mt-1 rounded-full flex items-center">
          Pay Now
          <svg className="w-3 h-3 ml-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-xs mt-1 text-gray-600">Promocode: EMIMYNTRA400*</p>
      </div>
      <div className="ml-4 flex items-center space-x-2">
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-600">Net</span>
          <span className="text-xs text-gray-600">Banking</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-600">UPI</span>
          <span className="w-8 h-4 bg-blue-500 rounded"></span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-600">Debit</span>
          <span className="text-xs text-gray-600">Cards</span>
        </div>
      </div>
    </div>
  );

  // Additional options
  const AdditionalOptions = () => (
    <div className="px-4 space-y-4 mt-2">
      <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="h-6 w-6 text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16V16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 12V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Cashback and Offers</h3>
          <p className="text-sm text-gray-600">Explore all Recharge & Bill Payment offers and get rewarded</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="h-6 w-6 text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Manage Automatic Payments</h3>
          <p className="text-sm text-gray-600">Setup new or Edit existing Automatic Payments</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="h-6 w-6 text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
            <path d="M12 6L12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 12L18 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Spin the Wheel</h3>
          <p className="text-sm text-gray-600">Win 100% Cashback on WinZo</p>
        </div>
      </div>
    </div>
  );

  // Render different pages based on index
  const renderPage = () => {
    switch (pageIndex) {
      case 0:
        return (
          <>
            <div className="px-4 py-4">
              <h2 className="font-semibold text-[#333333] mb-2">Popular</h2>
              <div className="grid grid-cols-4 gap-4">
                {popularServices.map((service) => (
                  <div 
                    key={service.id} 
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => handleServiceClick(service)}
                  >
                    {service.icon}
                    <span className="text-xs text-center mt-1">{service.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-4">
              <h2 className="font-semibold text-[#333333] mb-2">Home Bills</h2>
              <div className="grid grid-cols-4 gap-4">
                {homeBills.map((service) => (
                  <div 
                    key={service.id} 
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => handleServiceClick(service)}
                  >
                    {service.icon}
                    <span className="text-xs text-center mt-1">{service.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-4">
              <h2 className="font-semibold text-[#333333] mb-2">Transit</h2>
              <div className="grid grid-cols-4 gap-4">
                {transitServices.map((service) => (
                  <div 
                    key={service.id} 
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => handleServiceClick(service)}
                  >
                    {service.icon}
                    <span className="text-xs text-center mt-1">{service.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              className="w-full py-3 text-center text-sm font-semibold text-[#0d4bb5] border-t border-gray-200"
              onClick={() => setPageIndex(1)}
            >
              Show More Categories
            </button>
          </>
        );
      case 1:
        return (
          <>
            <div className="px-4 py-4">
              <h2 className="font-semibold text-[#333333] mb-2">Transit</h2>
              <div className="grid grid-cols-4 gap-4">
                {transitServices.map((service) => (
                  <div 
                    key={service.id} 
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => handleServiceClick(service)}
                  >
                    {service.icon}
                    <span className="text-xs text-center mt-1">{service.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-4">
              <h2 className="font-semibold text-[#333333] mb-2">New Services</h2>
              <div className="grid grid-cols-4 gap-4">
                {newServices.map((service) => (
                  <div 
                    key={service.id} 
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => handleServiceClick(service)}
                  >
                    {service.icon}
                    <span className="text-xs text-center mt-1">{service.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-4">
              <h2 className="font-semibold text-[#333333] mb-2">Other Services</h2>
              <div className="grid grid-cols-4 gap-4">
                {otherServices.slice(0, 4).map((service) => (
                  <div 
                    key={service.id} 
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => handleServiceClick(service)}
                  >
                    {service.icon}
                    <span className="text-xs text-center mt-1">{service.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              className="w-full py-3 text-center text-sm font-semibold text-[#0d4bb5] border-t border-gray-200"
              onClick={() => setPageIndex(2)}
            >
              Show More Categories
            </button>
          </>
        );
      case 2:
        return (
          <>
            <div className="px-4 py-4">
              <h2 className="font-semibold text-[#333333] mb-2">Other Services</h2>
              <div className="grid grid-cols-4 gap-4">
                {otherServices.map((service) => (
                  <div 
                    key={service.id} 
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => handleServiceClick(service)}
                  >
                    {service.icon}
                    <span className="text-xs text-center mt-1">{service.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <PromotionBanner />
            <AdditionalOptions />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#f5f7ff] min-h-screen pb-16">
      <div className="bg-white p-4 flex items-center space-x-3 sticky top-0 z-10">
        <button onClick={handleBackClick} className="focus:outline-none">
          <ArrowLeft className="h-5 w-5 text-[#0d4bb5]" />
        </button>
        <h1 className="text-lg font-semibold">My Bills &amp; Recharges</h1>
        <div className="text-[#0d4bb5] text-sm ml-auto">Help</div>
      </div>

      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder={`Search for ${pageIndex === 0 ? 'Airtel' : pageIndex === 1 ? 'Bills' : 'Services'}`}
            className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        </div>
      </div>

      {renderPage()}
    </div>
  );
}