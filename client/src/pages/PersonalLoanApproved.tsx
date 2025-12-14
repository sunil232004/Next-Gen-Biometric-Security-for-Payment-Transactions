import { ArrowLeft, Share2, Download, Calendar, CheckCircle } from "lucide-react";
import { useSafeNavigation } from "@/hooks/use-safe-navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

export default function PersonalLoanApproved() {
  const [, navigate] = useSafeNavigation();
  const { toast } = useToast();
  const [currentDate] = useState(new Date());
  const [dueDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  });
  
  // Loan details
  const [loanDetails] = useState({
    loanAmount: 450000, // ₹4.5 Lakhs
    interestRate: 10.5, // 10.5% per annum
    tenureMonths: 36, // 3 years
    processingFee: 4500, // 1% of loan amount
    disbursedAmount: 445500, // Loan amount - processing fee
    emi: 14632, // Monthly EMI calculated based on loan amount, interest rate and tenure
    totalInterest: 76752, // Total interest over entire loan tenure
    totalRepayment: 526752, // Total amount to be repaid (principal + interest)
    loanId: "PTMPL" + Math.floor(10000000 + Math.random() * 90000000),
    approvalDate: currentDate,
    firstEmiDate: dueDate
  });

  const handleBackClick = () => {
    navigate("/");
  };

  const handleShareReceipt = () => {
    toast({
      title: "Share Receipt",
      description: "Sharing functionality will be implemented soon."
    });
  };

  const handleDownloadReceipt = () => {
    toast({
      title: "Download Receipt",
      description: "Receipt has been downloaded successfully."
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-20">
      <div className="bg-white p-4 flex items-center justify-between shadow-sm">
        <button onClick={handleBackClick} className="focus:outline-none">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-center flex-1">Loan Approved</h1>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleShareReceipt}
            className="focus:outline-none"
          >
            <Share2 className="h-5 w-5 text-gray-600" />
          </button>
          <button 
            onClick={handleDownloadReceipt}
            className="focus:outline-none"
          >
            <Download className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-lg overflow-hidden shadow-md">
          {/* Header section with logo and approved status */}
          <div className="bg-[#00baf2] p-4 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Personal Loan</h2>
              <p className="text-sm opacity-90">Loan ID: {loanDetails.loanId}</p>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 mr-1 text-green-300" />
              <span className="font-semibold">Approved</span>
            </div>
          </div>

          {/* Main receipt content */}
          <div className="p-4">
            {/* Amount section */}
            <div className="mb-6">
              <h3 className="text-sm text-gray-500 font-medium">Loan Amount</h3>
              <div className="flex items-center mt-1">
                <span className="text-2xl font-bold">{formatCurrency(loanDetails.loanAmount)}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            {/* Loan details section */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <h4 className="text-sm text-gray-500">Interest Rate</h4>
                  <p className="font-semibold">{loanDetails.interestRate}% p.a.</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500">Tenure</h4>
                  <p className="font-semibold">{loanDetails.tenureMonths} months</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500">Processing Fee</h4>
                  <p className="font-semibold">{formatCurrency(loanDetails.processingFee)}</p>
                </div>
              </div>

              <div className="flex justify-between">
                <div>
                  <h4 className="text-sm text-gray-500">Disbursed Amount</h4>
                  <p className="font-semibold">{formatCurrency(loanDetails.disbursedAmount)}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500">Monthly EMI</h4>
                  <p className="font-semibold">{formatCurrency(loanDetails.emi)}</p>
                </div>
              </div>

              <div className="flex justify-between">
                <div>
                  <h4 className="text-sm text-gray-500">Total Interest</h4>
                  <p className="font-semibold">{formatCurrency(loanDetails.totalInterest)}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500">Total Repayment</h4>
                  <p className="font-semibold">{formatCurrency(loanDetails.totalRepayment)}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            {/* Important dates */}
            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <h4 className="text-sm text-gray-500">Approved On</h4>
                  <p className="font-semibold">{formatDate(loanDetails.approvalDate)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <h4 className="text-sm text-gray-500">First EMI Due Date</h4>
                  <p className="font-semibold">{formatDate(loanDetails.firstEmiDate)}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            {/* Lender information */}
            <div className="mb-4">
              <h3 className="text-sm text-gray-500 font-medium">Lending Partner</h3>
              <p className="font-semibold">HDFC Bank Ltd.</p>
              <p className="text-xs text-gray-500 mt-1">
                Your loan will be processed and disbursed by HDFC Bank Ltd. under the terms and conditions agreed upon.
              </p>
            </div>

            {/* Footer note */}
            <div className="mt-6 bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Note:</span> The loan amount will be credited to your registered bank account within 24 hours. Please ensure your KYC is complete and up to date.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 space-y-3">
          <button 
            className="w-full bg-[#00baf2] text-white py-3 rounded-md font-semibold"
            onClick={() => {
              toast({
                title: "Loan Agreement",
                description: "Loan agreement has been sent to your registered email."
              });
            }}
          >
            View Loan Agreement
          </button>
          
          <button 
            className="w-full border border-[#00baf2] text-[#00baf2] py-3 rounded-md font-semibold"
            onClick={() => navigate("/")}
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}