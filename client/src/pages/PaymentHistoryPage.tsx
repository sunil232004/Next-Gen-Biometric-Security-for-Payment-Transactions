import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { 
  ChevronLeft, 
  Clock, 
  Search, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Zap, 
  ReceiptText, 
  Filter,
  Calendar,
  CreditCard,
  Smartphone,
  Building2,
  Fingerprint,
  Wallet,
  ChevronDown,
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  X,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { 
  PaymentHistory, 
  PaymentHistoryListResponse,
  PaymentHistoryFilters,
  PaymentType,
  PaymentStatus,
  PaymentMethod,
  PaymentDirection,
  getPaymentTypeLabel,
  getPaymentStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusColor,
  formatAmountWithDirection
} from "@/types/paymentHistory";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

export default function PaymentHistoryPage() {
  const [_, navigate] = useLocation();
  const { user, token } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(null);
  const [filters, setFilters] = useState<PaymentHistoryFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch payment history
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['payment-history', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
      
      const response = await fetch(getApiUrl(`/api/v2/payment-history?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch payment history");
      }
      return response.json() as Promise<PaymentHistoryListResponse>;
    },
    enabled: !!user && !!token
  });

  const handleBack = () => navigate("/");

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // In a real implementation, this would use the search endpoint
  };

  const handleFilterChange = (key: keyof PaymentHistoryFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1 // Reset to first page on filter change
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getPaymentIcon = (payment: PaymentHistory) => {
    // First check payment method for specific icons
    switch (payment.paymentMethod) {
      case 'upi':
        return <Smartphone className="h-5 w-5 text-blue-500" />;
      case 'card':
        return <CreditCard className="h-5 w-5 text-purple-500" />;
      case 'bank_transfer':
      case 'netbanking':
        return <Building2 className="h-5 w-5 text-green-500" />;
      case 'biometric':
        return <Fingerprint className="h-5 w-5 text-cyan-500" />;
      case 'wallet':
        return <Wallet className="h-5 w-5 text-orange-500" />;
    }
    
    // Fallback to type-based icons
    switch (payment.type) {
      case 'recharge':
        return <Zap className="h-5 w-5 text-yellow-500" />;
      case 'bill_payment':
        return <ReceiptText className="h-5 w-5 text-orange-500" />;
      case 'add_money':
        return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
      case 'transfer':
      case 'payment':
        return payment.direction === 'credit' 
          ? <ArrowDownCircle className="h-5 w-5 text-green-500" />
          : <ArrowUpCircle className="h-5 w-5 text-red-500" />;
      case 'refund':
      case 'cashback':
        return <RefreshCcw className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'processing':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'hh:mm a');
    } catch {
      return '';
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  // Filter payments by search term (client-side filtering for demo)
  const filteredPayments = data?.data?.filter(payment => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      payment.description?.toLowerCase().includes(term) ||
      payment.transactionId?.toLowerCase().includes(term) ||
      payment.receiverDetails?.name?.toLowerCase().includes(term) ||
      payment.receiverDetails?.upiId?.toLowerCase().includes(term) ||
      payment.amount.toString().includes(term)
    );
  }) || [];

  const hasActiveFilters = filters.type || filters.status || filters.paymentMethod || filters.direction;

  return (
    <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto h-screen bg-gray-50 shadow-lg flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#00baf2] to-[#0095d9] text-white p-4 flex items-center safe-area-top shadow-md">
        <button onClick={handleBack} className="mr-4 tap-target hover:bg-white/20 rounded-full p-1 transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Payment History</h1>
          <p className="text-xs text-white/80">Track all your transactions</p>
        </div>
        <button 
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <RefreshCcw className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 border-b shadow-sm">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, UPI ID, or amount..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-4 h-11 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        <div className="flex items-center justify-between">
          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <Select
              value={filters.direction || 'all'}
              onValueChange={(v) => handleFilterChange('direction', v)}
            >
              <SelectTrigger className="h-9 w-[110px] text-sm">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="credit">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" /> Credit
                  </span>
                </SelectItem>
                <SelectItem value="debit">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-red-500" /> Debit
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => handleFilterChange('status', v)}
            >
              <SelectTrigger className="h-9 w-[120px] text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filter Button */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 relative">
                <Filter className="h-4 w-4 mr-1" />
                Filter
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Payments</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div>
                  <label className="text-sm font-medium mb-2 block">Payment Type</label>
                  <Select
                    value={filters.type || 'all'}
                    onValueChange={(v) => handleFilterChange('type', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="recharge">Recharge</SelectItem>
                      <SelectItem value="bill_payment">Bill Payment</SelectItem>
                      <SelectItem value="add_money">Add Money</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Payment Method</label>
                  <Select
                    value={filters.paymentMethod || 'all'}
                    onValueChange={(v) => handleFilterChange('paymentMethod', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="biometric">Biometric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select
                    value={filters.sortBy || 'createdAt'}
                    onValueChange={(v) => handleFilterChange('sortBy', v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sort Order</label>
                  <Select
                    value={filters.sortOrder || 'desc'}
                    onValueChange={(v) => handleFilterChange('sortOrder', v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Newest First" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                  <Button 
                    className="flex-1 bg-[#00baf2] hover:bg-[#0095d9]"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.type && (
              <Badge variant="secondary" className="text-xs">
                {getPaymentTypeLabel(filters.type as PaymentType)}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('type', undefined)}
                />
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="text-xs">
                {getPaymentStatusLabel(filters.status as PaymentStatus)}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('status', undefined)}
                />
              </Badge>
            )}
            {filters.paymentMethod && (
              <Badge variant="secondary" className="text-xs">
                {getPaymentMethodLabel(filters.paymentMethod as PaymentMethod)}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('paymentMethod', undefined)}
                />
              </Badge>
            )}
            {filters.direction && (
              <Badge variant="secondary" className="text-xs">
                {filters.direction === 'credit' ? 'Money In' : 'Money Out'}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => handleFilterChange('direction', undefined)}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Payment List */}
      <main className="flex-1 overflow-y-auto scroll-smooth-touch safe-area-bottom">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <XCircle className="h-12 w-12 text-red-400 mb-4" />
            <p className="text-red-500 text-center mb-4">Failed to load payment history</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Clock className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">No payments found</p>
            {(searchTerm || hasActiveFilters) && (
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredPayments.map((payment) => (
              <div
                key={payment._id}
                onClick={() => setSelectedPayment(payment)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="bg-gray-100 p-2.5 rounded-full flex-shrink-0">
                    {getPaymentIcon(payment)}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {payment.receiverDetails?.name || payment.receiverDetails?.merchantName || payment.description}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {getPaymentTypeLabel(payment.type)} • {getPaymentMethodLabel(payment.paymentMethod)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-semibold ${payment.direction === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {formatAmountWithDirection(payment.amount, payment.direction, payment.currency)}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          {getStatusIcon(payment.status)}
                          <span className={`text-xs ${getPaymentStatusColor(payment.status)}`}>
                            {getPaymentStatusLabel(payment.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(payment.createdAt)}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {payment.transactionId}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() => handlePageChange(filters.page! - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {filters.page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === data.pagination.totalPages}
                  onClick={() => handlePageChange(filters.page! + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Payment Detail Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              {/* Amount Section */}
              <div className="text-center py-4 border-b">
                <p className={`text-3xl font-bold ${selectedPayment.direction === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmountWithDirection(selectedPayment.amount, selectedPayment.direction, selectedPayment.currency)}
                </p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {getStatusIcon(selectedPayment.status)}
                  <span className={`text-sm font-medium ${getPaymentStatusColor(selectedPayment.status)}`}>
                    {getPaymentStatusLabel(selectedPayment.status)}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="space-y-3">
                <DetailRow label="Transaction ID" value={selectedPayment.transactionId} mono />
                <DetailRow label="Type" value={getPaymentTypeLabel(selectedPayment.type)} />
                <DetailRow label="Payment Method" value={getPaymentMethodLabel(selectedPayment.paymentMethod)} />
                {selectedPayment.description && (
                  <DetailRow label="Description" value={selectedPayment.description} />
                )}
                {selectedPayment.receiverDetails?.name && (
                  <DetailRow label="Paid To" value={selectedPayment.receiverDetails.name} />
                )}
                {selectedPayment.receiverDetails?.upiId && (
                  <DetailRow label="UPI ID" value={selectedPayment.receiverDetails.upiId} mono />
                )}
                {selectedPayment.category && (
                  <DetailRow label="Category" value={selectedPayment.category} />
                )}
                {selectedPayment.fee !== undefined && selectedPayment.fee > 0 && (
                  <DetailRow label="Fee" value={`₹${selectedPayment.fee}`} />
                )}
                {selectedPayment.balanceBefore !== undefined && (
                  <DetailRow label="Balance Before" value={`₹${selectedPayment.balanceBefore.toLocaleString('en-IN')}`} />
                )}
                {selectedPayment.balanceAfter !== undefined && (
                  <DetailRow label="Balance After" value={`₹${selectedPayment.balanceAfter.toLocaleString('en-IN')}`} />
                )}
                <DetailRow 
                  label="Date" 
                  value={`${formatDate(selectedPayment.createdAt)} at ${formatTime(selectedPayment.createdAt)}`} 
                />
                {selectedPayment.completedAt && (
                  <DetailRow 
                    label="Completed" 
                    value={`${formatDate(selectedPayment.completedAt)} at ${formatTime(selectedPayment.completedAt)}`} 
                  />
                )}
              </div>

              {/* Status History */}
              {selectedPayment.statusHistory && selectedPayment.statusHistory.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Status History</h4>
                  <div className="space-y-2">
                    {selectedPayment.statusHistory.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <div className="h-2 w-2 bg-blue-400 rounded-full" />
                        <span className="text-gray-600 flex-1">
                          {getPaymentStatusLabel(entry.status)}
                          {entry.reason && <span className="text-gray-400"> - {entry.reason}</span>}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(entry.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for detail rows
function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm text-gray-900 text-right ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}
