import Image from "next/image";
import Link from "next/link";

export interface HeaderProps {
  variant?: "dark" | "light";
}

export const Header = ({ variant = "dark" }: HeaderProps) => {
  return (
    <header
      className={`fixed top-0 left-0 right-0 backdrop-blur-md z-10 ${
        variant === "dark" ? "bg-[#121212]/80" : "bg-white/80"
      }`}
    >
      <div className="px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo_light.png"
            alt="deployable"
            width={32}
            height={32}
          />
          <span className="text-lg font-semibold text-white">deployable</span>
        </Link>

        <nav className="flex gap-6 text-sm text-gray-400">
          <button
            onClick={() => localStorage.clear()}
            className="hover:text-white transition-colors"
          >
            Clear Cache
          </button>
          <a href="#" className="hover:text-white transition-colors">
            Documentation
          </a>
          <a href="#" className="hover:text-white transition-colors">
            GitHub
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
};
