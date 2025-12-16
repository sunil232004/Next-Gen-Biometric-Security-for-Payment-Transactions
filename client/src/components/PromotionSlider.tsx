import { useState } from "react";

export default function PromotionSlider() {
  const [activeSlide, setActiveSlide] = useState(0);

  const handleSlideChange = (index: number) => {
    setActiveSlide(index);
  };

  return (
    <div className="relative px-3 sm:px-4 py-2.5 sm:py-3">
      <div className="flex space-x-2 sm:space-x-3 overflow-x-auto py-2 scrollbar-hide snap-x snap-mandatory">
        {/* First Promotion */}
        <div className="bg-[#00b37a] text-white rounded-lg w-full min-w-[70%] sm:min-w-[65%] md:min-w-[50%] flex-shrink-0 p-3 sm:p-4 relative snap-start">
          <div className="flex justify-between">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-md flex items-center justify-center mb-2 sm:mb-3">
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 48 48" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="sm:w-7 sm:h-7"
              >
                <path d="M27.4 18H21V30H27.4C30 30 32 27.8 32 24C32 20.2 29.9 18 27.4 18Z" fill="#01BAF2"/>
                <path d="M11 18V33H17V18H11Z" fill="#00AEEF"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M27.2 15H7V36H27.2C32.2 36 36 31.1 36 24C36 16.9 31.3 15 27.2 15ZM27.4 30H21V18H27.4C30 18 32 20.2 32 24C32 27.8 30 30 27.4 30ZM17 33V18H11V33H17Z" fill="#002970"/>
              </svg>
            </div>
            <div className="w-7 h-9 sm:w-8 sm:h-10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6 text-white"
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
          <h3 className="font-semibold text-sm sm:text-base mb-0.5 sm:mb-1">Get assured Cashback</h3>
          <p className="text-[10px] sm:text-xs text-white/90">on next 5 UPI Payments</p>
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 bg-yellow-400 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-[#001e84] font-bold text-sm sm:text-base">+</div>
        </div>
        
        {/* Second Promotion */}
        <div className="bg-[#00b37a] text-white rounded-lg w-full min-w-[70%] sm:min-w-[65%] md:min-w-[50%] flex-shrink-0 p-3 sm:p-4 snap-start">
          <div className="flex justify-between">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-md flex items-center justify-center mb-2 sm:mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6 text-[#0d4bb5]"
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
          <h3 className="font-semibold text-sm sm:text-base mb-0.5 sm:mb-1">Bonus Reward</h3>
          <p className="text-[10px] sm:text-xs text-white/90">on Recharge & Bill Payment</p>
        </div>
        
        {/* Coin Decorations - hidden on very small screens */}
        <div className="hidden sm:flex absolute -left-1 bottom-5 w-7 h-7 sm:w-8 sm:h-8 bg-yellow-400 rounded-full items-center justify-center text-[#001e84] border-2 border-white">
          <span className="text-[10px] sm:text-xs font-bold">₹</span>
        </div>
        <div className="hidden sm:flex absolute -right-1 bottom-5 w-7 h-7 sm:w-8 sm:h-8 bg-yellow-400 rounded-full items-center justify-center text-[#001e84] border-2 border-white">
          <span className="text-[10px] sm:text-xs font-bold">₹</span>
        </div>
      </div>
      
      {/* Slider Indicators */}
      <div className="flex justify-center mt-2 space-x-1">
        {[0, 1, 2].map((index) => (
          <div 
            key={index}
            className={`h-1 sm:h-1.5 ${index === activeSlide ? 'w-5 sm:w-6 bg-[#001e84]' : 'w-1 sm:w-1.5 bg-gray-300'} rounded-full cursor-pointer transition-all`}
            onClick={() => handleSlideChange(index)}
          ></div>
        ))}
      </div>
      
      {/* Activate Offer Button */}
      <div className="flex justify-center mt-2.5 sm:mt-3">
        <button className="bg-yellow-400 text-[#001e84] font-semibold text-xs sm:text-sm py-1.5 px-3 sm:px-4 rounded-full flex items-center hover:bg-yellow-300 active:bg-yellow-500 transition-colors tap-target">
          Activate Offer
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" 
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
