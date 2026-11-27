import React from 'react';

interface KrenoLogoProps {
  className?: string;
}

export function KrenoLogo({ className = 'w-10 h-10' }: KrenoLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-label="Logo Kreno"
    >
      <defs>
        <linearGradient id="krenoLogoBg" x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="55%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#krenoLogoBg)" />
      <circle cx="32" cy="32" r="20" stroke="white" strokeOpacity="0.28" strokeWidth="2.5" />
      <path d="M22 18V46" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
      <path
        d="M42 19L26 32L43 45"
        stroke="white"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="44" cy="19" r="3.5" fill="#34D399" />
    </svg>
  );
}
