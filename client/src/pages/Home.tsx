import Header from "@/components/Header";
import PromotionSlider from "@/components/PromotionSlider";
import UpiSection from "@/components/UpiSection";
import QuickActions from "@/components/QuickActions";
import RechargesBillsSection from "@/components/RechargesBillsSection";
import DoMoreSection from "@/components/DoMoreSection";
import FreeToolsSection from "@/components/FreeToolsSection";
import OffersSection from "@/components/OffersSection";
import BottomNavigation from "@/components/BottomNavigation";
import BottomQRButton from "@/components/BottomQRButton";

export default function Home() {
  return (
    <div className="max-w-md mx-auto h-screen overflow-y-auto bg-white shadow-lg flex flex-col">
      <Header />
      
      <main className="flex-1 overflow-y-auto pb-20">
        <PromotionSlider />
        <UpiSection />
        <QuickActions />
        <RechargesBillsSection />
        <DoMoreSection />
        <FreeToolsSection />
        <OffersSection />
      </main>

      <BottomQRButton />
      <BottomNavigation />
    </div>
  );
}
