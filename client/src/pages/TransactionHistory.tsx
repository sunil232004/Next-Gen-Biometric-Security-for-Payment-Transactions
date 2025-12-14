import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Clock, Search, ArrowDown, ArrowUp, Zap, ReceiptText, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

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
import { Transaction } from "@shared/schema";

export default function TransactionHistory() {
  const [_, navigate] = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Fetch transactions
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ["/api/transactions/1"], // Assuming userId is 1 for demo
    queryFn: async () => {
      const response = await fetch("/api/transactions/1");
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      return response.json() as Promise<Transaction[]>;
    }
  });

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
  const filteredTransactions = transactions 
    ? transactions.filter(transaction => {
        const matchesSearch = searchTerm 
          ? (transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             transaction.amount.toString().includes(searchTerm) ||
             transaction.type.toLowerCase().includes(searchTerm.toLowerCase()))
          : true;

        const matchesFilter = filterType === "all" 
          ? true 
          : transaction.type === filterType;

        return matchesSearch && matchesFilter;
      })
    : [];

  return (
    <div className="max-w-md mx-auto h-screen bg-white shadow-lg flex flex-col">
      <header className="bg-[#00baf2] text-white p-4 flex items-center">
        <button onClick={handleBack} className="mr-4">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold">Transaction History</h1>
      </header>

      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search transactions"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm"
          />
        </div>

        <div className="flex mt-3 space-x-2">
          <div className="flex items-center space-x-1">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Filter:</span>
          </div>
          <Select
            value={filterType}
            onValueChange={setFilterType}
          >
            <SelectTrigger className="h-8 text-xs border-gray-200 bg-gray-50">
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

      <main className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500">Failed to load transactions</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transactions found</p>
            {searchTerm && (
              <p className="text-sm text-gray-400 mt-1">
                Try changing your search or filter
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  // In a real app, navigate to transaction details
                  // navigate(`/transaction/${transaction.id}`);
                }}
              >
                <div className="bg-gray-100 p-2 rounded-full">
                  {getTransactionIcon(transaction.type)}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-medium">
                      {getTransactionTypeLabel(transaction.type)}
                    </h3>
                    <span className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {getTransactionPrefix(transaction.type)}₹{transaction.amount}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <p className="text-gray-500 truncate max-w-[200px]">
                      {transaction.description || "No description"}
                    </p>
                    <span className="text-gray-400 text-xs">
                      {getFormattedTime(transaction.createdAt || transaction.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}