import { useState } from "react";

export default function PromotionSlider() {
  const [activeSlide, setActiveSlide] = useState(0);

  const handleSlideChange = (index: number) => {
    setActiveSlide(index);
  };

  return (
    <div className="relative px-4 py-3">
      <div className="flex space-x-3 overflow-x-auto py-2 scrollbar-hide">
        {/* First Promotion */}
        <div className="bg-[#00b37a] text-white rounded-lg w-full min-w-[65%] flex-shrink-0 p-4 relative">
          <div className="flex justify-between">
            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center mb-3">
              <svg 
                width="28" 
                height="28" 
                viewBox="0 0 48 48" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M27.4 18H21V30H27.4C30 30 32 27.8 32 24C32 20.2 29.9 18 27.4 18Z" fill="#01BAF2"/>
                <path d="M11 18V33H17V18H11Z" fill="#00AEEF"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M27.2 15H7V36H27.2C32.2 36 36 31.1 36 24C36 16.9 31.3 15 27.2 15ZM27.4 30H21V18H27.4C30 18 32 20.2 32 24C32 27.8 30 30 27.4 30ZM17 33V18H11V33H17Z" fill="#002970"/>
              </svg>
            </div>
            <div className="w-8 h-10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
              </svg>
            </div>
          </div>
          <h3 className="font-semibold text-base mb-1">Get assured Cashback</h3>
          <p className="text-xs text-white/90">on next 5 UPI Payments</p>
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 bg-yellow-400 h-8 w-8 rounded-full flex items-center justify-center text-[#001e84] font-bold">+</div>
        </div>
        
        {/* Second Promotion */}
        <div className="bg-[#00b37a] text-white rounded-lg w-full min-w-[65%] flex-shrink-0 p-4">
          <div className="flex justify-between">
            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-[#0d4bb5]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
              </svg>
            </div>
          </div>
          <h3 className="font-semibold text-base mb-1">Bonus Reward</h3>
          <p className="text-xs text-white/90">on Recharge & Bill Payment</p>
        </div>
        
        {/* Coin Decorations */}
        <div className="absolute -left-1 bottom-5 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-[#001e84] border-2 border-white">
          <span className="text-xs font-bold">₹</span>
        </div>
        <div className="absolute -right-1 bottom-5 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-[#001e84] border-2 border-white">
          <span className="text-xs font-bold">₹</span>
        </div>
      </div>
      
      {/* Slider Indicators */}
      <div className="flex justify-center mt-2 space-x-1">
        {[0, 1, 2].map((index) => (
          <div 
            key={index}
            className={`h-1.5 ${index === activeSlide ? 'w-6 bg-[#001e84]' : 'w-1.5 bg-gray-300'} rounded-full`}
            onClick={() => handleSlideChange(index)}
          ></div>
        ))}
      </div>
      
      {/* Activate Offer Button */}
      <div className="flex justify-center mt-3">
        <button className="bg-yellow-400 text-[#001e84] font-semibold text-sm py-1.5 px-4 rounded-full flex items-center">
          Activate Offer
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 ml-1" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
