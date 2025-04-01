import Image from "next/image";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-[#FFFAF5]/80 dark:bg-[#1A1817]/80 backdrop-blur-sm z-10">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image
            src="/deployable.png"
            alt="deployable"
            width={32}
            height={32}
          />
          <span className="text-lg font-semibold">deployable</span>
        </div>

        <nav className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
          <a
            href="#"
            className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Documentation
          </a>
          <a
            href="#"
            className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            GitHub
          </a>
          <a
            href="#"
            className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
};
