'use client';

interface IframeAdProps {
  width: number;
  height: number;
  htmlContent: string;
  className?: string;
}

export default function IframeAd({ width, height, htmlContent, className = "" }: IframeAdProps) {
  return (
    <div 
      className={`relative flex items-center justify-center bg-[#0c101d]/50 border border-white/10 rounded-xl overflow-hidden shadow-2xl group ${className}`}
      style={{ width, height, minWidth: width, minHeight: height }}
    >
      {/* Placeholder de fons */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-0 pointer-events-none">
        <span className="text-2xl mb-2 opacity-20">📢</span>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-tight">Publicitat</p>
      </div>

      {/* Iframe aïllat per carregar el script de Adsterra */}
      <iframe
        srcDoc={`
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { 
                  margin: 0; 
                  padding: 0; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  background: transparent; 
                  overflow: hidden;
                  height: 100vh;
                  width: 100vw;
                }
              </style>
            </head>
            <body>
              <div id="ad-container">
                ${htmlContent}
              </div>
            </body>
          </html>
        `}
        width={width}
        height={height}
        frameBorder="0"
        scrolling="no"
        className="relative z-10 bg-transparent"
        title="Publicitat La Quinta Forca"
      />
    </div>
  );
}
