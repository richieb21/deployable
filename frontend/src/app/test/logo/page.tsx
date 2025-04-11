"use client";

import { AnimatedLogo } from "@/app/components/ui/AnimatedLogo";

export default function LogoTest() {
  return (
    <div className="min-h-screen bg-black dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white dark:text-white">
          Animated Logo Test
        </h1>
        <div className="bg-black dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-white dark:text-white">
            Animated Logo
          </h2>
          <AnimatedLogo size={200} className="mx-auto" />
        </div>
      </div>
    </div>
  );
}
