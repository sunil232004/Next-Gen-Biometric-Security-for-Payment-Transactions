export default function UpiSection() {
  return (
    <div className="px-4 py-2">
      <div className="flex justify-between items-center px-3 py-2 bg-gray-100 rounded-lg text-sm">
        <div className="flex items-center">
          <span className="text-[#0d4bb5] font-medium">UPI Lite :</span>
          <button className="ml-2 text-[#0d4bb5]">Activate</button>
        </div>
        <div className="text-gray-600 text-xs overflow-hidden overflow-ellipsis whitespace-nowrap max-w-[150px]">
          UPI : 7795129038@ptyes
        </div>
      </div>
    </div>
  );
}
