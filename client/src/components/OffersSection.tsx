import { Gift } from 'lucide-react';

export default function OffersSection() {
  return (
    <div className="flex justify-between px-4 py-3 mt-2">
      <button className="flex items-center border border-[#e1e1e1] rounded-lg py-2 px-3 text-[#333333] w-[48%]">
        <div className="flex items-center">
          <Gift className="text-[#0d4bb5] h-5 w-5 mr-2" />
          <span className="text-sm font-medium">Cashback & Offers</span>
        </div>
      </button>
      
      <button className="flex items-center border border-[#e1e1e1] rounded-lg py-2 px-3 text-[#333333] w-[48%]">
        <div className="flex items-center">
          <Gift className="text-[#0d4bb5] h-5 w-5 mr-2" />
          <span className="text-sm font-medium">Gift Cards</span>
        </div>
      </button>
    </div>
  );
}
