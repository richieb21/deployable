import { Hero } from "./Hero";
import { Header } from "@/app/components/shared/Header";
import { Footer } from "@/app/components/shared/Footer";
import { Features } from "@/app/components/landing/Features";

export const HomeContent = () => {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
        backgroundImage: "var(--bg-gradient)",
      }}
    >
      <Header />
      <main className="flex-grow">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
};
