'use client';

const GoldButton = ({ onClick, children, className = "", disabled = false, pulse = false }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`relative group overflow-hidden px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 active:scale-95 disabled:opacity-50
      ${pulse ? 'animate-gold-pulse' : ''}
      bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700 
      text-black shadow-[0_10px_40px_rgba(212,175,55,0.3)]
      hover:shadow-[0_15px_50px_rgba(212,175,55,0.5)] hover:-translate-y-1
      ${className}`}
  >
    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
    <span className="relative z-10 flex items-center justify-center gap-3">{children}</span>
  </button>
);

export default GoldButton;
