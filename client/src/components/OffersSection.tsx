import { Gift } from 'lucide-react';

export default function OffersSection() {
  return (
    <div className="flex justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 mt-2">
      <button className="flex-1 flex items-center border border-[#e1e1e1] rounded-lg py-2 sm:py-2.5 px-2 sm:px-3 text-[#333333] hover:bg-gray-50 active:bg-gray-100 transition-colors tap-target">
        <div className="flex items-center">
          <Gift className="text-[#0d4bb5] h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">Cashback & Offers</span>
        </div>
      </button>
      
      <button className="flex-1 flex items-center border border-[#e1e1e1] rounded-lg py-2 sm:py-2.5 px-2 sm:px-3 text-[#333333] hover:bg-gray-50 active:bg-gray-100 transition-colors tap-target">
        <div className="flex items-center">
          <Gift className="text-[#0d4bb5] h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">Gift Cards</span>
        </div>
      </button>
    </div>
  );
}
