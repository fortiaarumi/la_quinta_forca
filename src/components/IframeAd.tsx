'use client';

interface IframeAdProps {
  width: number;
  height: number;
  src: string;
  className?: string;
}

export default function IframeAd({ width, height, src, className = "" }: IframeAdProps) {
  return (
    <div 
      className={`relative flex items-center justify-center bg-[#0c101d]/50 border border-white/10 rounded-xl overflow-hidden shadow-2xl ${className}`}
      style={{ width, height, minWidth: width, minHeight: height }}
    >
      <iframe
        src={src}
        width={width}
        height={height}
        frameBorder="0"
        scrolling="no"
        title="Advertisement"
        className="relative z-10 bg-transparent"
      />
      {/* Placeholder de fons que queda tapat quan l'iframe carrega */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-0 pointer-events-none">
        <span className="text-2xl mb-2 opacity-20">📢</span>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-tight">Publicitat</p>
      </div>
    </div>
  );
}
