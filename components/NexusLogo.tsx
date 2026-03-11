import React from 'react';

export default function NexusLogo({ size = 48, className = "" }: { size?: number, className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="nexusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id="orbGradient">
            <stop offset="0%" style={{ stopColor: '#fff', stopOpacity: 1 }} />
            <stop offset="40%" style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: 'transparent', stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        
        {/* The 'N' with circuitry style */}
        <path 
          d="M25 75V25H35L65 75H75V25" 
          stroke="url(#nexusGradient)" 
          strokeWidth="8" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Circuit nodes */}
        <circle cx="25" cy="25" r="4" fill="url(#nexusGradient)" />
        <circle cx="25" cy="75" r="4" fill="url(#nexusGradient)" />
        <circle cx="75" cy="25" r="4" fill="url(#nexusGradient)" />
        <circle cx="75" cy="75" r="4" fill="url(#nexusGradient)" />
        
        {/* Central Orb */}
        <circle cx="50" cy="50" r="15" fill="url(#orbGradient)" className="animate-pulse" />
        <circle cx="50" cy="50" r="6" fill="#fff" />
      </svg>
    </div>
  );
}
