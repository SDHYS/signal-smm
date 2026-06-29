import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import HeroSection from "@/components/home/HeroSection";
import OrderIntro from "@/components/home/OrderIntro";
import OrderFlow from "@/components/home/OrderFlow";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto flex w-full max-w-[1380px] flex-col gap-8 px-4 pb-24 sm:px-8">
          <HeroSection />
          <OrderIntro />
          <OrderFlow />
        </main>
      </div>
    </div>
  );
}
