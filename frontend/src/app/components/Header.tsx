import Image from "next/image";
import Link from "next/link";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-[#121212]/80 backdrop-blur-md z-10">
      <div className="px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/deployable.png"
            alt="deployable"
            width={32}
            height={32}
          />
          <span className="text-lg font-semibold text-white">deployable</span>
        </Link>

        <nav className="flex gap-6 text-sm text-gray-400">
          <a
            href="#"
            className="hover:text-white transition-colors"
          >
            Documentation
          </a>
          <a
            href="#"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a
            href="#"
            className="hover:text-white transition-colors"
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
};
