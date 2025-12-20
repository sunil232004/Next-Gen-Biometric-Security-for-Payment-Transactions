import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Clock, Search, ArrowDown, ArrowUp, Zap, ReceiptText, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTransactionsByUser } from "@/store/transactionsSlice";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Transaction type definition

export default function TransactionHistory() {
  const [_, navigate] = useLocation();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const dispatch = useAppDispatch();
  const transactionsState = useAppSelector((state) => state.transactions);
  const transactions = transactionsState.items;
  const isLoading = transactionsState.status === 'loading';
  const fetchError = transactionsState.status === 'failed' ? transactionsState.error : null;

  const userId = user?._id;

  useEffect(() => {
    if (!userId) return;
    dispatch(fetchTransactionsByUser({ limit: 100 }));
  }, [dispatch, userId]);

  const handleBack = () => {
    navigate("/");
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "recharge":
        return <Zap className="h-5 w-5 text-purple-500" />;
      case "bill_payment":
        return <ReceiptText className="h-5 w-5 text-orange-500" />;
      case "transfer_in":
        return <ArrowDown className="h-5 w-5 text-green-500" />;
      case "transfer_out":
        return <ArrowUp className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "recharge":
        return "text-purple-600";
      case "bill_payment":
      case "transfer_out":
        return "text-red-600";
      case "transfer_in":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getTransactionPrefix = (type: string) => {
    switch (type) {
      case "recharge":
      case "bill_payment":
      case "transfer_out":
        return "-";
      case "transfer_in":
        return "+";
      default:
        return "";
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "recharge":
        return "Mobile Recharge";
      case "bill_payment":
        return "Bill Payment";
      case "transfer_in":
        return "Money Received";
      case "transfer_out":
        return "Money Sent";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ");
    }
  };

  const getFormattedTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return "Unknown time";
    }
  };

  // Filter transactions based on search term and filter type
  const sortedTransactions = [...transactions].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });

  const filteredTransactions = sortedTransactions.filter(transaction => {
        const matchesSearch = searchTerm 
          ? (transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             transaction.amount.toString().includes(searchTerm) ||
             transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
             transaction.accountId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             transaction.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()))
          : true;

        const matchesFilter = filterType === "all" 
          ? true 
          : transaction.type === filterType;

        return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto h-screen bg-white shadow-lg flex flex-col">
      <header className="bg-[#00baf2] text-white p-3 sm:p-4 flex items-center safe-area-top">
        <button onClick={handleBack} className="mr-3 sm:mr-4 tap-target">
          <ChevronLeft className="icon-responsive-md" />
        </button>
        <h1 className="text-lg sm:text-xl font-semibold">Transaction History</h1>
      </header>

      <div className="p-3 sm:p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search transactions"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm h-10 sm:h-11"
          />
        </div>

        <div className="flex mt-2.5 sm:mt-3 space-x-2 items-center">
          <div className="flex items-center space-x-1">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-xs sm:text-sm">Filter:</span>
          </div>
          <Select
            value={filterType}
            onValueChange={setFilterType}
          >
            <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm border-gray-200 bg-gray-50 flex-1 max-w-[180px] sm:max-w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="transfer_in">Money Received</SelectItem>
              <SelectItem value="transfer_out">Money Sent</SelectItem>
              <SelectItem value="recharge">Recharges</SelectItem>
              <SelectItem value="bill_payment">Bill Payments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-3 sm:p-4 scroll-smooth-touch safe-area-bottom">
        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center space-x-3">
                <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16 sm:w-20" />
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="text-center py-8 sm:py-10">
            <p className="text-red-500 text-sm sm:text-base">Failed to load transactions</p>
            <Button onClick={() => dispatch(fetchTransactionsByUser({ limit: 100 }))} className="mt-4 btn-responsive">
              Try Again
            </Button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 sm:py-10">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-2.5 sm:mb-3" />
            <p className="text-gray-500 text-sm sm:text-base">No transactions found</p>
            {searchTerm && (
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Try changing your search or filter
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-4">
            {filteredTransactions.map((transaction) => (
              <div 
                key={transaction._id || transaction.id || transaction.transactionId}
                className="flex items-start space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors border border-gray-100"
                onClick={() => {
                  // In a real app, navigate to transaction details
                  // navigate(`/transaction/${transaction.id}`);
                }}
              >
                <div className="bg-gray-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                  {getTransactionIcon(transaction.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-medium text-sm sm:text-base truncate">
                      {getTransactionTypeLabel(transaction.type)}
                    </h3>
                    <span className={`font-semibold text-sm sm:text-base whitespace-nowrap ${getTransactionColor(transaction.type)}`}>
                      {getTransactionPrefix(transaction.type)}₹{transaction.amount}
                    </span>
                  </div>

                  {/* Account ID and Transaction ID row */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {transaction.accountId && (
                      <span className="text-[10px] sm:text-xs text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded">
                        {transaction.accountId}
                      </span>
                    )}
                    {transaction.transactionId && (
                      <span className="text-[10px] sm:text-xs text-gray-500 font-mono">
                        TXN: {transaction.transactionId.slice(-8).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between text-xs sm:text-sm mt-1">
                    <p className="text-gray-500 truncate max-w-[140px] sm:max-w-[200px]">
                      {transaction.recipientName || transaction.description || "No description"}
                    </p>
                    <span className="text-gray-400 text-[10px] sm:text-xs whitespace-nowrap">
                      {getFormattedTime(String(transaction.createdAt || transaction.timestamp || new Date()))}
                    </span>
                  </div>

                  {/* Payment method badge */}
                  {transaction.paymentMethod && (
                    <div className="mt-1">
                      <span className="text-[10px] sm:text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded capitalize">
                        {transaction.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}