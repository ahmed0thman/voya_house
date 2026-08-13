'use client';

export default function Header() {
  return (
    <header className="site-header opacity-0 fixed top-0 left-0 w-full z-50 px-6 py-8 md:px-12 pointer-events-none mix-blend-difference text-white">
      <div className="flex justify-between items-center w-full pointer-events-auto">
        {/* Minimalist Logo - Uses Outfit (mapped to font-serif) */}
        <div className="font-serif text-2xl tracking-[0.1em] flex flex-col items-start leading-none font-medium">
          VOYA
        </div>
        
        {/* Minimalist Hamburger */}
        <button className="flex flex-col items-end space-y-[4px] p-2 group cursor-pointer">
          <span className="block w-8 h-[2px] bg-white transition-all group-hover:w-10"></span>
          <span className="block w-6 h-[2px] bg-white transition-all group-hover:w-10"></span>
        </button>
      </div>
    </header>
  );
}
