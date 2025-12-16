import { useEffect, useState, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { 
  CheckCircle2, 
  Download, 
  Share2, 
  Home, 
  ArrowLeft,
  Copy,
  Sparkles,
  Shield,
  Clock,
  User,
  Phone,
  CreditCard,
  Fingerprint,
  Scan,
  Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionDetails {
  id: string;
  amount: number;
  timestamp: string;
  type: string;
  status: string;
  description?: string;
  authMethod?: string;
  metadata?: {
    recipientName?: string;
    phoneNumber?: string;
    upiId?: string;
    operator?: string;
    plan?: string;
    validity?: string;
    note?: string;
  };
}

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get transaction data from URL params or sessionStorage
    const params = new URLSearchParams(window.location.search);
    const transactionData = sessionStorage.getItem('lastTransaction');
    
    if (transactionData) {
      try {
        const parsed = JSON.parse(transactionData);
        // Ensure amount is a valid number
        setTransaction({
          ...parsed,
          amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || 0,
          timestamp: parsed.timestamp || new Date().toISOString(),
          type: parsed.type || 'transfer',
          status: parsed.status || 'success'
        });
      } catch (e) {
        console.error('Failed to parse transaction data');
        // Fallback to URL params
        setTransaction({
          id: `TXN${Date.now()}`,
          amount: parseFloat(params.get('amount') || '0') || 0,
          timestamp: new Date().toISOString(),
          type: params.get('type') || 'transfer',
          status: 'success',
          description: params.get('description') || 'Payment',
          authMethod: params.get('authMethod') || 'biometric',
          metadata: {
            recipientName: params.get('recipient') || 'User',
            phoneNumber: params.get('phone') || '',
            upiId: params.get('upiId') || ''
          }
        });
      }
    } else {
      // Create mock transaction for demo
      setTransaction({
        id: `TXN${Date.now()}`,
        amount: parseFloat(params.get('amount') || '0') || 0,
        timestamp: new Date().toISOString(),
        type: params.get('type') || 'transfer',
        status: 'success',
        description: params.get('description') || 'Payment',
        authMethod: params.get('authMethod') || 'biometric',
        metadata: {
          recipientName: params.get('recipient') || 'User',
          phoneNumber: params.get('phone') || '',
          upiId: params.get('upiId') || ''
        }
      });
    }

    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const generateTransactionId = () => {
    return `UPI${transaction?.id || ''}${Date.now().toString().slice(-6)}`;
  };

  const handleCopyTransactionId = () => {
    const txnId = generateTransactionId();
    navigator.clipboard.writeText(txnId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Transaction ID copied to clipboard",
    });
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    try {
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(receiptRef.current);
      const link = document.createElement('a');
      link.download = `paytm-receipt-${transaction?.id || Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Downloaded!",
        description: "Receipt saved to your device",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download receipt",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!receiptRef.current) return;

    try {
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(receiptRef.current);
      
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `receipt-${transaction?.id}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: 'Payment Receipt',
          text: `Payment of ${formatCurrency(transaction?.amount || 0)} successful!`,
          files: [file]
        });
      } else {
        handleDownload();
      }
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Could not share receipt",
        variant: "destructive",
      });
    }
  };

  const getAuthMethodIcon = () => {
    switch (transaction?.authMethod) {
      case 'fingerprint':
        return <Fingerprint className="h-4 w-4" />;
      case 'face':
        return <Scan className="h-4 w-4" />;
      case 'voice':
        return <Mic className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getAuthMethodLabel = () => {
    switch (transaction?.authMethod) {
      case 'fingerprint':
        return 'Fingerprint';
      case 'face':
        return 'Face Recognition';
      case 'voice':
        return 'Voice Recognition';
      case 'upi_pin':
        return 'UPI PIN';
      default:
        return 'Biometric';
    }
  };

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-500 to-green-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-500 via-green-500 to-green-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating circles */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute top-40 right-5 w-20 h-20 bg-white rounded-full"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="absolute bottom-40 left-5 w-40 h-40 bg-white rounded-full"
        />
        
        {/* Confetti Animation */}
        <AnimatePresence>
          {showConfetti && (
            <>
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    y: -20, 
                    x: Math.random() * window.innerWidth,
                    rotate: 0,
                    opacity: 1
                  }}
                  animate={{ 
                    y: window.innerHeight + 100,
                    rotate: Math.random() * 720 - 360,
                    opacity: 0
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 2,
                    delay: Math.random() * 0.5,
                    ease: "easeOut"
                  }}
                  className={`absolute w-3 h-3 ${
                    ['bg-yellow-400', 'bg-pink-400', 'bg-blue-400', 'bg-purple-400', 'bg-orange-400'][i % 5]
                  } ${i % 2 === 0 ? 'rounded-full' : 'rounded-sm'}`}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-1 text-white/90 text-sm"
        >
          <Sparkles className="h-4 w-4" />
          <span>Secured Payment</span>
        </motion.div>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 pt-4 pb-8" ref={receiptRef}>
        {/* Success Animation */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1
          }}
          className="flex flex-col items-center mb-6"
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full flex items-center justify-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <CheckCircle2 className="h-14 w-14 sm:h-16 sm:w-16 text-green-500" />
              </motion.div>
            </motion.div>
            
            {/* Pulse ring effect */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                repeatType: "loop"
              }}
              className="absolute inset-0 bg-white/30 rounded-full"
            />
          </div>
        </motion.div>

        {/* Amount */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8"
        >
          <h1 className="text-white text-lg font-medium mb-2">Payment Successful!</h1>
          <div className="text-white text-4xl sm:text-5xl font-bold mb-2">
            ₹{(transaction.amount ?? 0).toLocaleString('en-IN')}
          </div>
          <p className="text-white/80 text-sm">
            {transaction.metadata?.recipientName 
              ? `Sent to ${transaction.metadata.recipientName}`
              : transaction.description
            }
          </p>
        </motion.div>

        {/* Receipt Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mx-auto max-w-md"
        >
          {/* Card Header */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-4 border-b border-green-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Payment Complete</p>
                  <p className="text-xs text-gray-500">{formatDate(transaction.timestamp)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                {getAuthMethodIcon()}
                <span className="text-xs text-green-700 font-medium">{getAuthMethodLabel()}</span>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="px-5 py-4 space-y-4">
            {/* Recipient Info */}
            {transaction.metadata?.recipientName && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{transaction.metadata.recipientName}</p>
                  {transaction.metadata.upiId && (
                    <p className="text-sm text-gray-500">{transaction.metadata.upiId}</p>
                  )}
                  {transaction.metadata.phoneNumber && (
                    <p className="text-sm text-gray-500">{transaction.metadata.phoneNumber}</p>
                  )}
                </div>
              </div>
            )}

            {/* Recharge Details (for mobile recharge) */}
            {transaction.type === 'recharge' && transaction.metadata?.operator && (
              <div className="p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Recharge Details</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Operator</p>
                    <p className="font-medium">{transaction.metadata.operator}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Plan</p>
                    <p className="font-medium">{transaction.metadata.plan}</p>
                  </div>
                  {transaction.metadata.validity && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Validity</p>
                      <p className="font-medium">{transaction.metadata.validity}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transaction ID */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                <p className="font-mono text-sm font-medium text-gray-800">{generateTransactionId()}</p>
              </div>
              <button
                onClick={handleCopyTransactionId}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Copy className={`h-4 w-4 ${copied ? 'text-green-500' : 'text-gray-400'}`} />
              </button>
            </div>

            {/* Payment Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Clock className="h-3 w-3" />
                  <span>Date & Time</span>
                </div>
                <p className="text-sm font-medium">{formatDate(transaction.timestamp)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <CreditCard className="h-3 w-3" />
                  <span>Payment From</span>
                </div>
                <p className="text-sm font-medium">Wallet</p>
              </div>
            </div>

            {/* Note (if any) */}
            {transaction.metadata?.note && (
              <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                <p className="text-xs text-yellow-700 mb-1">Note</p>
                <p className="text-sm text-gray-800">{transaction.metadata.note}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Action */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-green-600 to-transparent pt-16"
      >
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => navigate('/')}
            className="w-full h-14 bg-white text-green-600 hover:bg-gray-100 font-semibold text-lg rounded-2xl shadow-lg"
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
