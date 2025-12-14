import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Settings from "@/pages/Settings";
import MobileRecharge from "@/pages/MobileRecharge";
import ElectricityBill from "@/pages/ElectricityBill";
import MoneyTransfer from "@/pages/MoneyTransfer";
import TransactionHistory from "@/pages/TransactionHistory";
import QRScanner from "@/pages/QRScanner";
import ReceiveQR from "@/pages/ReceiveQR";
import AddMoney from "@/pages/AddMoney";
import ProfileSettings from "@/pages/ProfileSettings";
import CreditCardApplication from "@/pages/CreditCardApplication";
import TrainBooking from "@/pages/TrainBooking";
import BusBooking from "@/pages/BusBooking";
import FlightBooking from "@/pages/FlightBooking";
import Checkout from "@/pages/Checkout";
import AllServices from "@/pages/AllServices";
import PersonalLoan from "@/pages/PersonalLoan";
import PersonalLoanApplication from "@/pages/PersonalLoanApplication";
import PersonalLoanApproved from "@/pages/PersonalLoanApproved";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/settings" component={Settings} />
      <Route path="/mobile-recharge" component={MobileRecharge} />
      <Route path="/electricity-bill" component={ElectricityBill} />
      <Route path="/money-transfer" component={MoneyTransfer} />
      <Route path="/transaction-history" component={TransactionHistory} />
      <Route path="/scan-qr" component={QRScanner} />
      <Route path="/receive-qr" component={ReceiveQR} />
      <Route path="/add-money" component={AddMoney} />
      <Route path="/profile" component={ProfileSettings} />
      <Route path="/credit-card" component={CreditCardApplication} />
      <Route path="/train-booking" component={TrainBooking} />
      <Route path="/bus-booking" component={BusBooking} />
      <Route path="/flight-booking" component={FlightBooking} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/all-services" component={AllServices} />
      <Route path="/personal-loan" component={PersonalLoan} />
      <Route path="/personal-loan/application" component={PersonalLoanApplication} />
      <Route path="/personal-loan/approved" component={PersonalLoanApproved} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
