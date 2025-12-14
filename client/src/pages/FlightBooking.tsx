import { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, Calendar, RefreshCw, Clock, RotateCw, CheckCircle2, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function FlightBooking() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [formData, setFormData] = useState({
    from: 'BLR',
    fromCity: 'Bengaluru',
    to: 'CCU',
    toCity: 'Kolkata',
    date: 'Mon, 21 Apr 25',
    tripType: 'oneWay',
    travelers: '3 Adults',
    cabinClass: 'Economy',
    specialFare: ''
  });

  const specialFares = [
    { id: 'armed', label: 'Armed Forces', discount: '₹600' },
    { id: 'student', label: 'Student', discount: 'Extra Baggage' },
    { id: 'senior', label: 'Senior Citizen', discount: '₹600' }
  ];

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecialFare = (id: string) => {
    if (formData.specialFare === id) {
      handleChange('specialFare', '');
    } else {
      handleChange('specialFare', id);
    }
  };

  const swapDestinations = () => {
    const newForm = {
      ...formData,
      from: formData.to,
      to: formData.from,
      fromCity: formData.toCity,
      toCity: formData.fromCity
    };
    setFormData(newForm);
  };

  const handleSearch = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, 1500);
  };

  const mockFlights = [
    {
      id: "AI476",
      airline: "Air India",
      airlineCode: "AI",
      from: "BLR",
      to: "CCU",
      fromCity: "Bengaluru",
      toCity: "Kolkata",
      departureTime: "06:15",
      arrivalTime: "08:55",
      duration: "2h 40m",
      date: "Mon, 21 Apr 25",
      price: 5645,
      stops: 0,
      aircraft: "Airbus A320"
    },
    {
      id: "6E6218",
      airline: "IndiGo",
      airlineCode: "6E",
      from: "BLR",
      to: "CCU",
      fromCity: "Bengaluru",
      toCity: "Kolkata",
      departureTime: "10:25",
      arrivalTime: "13:15",
      duration: "2h 50m",
      date: "Mon, 21 Apr 25",
      price: 5245,
      stops: 0,
      aircraft: "Airbus A320neo"
    },
    {
      id: "UK865",
      airline: "Vistara",
      airlineCode: "UK",
      from: "BLR",
      to: "CCU",
      fromCity: "Bengaluru",
      toCity: "Kolkata",
      departureTime: "16:45",
      arrivalTime: "21:15",
      duration: "4h 30m",
      date: "Mon, 21 Apr 25",
      price: 6850,
      stops: 1,
      stopCity: "DEL",
      stopDuration: "1h 15m",
      aircraft: "Boeing 737-800"
    }
  ];

  const handleSelectFlight = (flight: any) => {
    setSelectedFlight(flight);
  };

  const handleBookTicket = () => {
    if (!selectedFlight) {
      toast({
        title: "No Selection",
        description: "Please select a flight first",
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
        description: `Your flight ${selectedFlight.airline} (${selectedFlight.id}) has been booked. PNR: ${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      });
    }, 2000);
  };

  const renderBookingForm = () => (
    <div className="p-4 bg-white rounded-md shadow-sm mb-4">
      <div className="flex mb-4">
        <div 
          className="flex-1 pb-2 border-b-2 border-blue-500 text-blue-500 text-center font-medium"
        >
          Flights
        </div>
      </div>

      <div className="flex space-x-4 mb-4">
        <div 
          className={`flex-1 py-2 rounded-md text-center 
            ${formData.tripType === 'oneWay' ? 'bg-white text-black font-medium border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => handleChange('tripType', 'oneWay')}
        >
          One Way
        </div>
        <div 
          className={`flex-1 py-2 rounded-md text-center 
            ${formData.tripType === 'roundTrip' ? 'bg-white text-black font-medium border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => handleChange('tripType', 'roundTrip')}
        >
          Round Trip
        </div>
      </div>

      <div className="mb-4 relative">
        <div className="flex items-center justify-between bg-gray-100 px-4 py-3 rounded-md mb-2">
          <div>
            <div className="text-2xl font-bold">{formData.from}</div>
            <div className="text-sm text-gray-600">{formData.fromCity}</div>
          </div>
          <div 
            className="bg-white rounded-full p-2 shadow-md"
            onClick={swapDestinations}
          >
            <RotateCw className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-bold">{formData.to}</div>
            <div className="text-sm text-gray-600">{formData.toCity}</div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center space-x-2 bg-gray-100 px-4 py-3 rounded-md">
          <Calendar className="h-5 w-5 text-blue-500" />
          <div>
            <div className="text-sm">Departure Date</div>
            <div className="font-medium">{formData.date}</div>
          </div>
          {formData.tripType === 'roundTrip' && (
            <button className="ml-auto text-blue-500 text-sm font-medium">
              + Add Return
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center space-x-2 bg-gray-100 px-4 py-3 rounded-md">
          <div>
            <div className="text-sm">Travellers & Cabin Class</div>
            <div className="font-medium">{formData.travelers} • {formData.cabinClass}</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-2">Special Fares (optional)</div>
        <div className="grid grid-cols-3 gap-2">
          {specialFares.map(fare => (
            <div 
              key={fare.id}
              onClick={() => handleSpecialFare(fare.id)}
              className={`border rounded-md p-2 text-center cursor-pointer
                ${formData.specialFare === fare.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300'}`}
            >
              <div className="text-xs font-medium mb-1">{fare.label}</div>
              <div className="text-xs text-green-600">Up to {fare.discount} off</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center">
        <input 
          type="checkbox"
          id="nonstop"
          className="mr-2"
        />
        <label htmlFor="nonstop" className="text-sm">
          Show Non-stop flights only
        </label>
      </div>

      <button
        onClick={handleSearch}
        disabled={isLoading}
        className="w-full bg-blue-500 text-white py-3 rounded-md font-medium flex items-center justify-center"
      >
        {isLoading ? (
          <RefreshCw className="h-5 w-5 animate-spin" />
        ) : (
          "Search Flights"
        )}
      </button>
    </div>
  );

  const renderFlightResults = () => (
    <div className="mb-20">
      <div className="bg-white p-4 rounded-md shadow-sm mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-lg font-semibold">
            {formData.fromCity} to {formData.toCity}
          </div>
          <div className="text-sm text-gray-600">{formData.date}</div>
        </div>
        <div className="text-sm text-gray-500">{mockFlights.length} flights found</div>
      </div>

      <div className="p-3 bg-white rounded-md shadow-sm mb-4">
        <div className="text-sm text-blue-600 font-medium mb-1">
          Use promocode "FLYNEW" to get flat 15% off on your 1st domestic booking.
        </div>
      </div>

      {mockFlights.map((flight, index) => (
        <div 
          key={index} 
          className={`bg-white p-4 rounded-md shadow-sm mb-4 border-2 
            ${selectedFlight && selectedFlight.id === flight.id 
              ? 'border-blue-500' 
              : 'border-transparent'}`}
          onClick={() => handleSelectFlight(flight)}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                {flight.airlineCode}
              </div>
              <div>
                <div className="font-semibold">{flight.airline}</div>
                <div className="text-xs text-gray-500">{flight.id} • {flight.aircraft}</div>
              </div>
            </div>
            <div className="text-lg font-semibold">₹{flight.price}</div>
          </div>

          <div className="flex justify-between items-center my-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{flight.departureTime}</div>
              <div className="text-xs text-gray-600">{flight.from}</div>
            </div>
            <div className="flex-1 mx-4">
              <div className="text-xs text-center text-gray-500 mb-1">{flight.duration}</div>
              <div className="relative border-t border-gray-300">
                {flight.stops > 0 && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500"></div>
                )}
              </div>
              {flight.stops > 0 && (
                <div className="text-xs text-center text-red-500 mt-1">
                  {flight.stops} stop at {flight.stopCity} ({flight.stopDuration})
                </div>
              )}
              {flight.stops === 0 && (
                <div className="text-xs text-center text-green-600 mt-1">
                  Non-stop
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{flight.arrivalTime}</div>
              <div className="text-xs text-gray-600">{flight.to}</div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3 pt-3 border-t">
            <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md">
              25kg Check-in Bag
            </div>
            <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md">
              7kg Cabin Bag
            </div>
            <div className="text-blue-500 text-xs font-medium">
              Flight Details
            </div>
          </div>
        </div>
      ))}

      {selectedFlight && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold">{selectedFlight.airline} • {selectedFlight.id}</div>
              <div className="text-xs text-gray-600">
                {selectedFlight.fromCity} to {selectedFlight.toCity} • ₹{selectedFlight.price}
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
        Your flight ticket has been booked successfully.
      </p>
      
      <div className="border-t border-b py-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-600">PNR</div>
          <div className="font-semibold">{Math.random().toString(36).substring(2, 8).toUpperCase()}</div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-600">Flight</div>
          <div className="font-semibold">{selectedFlight?.airline} ({selectedFlight?.id})</div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-600">Journey</div>
          <div className="font-semibold">{selectedFlight?.fromCity} to {selectedFlight?.toCity}</div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-600">Date & Time</div>
          <div className="font-semibold">{selectedFlight?.date}, {selectedFlight?.departureTime}</div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-gray-600">Passengers</div>
          <div className="font-semibold">{formData.travelers}</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-gray-600">Amount Paid</div>
          <div className="font-semibold">₹{selectedFlight?.price * 3}</div>
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
          View E-Ticket
        </button>
      </div>
      
      <div className="mt-6 text-sm text-center text-gray-500 flex items-center justify-center">
        <Info className="h-4 w-4 mr-1" />
        E-ticket has been sent to your registered email
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
            ? renderFlightResults() 
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
          </div>
        </div>
      )}

      {!bookingSuccess && !showResults && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-4 py-3 flex space-x-8">
          <div className="flex flex-col items-center text-xs font-medium">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 12H2" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 6L13 6" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 6H21" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 18H21" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 18H10" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 6L16 6.01" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 18L13 18.01" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>My Bookings</span>
          </div>
          <div className="flex flex-col items-center text-xs font-medium">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.59 13.51L15.42 17.49" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.41 6.51L8.59 10.49" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Offers</span>
          </div>
          <div className="flex flex-col items-center text-xs font-medium">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16L12 10" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8L12 8.01" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Copilot</span>
          </div>
          <div className="flex flex-col items-center text-xs font-medium">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12H15V22" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Travel Pass</span>
          </div>
        </div>
      )}
    </div>
  );
}