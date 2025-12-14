import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useLocation } from 'wouter';
import { ChevronLeft, Share2, Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReceiveQR() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState({
    id: 1, // Mock user ID
    name: 'John Doe', // Mock user name
    upiId: 'johndoe@paytm', // Mock UPI ID
  });
  
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    // Create QR data with user information
    const qrData = JSON.stringify({
      userId: user.id,
      name: user.name,
      upiId: user.upiId
    });
    
    setQrValue(qrData);
  }, [user]);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(user.upiId).then(() => {
      toast({
        title: "UPI ID Copied",
        description: "UPI ID copied to clipboard"
      });
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Paytm QR Code',
        text: `Pay me using my UPI ID: ${user.upiId}`,
        url: window.location.href,
      })
        .then(() => {
          toast({
            title: "Success",
            description: "QR code shared successfully"
          });
        })
        .catch(() => {
          toast({
            title: "Error",
            description: "Failed to share QR code",
            variant: "destructive"
          });
        });
    } else {
      toast({
        title: "Not Supported",
        description: "Sharing is not supported on this device",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (!canvas) {
      toast({
        title: "Error",
        description: "QR code image not found",
        variant: "destructive"
      });
      return;
    }

    const image = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = image;
    link.download = `paytm-qr-${user.upiId}.png`;
    link.click();
    
    toast({
      title: "Success",
      description: "QR code downloaded successfully"
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      {/* Header */}
      <div className="bg-[#0d4bb5] text-white p-4 flex items-center justify-between">
        <button 
          className="flex items-center" 
          onClick={() => navigate("/")}
        >
          <ChevronLeft size={24} />
          <span className="ml-2">Back</span>
        </button>
        <h1 className="text-lg font-semibold">Receive Money</h1>
        <div className="w-8"></div>
      </div>

      <div className="p-4">
        <div className="mt-2 mb-4 bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-gray-600">{user.upiId}</p>
            </div>

            <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 mb-4">
              {qrValue && (
                <QRCodeSVG
                  id="qr-canvas"
                  value={qrValue}
                  size={200}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "https://static.paytm.com/web/metadata/favicon.ico",
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              )}
            </div>

            <p className="text-center text-gray-600 mb-6">
              Let others scan this QR code to pay you
            </p>

            <div className="grid grid-cols-3 gap-4 w-full">
              <button 
                className="flex flex-col items-center bg-gray-100 p-3 rounded-lg"
                onClick={handleShare}
              >
                <Share2 className="h-6 w-6 text-[#0d4bb5] mb-1" />
                <span className="text-sm">Share</span>
              </button>
              
              <button 
                className="flex flex-col items-center bg-gray-100 p-3 rounded-lg"
                onClick={handleDownload}
              >
                <Download className="h-6 w-6 text-[#0d4bb5] mb-1" />
                <span className="text-sm">Download</span>
              </button>
              
              <button 
                className="flex flex-col items-center bg-gray-100 p-3 rounded-lg"
                onClick={handleCopyUPI}
              >
                <Copy className="h-6 w-6 text-[#0d4bb5] mb-1" />
                <span className="text-sm">Copy UPI</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}