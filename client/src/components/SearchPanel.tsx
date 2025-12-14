import { useState, useEffect, useRef } from 'react';
import { X, Search, TrendingUp, Clock, CreditCard, Smartphone, Building2, Bot, PieChart, Briefcase, Film, Wallet, Lightbulb, ShoppingBag, Shield } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface SearchPanelProps {
  onClose: () => void;
}

type SearchCategory = 'all' | 'services' | 'features' | 'tools';

interface SearchItem {
  id: string;
  title: string;
  category: SearchCategory;
  icon: React.ReactNode;
  path?: string;
  action?: () => void;
}

export default function SearchPanel({ onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchCategory>('all');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Define search items with all available services
  const searchItems: SearchItem[] = [
    // Services
    {
      id: 'mobile-recharge',
      title: 'Mobile Recharge',
      category: 'services',
      icon: <Smartphone className="h-5 w-5 text-blue-500" />,
      path: '/mobile-recharge'
    },
    {
      id: 'electricity-bill',
      title: 'Electricity Bill',
      category: 'services',
      icon: <Lightbulb className="h-5 w-5 text-yellow-500" />,
      path: '/electricity-bill'
    },
    {
      id: 'credit-card-payment',
      title: 'Credit Card Payment',
      category: 'services',
      icon: <CreditCard className="h-5 w-5 text-purple-500" />,
      action: () => {
        toast({
          title: "Credit Card Payment",
          description: "This feature is coming soon!"
        });
      }
    },
    {
      id: 'personal-loan',
      title: 'Personal Loan',
      category: 'services',
      icon: <Briefcase className="h-5 w-5 text-green-500" />,
      action: () => {
        toast({
          title: "Personal Loan",
          description: "This feature is coming soon!"
        });
      }
    },
    {
      id: 'credit-card-carnival',
      title: 'Credit Card Carnival',
      category: 'services',
      icon: <CreditCard className="h-5 w-5 text-purple-500" />,
      action: () => {
        toast({
          title: "Credit Card Carnival",
          description: "This feature is coming soon!"
        });
      }
    },
    {
      id: 'paytm-money',
      title: 'Paytm Money',
      category: 'services',
      icon: <Wallet className="h-5 w-5 text-blue-500" />,
      action: () => {
        toast({
          title: "Paytm Money",
          description: "This feature is coming soon!"
        });
      }
    },
    {
      id: 'sbi-mf-sip',
      title: 'SBI MF SIP',
      category: 'services',
      icon: <PieChart className="h-5 w-5 text-blue-500" />,
      action: () => {
        toast({
          title: "SBI MF SIP",
          description: "This feature is coming soon!"
        });
      }
    },
    {
      id: 'travel-booking',
      title: 'Flight, Bus & Train Booking',
      category: 'services',
      icon: <Smartphone className="h-5 w-5 text-blue-500" />,
      action: () => {
        toast({
          title: "Travel Booking",
          description: "This feature is coming soon!"
        });
      }
    },
    {
      id: 'gold',
      title: 'Buy Gold (24k)',
      category: 'services',
      icon: <ShoppingBag className="h-5 w-5 text-yellow-500" />,
      action: () => {
        toast({
          title: "Buy Gold",
          description: "This feature is coming soon!"
        });
      }
    },
    {
      id: 'movies-events',
      title: 'Movies & Events',
      category: 'services',
      icon: <Film className="h-5 w-5 text-red-500" />,
      action: () => {
        toast({
          title: "Movies & Events",
          description: "This feature is coming soon!"
        });
      }
    },
    
    // Features
    {
      id: 'scan-pay',
      title: 'Scan & Pay',
      category: 'features',
      icon: <Search className="h-5 w-5 text-blue-500" />,
      path: '/scan-qr'
    },
    {
      id: 'add-money',
      title: 'Add Money to Wallet',
      category: 'features',
      icon: <Wallet className="h-5 w-5 text-green-500" />,
      path: '/add-money'
    },
    {
      id: 'transaction-history',
      title: 'Transaction History',
      category: 'features',
      icon: <Clock className="h-5 w-5 text-gray-500" />,
      path: '/transaction-history'
    },
    {
      id: 'money-transfer',
      title: 'Money Transfer',
      category: 'features',
      icon: <Building2 className="h-5 w-5 text-blue-500" />,
      path: '/money-transfer'
    },
    {
      id: 'receive-money',
      title: 'Receive Money (QR)',
      category: 'features',
      icon: <Search className="h-5 w-5 text-blue-500" />,
      path: '/receive-qr'
    },
    
    // Tools
    {
      id: 'credit-score',
      title: 'Check Credit Score',
      category: 'tools',
      icon: <TrendingUp className="h-5 w-5 text-red-500" />,
      action: () => {
        toast({
          title: "Credit Score",
          description: "This feature is coming soon!"
        });
      }
    },
    {
      id: 'mutual-fund',
      title: 'Mutual Fund Report',
      category: 'tools',
      icon: <PieChart className="h-5 w-5 text-green-500" />,
      action: () => {
        toast({
          title: "Mutual Fund Report",
          description: "This feature is coming soon!"
        });
      }
    },
    {
      id: 'ask-ai',
      title: 'Ask AI',
      category: 'tools',
      icon: <Bot className="h-5 w-5 text-blue-500" />,
      action: () => {
        toast({
          title: "AI Assistant",
          description: "This feature is coming soon!"
        });
      }
    },
    {
      id: 'insurance-status',
      title: 'Insurance Status',
      category: 'tools',
      icon: <Shield className="h-5 w-5 text-green-500" />,
      action: () => {
        toast({
          title: "Insurance Status",
          description: "This feature is coming soon!"
        });
      }
    }
  ];

  // Filter search items based on search query and active tab
  const filteredItems = searchItems.filter(item => {
    const matchesQuery = query.trim() === '' || 
      item.title.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = activeTab === 'all' || item.category === activeTab;
    return matchesQuery && matchesCategory;
  });

  const handleResultClick = (item: SearchItem) => {
    if (item.path) {
      navigate(item.path);
      onClose();
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-[#0d4bb5] text-white">
          <div className="flex-1 flex items-center">
            <Search className="h-5 w-5 mr-2" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for services, features..."
              className="bg-transparent border-none outline-none w-full text-white placeholder-gray-300"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button onClick={onClose} className="ml-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 font-medium text-sm ${activeTab === 'all' ? 'text-[#0d4bb5] border-b-2 border-[#0d4bb5]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`flex-1 py-3 font-medium text-sm ${activeTab === 'services' ? 'text-[#0d4bb5] border-b-2 border-[#0d4bb5]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('services')}
          >
            Services
          </button>
          <button
            className={`flex-1 py-3 font-medium text-sm ${activeTab === 'features' ? 'text-[#0d4bb5] border-b-2 border-[#0d4bb5]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('features')}
          >
            Features
          </button>
          <button
            className={`flex-1 py-3 font-medium text-sm ${activeTab === 'tools' ? 'text-[#0d4bb5] border-b-2 border-[#0d4bb5]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('tools')}
          >
            Tools
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {query.trim() !== '' && filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-4 text-center">
              <Search className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500">No results found for "{query}"</p>
            </div>
          ) : (
            <div>
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 border-b flex items-center cursor-pointer hover:bg-gray-50"
                  onClick={() => handleResultClick(item)}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{item.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}