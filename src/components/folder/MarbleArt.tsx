import React from 'react';

interface MarbleArtProps {
  id?: string;
  className?: string;
}

export const MarbleArt: React.FC<MarbleArtProps> = ({ id = 'marble-1', className = 'w-full h-full' }) => {
  switch (id) {
    case 'marble-2':
      // Rust red, terracotta, teal, and charcoal fluid flows (matching Image 2 "Shoot - Lisbon")
      return (
        <svg className={className} viewBox="0 0 400 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-rust" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e2024" />
              <stop offset="25%" stopColor="#c2410c" />
              <stop offset="55%" stopColor="#ea580c" />
              <stop offset="75%" stopColor="#0f766e" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>
            <filter id="turb-rust" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.015 0.03" numOctaves="4" result="noise" seed="42" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="55" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad-rust)" />
          <g filter="url(#turb-rust)">
            <ellipse cx="200" cy="150" rx="220" ry="140" fill="#f97316" opacity="0.85" />
            <path d="M-20,50 Q100,280 250,90 T420,180" fill="none" stroke="#2dd4bf" strokeWidth="48" opacity="0.6" />
            <path d="M50,-20 Q220,150 180,320" fill="none" stroke="#030712" strokeWidth="64" opacity="0.9" />
            <ellipse cx="280" cy="80" rx="120" ry="70" fill="#fb923c" opacity="0.75" />
          </g>
        </svg>
      );

    case 'marble-3':
      // Ice blue, slate, pearl and dark charcoal (matching Image 3 "My Files")
      return (
        <svg className={className} viewBox="0 0 400 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-ice" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="35%" stopColor="#334155" />
              <stop offset="65%" stopColor="#94a3b8" />
              <stop offset="85%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <filter id="turb-ice" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.018 0.025" numOctaves="4" result="noise" seed="8" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="50" xChannelSelector="R" yChannelSelector="B" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad-ice)" />
          <g filter="url(#turb-ice)">
            <path d="M-50,120 Q150,-30 350,140 T450,280" fill="none" stroke="#f8fafc" strokeWidth="55" opacity="0.9" />
            <path d="M0,260 Q180,110 380,220" fill="none" stroke="#090d16" strokeWidth="60" opacity="0.85" />
            <ellipse cx="140" cy="180" rx="160" ry="90" fill="#64748b" opacity="0.7" />
          </g>
        </svg>
      );

    case 'marble-4':
      // Emerald, obsidian, and golden veins
      return (
        <svg className={className} viewBox="0 0 400 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#022c22" />
              <stop offset="40%" stopColor="#065f46" />
              <stop offset="70%" stopColor="#10b981" />
              <stop offset="90%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
            <filter id="turb-emerald">
              <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="4" result="noise" seed="99" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="48" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad-emerald)" />
          <g filter="url(#turb-emerald)">
            <path d="M-10,30 Q200,220 420,100" fill="none" stroke="#f59e0b" strokeWidth="24" opacity="0.7" />
            <ellipse cx="250" cy="180" rx="180" ry="120" fill="#047857" opacity="0.8" />
            <path d="M50,290 Q180,80 350,270" fill="none" stroke="#022c22" strokeWidth="64" opacity="0.9" />
          </g>
        </svg>
      );

    case 'marble-5':
      // Titanium, carbon fiber, and amber cyber flows
      return (
        <svg className={className} viewBox="0 0 400 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-cyber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="45%" stopColor="#27272a" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
            <filter id="turb-cyber">
              <feTurbulence type="fractalNoise" baseFrequency="0.02 0.04" numOctaves="3" result="noise" seed="17" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="42" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad-cyber)" />
          <g filter="url(#turb-cyber)">
            <path d="M0,80 Q200,280 400,120" fill="none" stroke="#fbbf24" strokeWidth="32" opacity="0.65" />
            <path d="M-40,220 Q160,30 380,240" fill="none" stroke="#18181b" strokeWidth="70" opacity="0.9" />
          </g>
        </svg>
      );

    case 'marble-1':
    default:
      // Deep violet, magenta, copper and obsidian swirl (matching Image 2 "Lookbook 2024")
      return (
        <svg className={className} viewBox="0 0 400 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e102d" />
              <stop offset="30%" stopColor="#581c87" />
              <stop offset="60%" stopColor="#c084fc" />
              <stop offset="85%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#170d24" />
            </linearGradient>
            <filter id="turb-purple" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.015 0.025" numOctaves="4" result="noise" seed="31" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="50" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad-purple)" />
          <g filter="url(#turb-purple)">
            <ellipse cx="180" cy="140" rx="190" ry="110" fill="#a855f7" opacity="0.85" />
            <path d="M-20,80 Q140,290 320,70 T420,200" fill="none" stroke="#fdba74" strokeWidth="44" opacity="0.75" />
            <path d="M20,280 Q190,100 360,260" fill="none" stroke="#170529" strokeWidth="58" opacity="0.9" />
            <ellipse cx="290" cy="90" rx="110" ry="60" fill="#f43f5e" opacity="0.6" />
          </g>
        </svg>
      );
  }
};
