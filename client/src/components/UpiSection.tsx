export default function UpiSection() {
  return (
    <div className="px-3 sm:px-4 py-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2 px-3 py-2 sm:py-2.5 bg-gray-100 rounded-lg text-sm">
        <div className="flex items-center">
          <span className="text-[#0d4bb5] font-medium text-xs sm:text-sm">UPI Lite :</span>
          <button className="ml-2 text-[#0d4bb5] text-xs sm:text-sm hover:underline active:opacity-70 transition-opacity tap-target-inline">Activate</button>
        </div>
        <div className="text-gray-600 text-[10px] sm:text-xs overflow-hidden overflow-ellipsis whitespace-nowrap max-w-[200px] sm:max-w-[180px] md:max-w-[220px]">
          UPI : 7795129038@ptyes
        </div>
      </div>
    </div>
  );
}
