import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
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
import { Loader2 } from "lucide-react";

// Protected route wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      {/* Protected routes */}
      <Route path="/">
        {() => <ProtectedRoute component={Home} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>
      <Route path="/mobile-recharge">
        {() => <ProtectedRoute component={MobileRecharge} />}
      </Route>
      <Route path="/electricity-bill">
        {() => <ProtectedRoute component={ElectricityBill} />}
      </Route>
      <Route path="/money-transfer">
        {() => <ProtectedRoute component={MoneyTransfer} />}
      </Route>
      <Route path="/transaction-history">
        {() => <ProtectedRoute component={TransactionHistory} />}
      </Route>
      <Route path="/scan-qr">
        {() => <ProtectedRoute component={QRScanner} />}
      </Route>
      <Route path="/receive-qr">
        {() => <ProtectedRoute component={ReceiveQR} />}
      </Route>
      <Route path="/add-money">
        {() => <ProtectedRoute component={AddMoney} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={ProfileSettings} />}
      </Route>
      <Route path="/credit-card">
        {() => <ProtectedRoute component={CreditCardApplication} />}
      </Route>
      <Route path="/train-booking">
        {() => <ProtectedRoute component={TrainBooking} />}
      </Route>
      <Route path="/bus-booking">
        {() => <ProtectedRoute component={BusBooking} />}
      </Route>
      <Route path="/flight-booking">
        {() => <ProtectedRoute component={FlightBooking} />}
      </Route>
      <Route path="/checkout">
        {() => <ProtectedRoute component={Checkout} />}
      </Route>
      <Route path="/all-services">
        {() => <ProtectedRoute component={AllServices} />}
      </Route>
      <Route path="/personal-loan">
        {() => <ProtectedRoute component={PersonalLoan} />}
      </Route>
      <Route path="/personal-loan/application">
        {() => <ProtectedRoute component={PersonalLoanApplication} />}
      </Route>
      <Route path="/personal-loan/approved">
        {() => <ProtectedRoute component={PersonalLoanApproved} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
