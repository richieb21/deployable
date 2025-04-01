import { Hero } from "./components/Hero";
import { Header } from "./components/Header";
import { Features } from "./components/Features";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FFFAF5] dark:bg-[#1A1817] text-gray-900 dark:text-gray-50">
      <Header />
      <Hero />
      <Features />
    </div>
  );
}
