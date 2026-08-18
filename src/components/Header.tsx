'use client';

export default function Header() {
  return (
    <header className="site-header opacity-0 fixed top-0 left-0 w-full z-50 px-6 py-5 md:px-12 pointer-events-none text-white transition-all duration-300">
      <div className="flex justify-between items-center w-full max-w-7xl mx-auto pointer-events-auto">
        {/* Minimalist Logo - Uses Outfit (mapped to font-serif) */}
        <div className="font-serif text-2xl tracking-[0.1em] flex flex-col items-start leading-none font-medium text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          VOYA
        </div>
        
        {/* Minimalist Hamburger */}
        <button 
          aria-label="Menu"
          className="flex flex-col items-end space-y-[5px] p-2 group cursor-pointer"
        >
          <span className="block w-8 h-[2px] bg-white transition-all duration-300 group-hover:w-10 group-hover:bg-[#F1E6C3] shadow-sm"></span>
          <span className="block w-5 h-[2px] bg-white transition-all duration-300 group-hover:w-10 group-hover:bg-[#F1E6C3] shadow-sm"></span>
        </button>
      </div>
    </header>
  );
}
