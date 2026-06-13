export default function Loading() {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#09090b]">
      {/* Subtle radial glow in the background */}
      <div className="absolute w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.15)_0%,transparent_70%)] blur-[60px] animate-pulse pointer-events-none" />
      
      {/* Responsive Logo Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* We use clamp to make it responsive: min 64px, max 120px depending on viewport width */}
        <div style={{ width: 'clamp(64px, 15vw, 120px)', height: 'clamp(64px, 15vw, 120px)' }} className="relative animate-pulse">
          <img 
            src="/logo-icon.svg" 
            alt="TokenPe Loading" 
            className="w-full h-full object-contain"
          />
          {/* Shimmer/glow overlay */}
          <div className="absolute inset-0 rounded-full border border-purple-500/20 shadow-[0_0_40px_rgba(139,92,246,0.2)]" />
        </div>
        <div className="mt-6 text-sm font-semibold tracking-[0.2em] text-purple-400/80 uppercase animate-pulse">
          Loading
        </div>
      </div>
    </div>
  )
}
