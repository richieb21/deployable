import Image from "next/image";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm z-10 border-b border-purple-500/20">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image
            src="/deployable.png"
            alt="deployable"
            width={32}
            height={32}
          />
          <span className="text-lg font-semibold text-purple-200">
            deployable
          </span>
        </div>

        <nav className="flex gap-6 text-sm text-purple-200">
          <a href="#" className="hover:text-purple-400 transition-colors">
            Documentation
          </a>
          <a href="#" className="hover:text-purple-400 transition-colors">
            GitHub
          </a>
          <a href="#" className="hover:text-purple-400 transition-colors">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
};
