import { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, Calendar, Search, RefreshCw, Clock, CheckCircle2, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function TrainBooking() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState<any>(null);
  const [formData, setFormData] = useState({
    from: 'Bengaluru- All Stations',
    to: '',
    date: 'Today',
    passengers: 1,
    trainClass: 'AC & non-AC',
    freeCancel: false,
  });

  const dates = [
    { day: 'Today', date: '6 Apr', isHoliday: true },
    { day: 'Mon', date: '7 Apr', isHoliday: false },
    { day: 'Tue', date: '8 Apr', isHoliday: false },
    { day: 'Wed', date: '9 Apr', isHoliday: false },
    { day: 'Thu', date: '10 Apr', isHoliday: true },
  ];

  const classOptions = [
    'AC & non-AC',
    'AC only',
    'Non-AC only',
  ];

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    if (!formData.to) {
      toast({
        title: "Incomplete Form",
        description: "Please enter a destination",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, 1500);
  };

  const mockTrains = [
    {
      id: "12657",
      name: "Chennai Mail",
      from: "SBC",
      to: "MAS",
      departureTime: "22:10",
      arrivalTime: "04:30",
      duration: "6h 20m",
      date: "Today, 6 Apr",
      coaches: [
        { type: "Sleeper (SL)", price: 450, available: 65 },
        { type: "AC 3 Tier (3A)", price: 1245, available: 23 },
        { type: "AC 2 Tier (2A)", price: 1780, available: 12 }
      ]
    },
    {
      id: "12658",
      name: "Bengaluru Express",
      from: "SBC",
      to: "MAS",
      departureTime: "06:40",
      arrivalTime: "12:30",
      duration: "5h 50m",
      date: "Today, 6 Apr",
      coaches: [
        { type: "Sleeper (SL)", price: 450, available: 32 },
        { type: "AC 3 Tier (3A)", price: 1245, available: 14 },
        { type: "AC 2 Tier (2A)", price: 1780, available: 4 }
      ]
    },
    {
      id: "12659",
      name: "Shatabdi Express",
      from: "SBC",
      to: "MAS",
      departureTime: "16:00",
      arrivalTime: "21:40",
      duration: "5h 40m",
      date: "Today, 6 Apr",
      coaches: [
        { type: "Chair Car (CC)", price: 750, available: 86 },
        { type: "Exec. Chair Car (EC)", price: 1445, available: 28 }
      ]
    }
  ];

  const handleSelectCoach = (train: any, coach: any) => {
    setSelectedTrain({
      ...train,
      selectedCoach: coach
    });
  };

  const handleBookTicket = () => {
    if (!selectedTrain) {
      toast({
        title: "No Selection",
        description: "Please select a train and coach first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    // Simulate booking process
    setTimeout(() => {
      setIsLoading(false);
      setBookingSuccess(true);
      
      // Show success toast
      toast({
        title: "Booking Successful!",
        description: `Your ticket for ${selectedTrain.name} has been booked. PNR: ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      });
    }, 2000);
  };

  const renderBookingForm = () => (
    <div className="p-4 bg-white rounded-md shadow-sm mb-4">
      <div className="flex mb-4">
        <div 
          className="flex-1 pb-2 border-b-2 border-blue-500 text-blue-500 text-center font-medium"
        >
          Trains
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center mb-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">•</div>
          <span className="font-medium">From</span>
          <div className="ml-auto">
            <RefreshCw className="h-5 w-5 text-blue-500" />
          </div>
        </div>
        <input 
          type="text"
          value={formData.from}
          onChange={(e) => handleChange('from', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md mb-4"
          placeholder="From Station"
        />

        <div className="flex items-center mb-2">
          <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center text-white text-xs mr-2">•</div>
          <span className="font-medium">To</span>
        </div>
        <input 
          type="text"
          value={formData.to}
          onChange={(e) => handleChange('to', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md"
          placeholder="To Station"
        />
      </div>

      <div className="mb-4">
        <div className="mb-2 font-medium">Select Departure date</div>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {dates.map((d, index) => (
            <div 
              key={index}
              onClick={() => handleChange('date', d.day)}
              className={`flex-shrink-0 w-16 rounded-md p-2 text-center 
                ${formData.date === d.day ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}
            >
              {d.isHoliday && <div className="text-xs text-green-600 font-medium">Holiday</div>}
              <div className="text-sm font-medium">{d.date}</div>
              <div className="text-xs">{d.day}</div>
            </div>
          ))}
          <div className="flex-shrink-0 w-16 rounded-md border border-gray-300 p-2 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex space-x-2">
          {classOptions.map((option, index) => (
            <div 
              key={index}
              onClick={() => handleChange('trainClass', option)}
              className={`flex-1 py-2 px-3 rounded-full text-center text-sm
                ${formData.trainClass === option 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700'}`}
            >
              {option}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center">
        <input 
          type="checkbox"
          id="freeCancel"
          checked={formData.freeCancel}
          onChange={(e) => handleChange('freeCancel', e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="freeCancel" className="text-sm">
          I want 100% refund on my ticket
          <span className="text-xs text-blue-500 ml-1">T&C</span>
        </label>
        <div className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
          FREE Cancellation
        </div>
      </div>

      <button
        onClick={handleSearch}
        disabled={isLoading}
        className="w-full bg-blue-500 text-white py-3 rounded-md font-medium flex items-center justify-center"
      >
        {isLoading ? (
          <RefreshCw className="h-5 w-5 animate-spin" />
        ) : (
          "Search Trains"
        )}
      </button>

      <div className="mt-3 text-xs text-center flex items-center justify-center">
        <img 
          src="https://assetscdn1.paytm.com/travel_web/irctc_logo_light.png" 
          alt="IRCTC"
          className="h-5 mr-2"
        />
        IRCTC Authorised Partner
      </div>
    </div>
  );

  const renderTrainResults = () => (
    <div className="mb-4">
      <div className="bg-white p-4 rounded-md shadow-sm mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-lg font-semibold">
            {formData.from} to {formData.to || 'Destination'}
          </div>
          <div className="text-sm text-gray-600">{formData.date}</div>
        </div>
        <div className="text-sm text-gray-500">{mockTrains.length} trains found</div>
      </div>

      {mockTrains.map((train, index) => (
        <div key={index} className="bg-white p-4 rounded-md shadow-sm mb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold">{train.name}</div>
              <div className="text-xs text-gray-500">Train #{train.id}</div>
            </div>
            <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
              On Time
            </div>
          </div>

          <div className="flex justify-between items-center my-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{train.departureTime}</div>
              <div className="text-xs text-gray-600">{train.from}</div>
            </div>
            <div className="flex-1 mx-2 border-t border-gray-300 relative">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white px-1">
                {train.duration}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{train.arrivalTime}</div>
              <div className="text-xs text-gray-600">{train.to}</div>
            </div>
          </div>

          <div className="mt-4 border-t pt-3">
            <div className="flex flex-wrap gap-2">
              {train.coaches.map((coach, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelectCoach(train, coach)}
                  className={`border rounded-md p-2 cursor-pointer flex-1 min-w-[100px]
                    ${selectedTrain && selectedTrain.id === train.id && selectedTrain.selectedCoach.type === coach.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300'}`}
                >
                  <div className="text-sm font-medium">{coach.type}</div>
                  <div className="flex justify-between mt-1">
                    <div className="text-xs text-green-600 font-medium">
                      {coach.available} left
                    </div>
                    <div className="text-sm font-semibold">₹{coach.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {selectedTrain && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold">{selectedTrain.name}</div>
              <div className="text-xs text-gray-600">
                {selectedTrain.selectedCoach.type} • ₹{selectedTrain.selectedCoach.price}
              </div>
            </div>
            <button
              onClick={handleBookTicket}
              disabled={isLoading}
              className="bg-blue-500 text-white py-2 px-6 rounded-md font-medium"
            >
              {isLoading ? "Processing..." : "Book Ticket"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderBookingSuccess = () => (
    <div className="p-5 bg-white rounded-md shadow-sm">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
      </div>
      
      <h2 className="text-xl font-semibold text-center mb-2">Booking Successful!</h2>
      <p className="text-center text-gray-600 mb-6">
        Your train ticket has been booked successfully.
      </p>
      
      <div className="border-t border-b py-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-600">PNR Number</div>
          <div className="font-semibold">{Math.floor(1000000000 + Math.random() * 9000000000)}</div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-600">Train</div>
          <div className="font-semibold">{selectedTrain?.name} ({selectedTrain?.id})</div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-600">Journey</div>
          <div className="font-semibold">{selectedTrain?.from} to {selectedTrain?.to}</div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-600">Date & Time</div>
          <div className="font-semibold">{selectedTrain?.date}, {selectedTrain?.departureTime}</div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-600">Class</div>
          <div className="font-semibold">{selectedTrain?.selectedCoach.type}</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-gray-600">Amount Paid</div>
          <div className="font-semibold">₹{selectedTrain?.selectedCoach.price}</div>
        </div>
      </div>
      
      <div className="flex flex-col space-y-3">
        <button 
          onClick={() => navigate("/")}
          className="w-full bg-blue-500 text-white py-3 rounded-md font-medium"
        >
          Back to Home
        </button>
        <button className="w-full border border-blue-500 text-blue-500 py-3 rounded-md font-medium">
          View Ticket
        </button>
      </div>
      
      <div className="mt-6 text-sm text-center text-gray-500 flex items-center justify-center">
        <Info className="h-4 w-4 mr-1" />
        Ticket details have been sent to your email
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between border-b">
        <button 
          className="flex items-center" 
          onClick={() => {
            if (bookingSuccess) setBookingSuccess(false);
            else if (showResults) setShowResults(false);
            else navigate("/");
          }}
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <div className="font-medium">Paytm Travel</div>
          {bookingSuccess && <div className="text-xs text-gray-500">Booking Confirmation</div>}
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <div className="text-gray-600 text-sm font-medium">
            ?
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {bookingSuccess 
          ? renderBookingSuccess() 
          : showResults 
            ? renderTrainResults() 
            : renderBookingForm()
        }
      </div>

      {!bookingSuccess && (
        <div className="mt-4 p-4">
          <div className="bg-gradient-to-r from-orange-400 to-orange-600 p-4 rounded-md text-white flex items-center">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">₹0 Payment Gateway Charges</h3>
              <p className="text-sm">On Train Tickets Via UPI</p>
            </div>
            <button className="bg-yellow-400 text-black font-medium px-4 py-1 rounded-md text-sm">
              Book Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}