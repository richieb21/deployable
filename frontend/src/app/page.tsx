import { Hero } from "./components/Hero";
import { Header } from "./components/Header";
import { Features } from "./components/Features";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-gray-50">
      <Header />
      <Hero />
    </div>
  );
}
