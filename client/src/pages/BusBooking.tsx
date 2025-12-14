import { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, Calendar, RefreshCw, Info, CheckCircle2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function BusBooking() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: 'Today',
    busType: 'AC',
  });

  const dates = [
    { day: 'Today', date: '6', isHoliday: true },
    { day: 'Mon', date: '7', isHoliday: false },
    { day: 'Tue', date: '8', isHoliday: false },
    { day: 'Wed', date: '9', isHoliday: false },
    { day: 'Thu', date: '10', isHoliday: true },
  ];

  const busTypes = ['Seater', 'Sleeper', 'AC'];

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    if (!formData.from || !formData.to) {
      toast({
        title: "Incomplete Form",
        description: "Please enter both source and destination",
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

  const mockBuses = [
    {
      id: "BUS001",
      name: "VRL Travels",
      from: "Bangalore",
      to: "Chennai",
      departureTime: "22:30",
      arrivalTime: "05:00",
      duration: "6h 30m",
      date: "Today, 6 Apr",
      type: "AC Sleeper",
      price: 950,
      available: 12,
      rating: 4.2,
      amenities: ["Charging Point", "Water Bottle", "Blanket"]
    },
    {
      id: "BUS002",
      name: "SRS Travels",
      from: "Bangalore",
      to: "Chennai",
      departureTime: "23:00",
      arrivalTime: "05:30",
      duration: "6h 30m",
      date: "Today, 6 Apr",
      type: "Non-AC Sleeper",
      price: 750,
      available: 8,
      rating: 3.9,
      amenities: ["Charging Point", "Water Bottle"]
    },
    {
      id: "BUS003",
      name: "Sharma Travels",
      from: "Bangalore",
      to: "Chennai",
      departureTime: "22:00",
      arrivalTime: "04:30",
      duration: "6h 30m",
      date: "Today, 6 Apr",
      type: "AC Seater",
      price: 850,
      available: 15,
      rating: 4.0,
      amenities: ["Charging Point", "WiFi", "Water Bottle"]
    }
  ];

  const handleSelectBus = (bus: any) => {
    setSelectedBus(bus);
  };

  const handleBookTicket = () => {
    if (!selectedBus) {
      toast({
        title: "No Selection",
        description: "Please select a bus first",
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
        description: `Your ticket for ${selectedBus.name} has been booked. Ticket #: ${Math.floor(100000 + Math.random() * 900000)}`,
      });
    }, 2000);
  };

  const renderBookingForm = () => (
    <div className="p-4 bg-white rounded-md shadow-sm mb-4">
      <div className="flex mb-4">
        <div 
          className="flex-1 pb-2 border-b-2 border-blue-500 text-blue-500 text-center font-medium"
        >
          Bus
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
          placeholder="From City"
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
          placeholder="To City"
        />
      </div>

      <div className="mb-4">
        <div className="mb-2 font-medium">Departure Date</div>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {dates.map((d, index) => (
            <div 
              key={index}
              onClick={() => handleChange('date', d.day)}
              className={`flex-shrink-0 w-16 rounded-md p-2 text-center 
                ${formData.date === d.day ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}
            >
              {d.isHoliday && <div className="text-xs text-green-600 font-medium">Holiday</div>}
              <div className="text-lg font-medium">{d.date}</div>
              <div className="text-xs">{d.day}</div>
            </div>
          ))}
          <div className="flex-shrink-0 w-16 rounded-md border border-gray-300 p-2 flex items-center justify-center">
            <span className="text-blue-500 text-sm">Show More Dates</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2">
          {busTypes.map((type, index) => (
            <div 
              key={index}
              onClick={() => handleChange('busType', type)}
              className={`flex-1 py-2 px-3 rounded-full text-center text-sm
                ${formData.busType === type 
                  ? 'bg-blue-500 text-white' 
                  : 'border border-gray-300 text-gray-700'}`}
            >
              {type}
            </div>
          ))}
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
          "Search Buses"
        )}
      </button>
    </div>
  );

  const renderBusResults = () => (
    <div className="mb-20">
      <div className="bg-white p-4 rounded-md shadow-sm mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-lg font-semibold">
            {formData.from || 'Source'} to {formData.to || 'Destination'}
          </div>
          <div className="text-sm text-gray-600">{formData.date}</div>
        </div>
        <div className="text-sm text-gray-500">{mockBuses.length} buses found</div>
      </div>

      {mockBuses.map((bus, index) => (
        <div 
          key={index} 
          className={`bg-white p-4 rounded-md shadow-sm mb-4 border-2 
            ${selectedBus && selectedBus.id === bus.id 
              ? 'border-blue-500' 
              : 'border-transparent'}`}
          onClick={() => handleSelectBus(bus)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold">{bus.name}</div>
              <div className="text-xs text-gray-500">{bus.type}</div>
            </div>
            <div className="flex items-center">
              <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                <span className="mr-1">{bus.rating}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 17.8L5.8 21.1C5.3 21.4 4.7 21.1 4.6 20.6L3.5 13.4L-1.2 8.2C-1.6 7.8 -1.4 7.1 -0.9 7L6.3 6.1L9.5 -0.5C9.7 -1 10.3 -1 10.6 -0.5L13.8 6.1L21 7C21.5 7.1 21.7 7.8 21.3 8.2L16.6 13.3L15.5 20.5C15.4 21 14.8 21.3 14.3 21L8.1 17.8H12Z" fill="currentColor"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center my-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{bus.departureTime}</div>
              <div className="text-xs text-gray-600">{bus.from}</div>
            </div>
            <div className="flex-1 mx-2 border-t border-gray-300 relative">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white px-1">
                {bus.duration}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{bus.arrivalTime}</div>
              <div className="text-xs text-gray-600">{bus.to}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {bus.amenities.map((amenity, idx) => (
              <div key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                {amenity}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center border-t pt-3">
            <div className="text-green-600 font-medium text-sm">
              {bus.available} seats left
            </div>
            <div className="text-lg font-semibold">₹{bus.price}</div>
          </div>
        </div>
      ))}

      {selectedBus && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold">{selectedBus.name}</div>
              <div className="text-xs text-gray-600">
                {selectedBus.type} • ₹{selectedBus.price}
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
        Your bus ticket has been booked successfully.
      </p>
      
      <div className="border-t border-b py-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-600">Ticket Number</div>
          <div className="font-semibold">{Math.floor(100000 + Math.random() * 900000)}</div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-600">Bus Operator</div>
          <div className="font-semibold">{selectedBus?.name}</div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-600">Journey</div>
          <div className="font-semibold">{selectedBus?.from} to {selectedBus?.to}</div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-600">Date & Time</div>
          <div className="font-semibold">{selectedBus?.date}, {selectedBus?.departureTime}</div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-600">Bus Type</div>
          <div className="font-semibold">{selectedBus?.type}</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-gray-600">Amount Paid</div>
          <div className="font-semibold">₹{selectedBus?.price}</div>
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
        E-ticket has been sent to your mobile number and email
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
        <div className="text-blue-500 font-medium text-sm">
          Help
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {bookingSuccess 
          ? renderBookingSuccess() 
          : showResults 
            ? renderBusResults() 
            : renderBookingForm()
        }
      </div>

      {!bookingSuccess && !showResults && (
        <div className="mt-4 p-4">
          <div className="bg-blue-100 rounded-md overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white">
              <div className="flex items-center justify-between">
                <div className="text-sm">Spin the wheel to win exciting discounts this IPL season →</div>
              </div>
            </div>
            <div className="p-4 flex items-center relative">
              <img 
                src="https://assetscdn1.paytm.com/travel_cms/0a63d354-bcff-11eb-866e-5bf8bb4b9e51.jpg" 
                alt="Mountains"
                className="w-full h-32 object-cover rounded-md"
              />
              <div className="absolute inset-0 flex items-center p-6 bg-gradient-to-r from-blue-900/80 to-transparent">
                <div className="w-1/2">
                  <div className="text-white font-semibold mb-1">Looking for budget-friendly stays?</div>
                  <button className="bg-yellow-400 text-black font-medium px-4 py-1 rounded-md text-sm flex items-center">
                    Book Now →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!bookingSuccess && !showResults && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-4 py-3 flex space-x-12">
          <div className="flex flex-col items-center text-xs font-medium">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Offers</span>
          </div>
          <div className="flex flex-col items-center text-xs font-medium">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 2V6" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 2V6" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 10H21" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>My Bookings</span>
          </div>
        </div>
      )}
    </div>
  );
}