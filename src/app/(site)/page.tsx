import HeroSection from "@/components/home/HeroSection";
import OrderIntro from "@/components/home/OrderIntro";
import OrderFlow from "@/components/home/OrderFlow";

export default function Home() {
  return (
    <div className="flex flex-col gap-8 pt-2">
      <HeroSection />
      <OrderIntro />
      <OrderFlow />
    </div>
  );
}
