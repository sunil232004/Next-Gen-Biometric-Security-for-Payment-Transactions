import { useState, useRef, useEffect } from 'react';
import { CheckCircle, Download, Share2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface TransactionReceiptProps {
  transaction: {
    id: number;
    amount: number;
    timestamp: string;
    type: string;
    status: string;
    authMethod?: string;
    metadata?: any;
  };
  onClose?: () => void;
  useFullPage?: boolean; // Option to redirect to full page success screen
}

export default function TransactionReceipt({ transaction, onClose, useFullPage = true }: TransactionReceiptProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);

  // Redirect to full page payment success if enabled
  useEffect(() => {
    if (useFullPage && transaction) {
      // Store transaction in sessionStorage for the success page
      const transactionData = {
        id: transaction.id?.toString() || `TXN${Date.now()}`,
        amount: transaction.amount,
        timestamp: transaction.timestamp,
        type: transaction.type,
        status: transaction.status,
        authMethod: transaction.authMethod || 'biometric',
        description: transaction.metadata?.description,
        metadata: typeof transaction.metadata === 'string' 
          ? JSON.parse(transaction.metadata) 
          : transaction.metadata
      };
      sessionStorage.setItem('lastTransaction', JSON.stringify(transactionData));
      navigate('/payment-success');
    }
  }, [useFullPage, transaction, navigate]);

  // If redirecting to full page, show loading
  if (useFullPage) {
    return (
      <div className="fixed inset-0 bg-green-500 z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  // Get recipient details from transaction metadata
  const metadata = typeof transaction.metadata === 'string' 
    ? JSON.parse(transaction.metadata) 
    : transaction.metadata || {};
  const recipientName = metadata?.recipientName || 'User';
  const phoneNumber = metadata?.phoneNumber || '';
  const upiId = metadata?.upiId || '';
  
  // Generate UPI Transaction ID and Payment ID
  const upiTransactionId = `UPI${transaction.id}${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  const paymentId = `PAY${transaction.id}${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  // Format transaction date 
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).replace(',', ',');
  };

  const handleDownload = () => {
    if (!receiptRef.current) return;

    try {
      // Create a canvas from the receipt div
      import('html-to-image').then((htmlToImage) => {
        htmlToImage.toPng(receiptRef.current as HTMLElement)
          .then((dataUrl) => {
            const link = document.createElement('a');
            link.download = `receipt-${transaction.id}.png`;
            link.href = dataUrl;
            link.click();
            
            toast({
              title: "Receipt Downloaded",
              description: "Your receipt has been downloaded successfully.",
            });
          })
          .catch((error) => {
            console.error('Error generating receipt image:', error);
            toast({
              title: "Download Failed",
              description: "Could not download receipt. Please try again.",
              variant: "destructive",
            });
          });
      });
    } catch (err) {
      console.error('Error downloading receipt:', err);
      toast({
        title: "Download Failed",
        description: "Could not download receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!receiptRef.current) return;

    try {
      // Generate image to share
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(receiptRef.current as HTMLElement);
      
      // Check if Web Share API is available
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `receipt-${transaction.id}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: 'Payment Receipt',
          text: `Payment receipt for ${formatCurrency(transaction.amount)}`,
          files: [file]
        });
      } else {
        // Fallback if Web Share API is not available
        toast({
          title: "Sharing Not Available",
          description: "Your browser doesn't support sharing. You can download the receipt instead.",
        });
        handleDownload();
      }
    } catch (err) {
      console.error('Error sharing receipt:', err);
      toast({
        title: "Sharing Failed",
        description: "Could not share receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6" ref={receiptRef}>
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full mb-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-green-600">Payment Successful!</h2>
            <p className="text-gray-500 text-sm">Your money has been sent successfully</p>
            
            <div className="mt-4 mb-6">
              <p className="text-4xl font-bold">₹{transaction.amount}</p>
              <p className="text-gray-500 text-sm text-center">Amount Sent</p>
            </div>
            
            <div className="w-full space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">To</span>
                <span className="font-medium text-right">{recipientName}</span>
              </div>
              
              {phoneNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone Number</span>
                  <span className="font-medium">{phoneNumber}</span>
                </div>
              )}
              
              {upiId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">UPI ID</span>
                  <span className="font-medium">{upiId}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-500">Date & Time</span>
                <span className="font-medium">{formatDate(transaction.timestamp)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">UPI Transaction ID</span>
                <span className="font-medium">{upiTransactionId}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Payment ID</span>
                <span className="font-medium">{paymentId}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex border-t border-gray-200">
          <button 
            onClick={handleDownload}
            className="flex-1 py-3 flex items-center justify-center gap-2 text-blue-600 border-r border-gray-200"
          >
            <Download className="h-5 w-5" />
            <span>Download</span>
          </button>
          <button 
            onClick={handleShare}
            className="flex-1 py-3 flex items-center justify-center gap-2 text-blue-600"
          >
            <Share2 className="h-5 w-5" />
            <span>Share</span>
          </button>
        </div>
        
        <div className="p-4 flex justify-center">
          <button
            onClick={onClose || (() => navigate('/'))}
            className="text-gray-500 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}