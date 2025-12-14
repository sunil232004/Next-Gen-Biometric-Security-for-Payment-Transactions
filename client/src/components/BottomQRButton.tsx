import { QrCode } from 'lucide-react';

export default function BottomQRButton() {
  return (
    <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-20">
      <button className="bg-[#0d4bb5] text-white py-3 px-5 rounded-full shadow-lg flex items-center">
        <QrCode className="h-5 w-5 mr-2" />
        <span className="font-medium">Scan Any QR</span>
      </button>
    </div>
  );
}
