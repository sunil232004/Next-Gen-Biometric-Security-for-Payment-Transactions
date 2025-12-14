import { useState, useEffect } from 'react';
import { X, Bell, RefreshCw, Check, ArrowDown, ArrowUp, CreditCard, Smartphone, Lightbulb } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { format, isToday, isYesterday } from 'date-fns';

interface NotificationPanelProps {
  onClose: () => void;
}

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

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'personal'>('all');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Mock user ID - in a real app would come from auth context
  const userId = 1;
  
  const { data: transactions, isLoading, refetch } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${userId}`],
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'recharge':
        return <Smartphone className="h-5 w-5 text-blue-500" />;
      case 'bill_payment':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'payment':
        return <ArrowUp className="h-5 w-5 text-red-500" />;
      case 'transfer_in':
        return <ArrowDown className="h-5 w-5 text-green-500" />;
      default:
        return <CreditCard className="h-5 w-5 text-purple-500" />;
    }
  };

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const getNotificationTitle = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'recharge':
        // Check metadata to distinguish between recharge types
        try {
          const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : null;
          if (metadata && metadata.paymentMethod === 'card') {
            return 'Money Added';
          }
          return 'Mobile Recharge';
        } catch (e) {
          return 'Mobile Recharge';
        }
      case 'bill_payment':
        return 'Bill Payment';
      case 'payment':
        return 'Payment Sent';
      case 'transfer_in':
        return 'Money Received';
      default:
        return 'Transaction';
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Notifications refreshed",
    });
  };

  const handleViewAllTransactions = () => {
    navigate('/transaction-history');
    onClose();
  };

  const handleNotificationClick = (transaction: Transaction) => {
    // In a real app, this would navigate to transaction details
    toast({
      title: getNotificationTitle(transaction),
      description: transaction.description,
    });
  };

  // Group transactions by date
  const groupedNotifications = transactions?.reduce<Record<string, Transaction[]>>((acc, transaction) => {
    const date = new Date(transaction.timestamp);
    let key = '';
    
    if (isToday(date)) {
      key = 'Today';
    } else if (isYesterday(date)) {
      key = 'Yesterday';
    } else {
      key = format(date, 'MMMM d, yyyy');
    }
    
    if (!acc[key]) {
      acc[key] = [];
    }
    
    acc[key].push(transaction);
    return acc;
  }, {}) || {};

  // Filter notifications based on active tab
  const filteredNotifications = { ...groupedNotifications };
  if (activeTab === 'personal') {
    // For personal tab, only show money transfers (payment & transfer_in)
    Object.keys(filteredNotifications).forEach(key => {
      filteredNotifications[key] = filteredNotifications[key].filter(
        t => t.type === 'payment' || t.type === 'transfer_in'
      );
      // Remove empty groups
      if (filteredNotifications[key].length === 0) {
        delete filteredNotifications[key];
      }
    });
  }

  // Sort groups by date (newest first)
  const sortedDateKeys = Object.keys(filteredNotifications).sort((a, b) => {
    const dateOrder = { 'Today': 0, 'Yesterday': 1 };
    if (a in dateOrder && b in dateOrder) {
      return dateOrder[a as keyof typeof dateOrder] - dateOrder[b as keyof typeof dateOrder];
    } else if (a in dateOrder) {
      return -1;
    } else if (b in dateOrder) {
      return 1;
    } else {
      // Parse and compare dates for older transactions
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB.getTime() - dateA.getTime();
    }
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-[#0d4bb5] text-white">
          <h2 className="text-lg font-semibold flex items-center">
            <Bell className="h-5 w-5 mr-2" /> 
            Notifications
          </h2>
          <button onClick={onClose}>
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
            className={`flex-1 py-3 font-medium text-sm ${activeTab === 'personal' ? 'text-[#0d4bb5] border-b-2 border-[#0d4bb5]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal
          </button>
        </div>
        
        <div className="p-3 border-b flex justify-between items-center bg-gray-50">
          <button 
            className="text-[#0d4bb5] text-sm flex items-center"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </button>
          <button 
            className="text-[#0d4bb5] text-sm"
            onClick={handleViewAllTransactions}
          >
            View All Transactions
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-[#0d4bb5] border-t-transparent rounded-full"></div>
            </div>
          ) : transactions?.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-4 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div>
              {sortedDateKeys.map((dateKey) => (
                <div key={dateKey}>
                  <div className="bg-gray-100 px-4 py-2 font-medium text-sm text-gray-600">
                    {dateKey}
                  </div>
                  {filteredNotifications[dateKey]?.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="p-4 border-b cursor-pointer hover:bg-gray-50"
                      onClick={() => handleNotificationClick(transaction)}
                    >
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          {getNotificationIcon(transaction.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-medium">{getNotificationTitle(transaction)}</h3>
                            <span className="text-xs text-gray-500">
                              {format(new Date(transaction.timestamp), 'h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                          <div className="flex items-center mt-1">
                            <span className={`text-sm font-medium ${transaction.type === 'payment' ? 'text-red-500' : 'text-green-500'}`}>
                              {transaction.type === 'payment' ? '-' : '+'} ₹{transaction.amount}
                            </span>
                            {transaction.status === 'success' && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center">
                                <Check className="h-3 w-3 mr-1" /> Success
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}