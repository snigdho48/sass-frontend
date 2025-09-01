import React from 'react';
import { Droplets } from 'lucide-react';

// Water-themed loading overlay with animated waves (SVG) and bouncing droplet
// Positioned absolutely within the nearest relative container
// Keep z-index lower than header/sidebar (e.g., z-40) so they stay above
const LoadingOverlay = ({ show = false, zIndexClass = 'z-40' }) => {
  if (!show) return null;
  return (
    <div className={`absolute inset-0 ${zIndexClass} flex items-center justify-center bg-white/70`}>
      <div className="flex flex-col items-center justify-center select-none">
        <Droplets className="w-8 h-8 text-blue-600 mb-4 animate-bounce" />
        <div className="relative w-24 h-24">
          <svg
            viewBox="0 0 200 200"
            width="96"
            height="96"
            className="drop-shadow-md"
          >
            <defs>
              <clipPath id="circleClip">
                <circle cx="100" cy="100" r="90" />
              </clipPath>
              <linearGradient id="waterGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>

            <g clipPath="url(#circleClip)">
              <circle cx="100" cy="100" r="90" fill="#eff6ff" />

              {/* Back wave */}
              <path id="wave1" fill="url(#waterGrad)" opacity="0.6"
                d="M0 120 C 30 110, 70 130, 100 120 C 130 110, 170 130, 200 120 L 200 220 L 0 220 Z" >
                <animateTransform attributeName="transform" type="translate" from="0 0" to="-200 0" dur="4s" repeatCount="indefinite" />
              </path>

              {/* Front wave */}
              <path id="wave2" fill="url(#waterGrad)" opacity="0.9"
                d="M0 130 C 25 140, 75 120, 100 130 C 125 140, 175 120, 200 130 L 200 220 L 0 220 Z" >
                <animateTransform attributeName="transform" type="translate" from="0 0" to="-200 0" dur="2.8s" repeatCount="indefinite" />
              </path>
            </g>

            {/* Circle border */}
            <circle cx="100" cy="100" r="90" fill="none" stroke="#60a5fa" strokeWidth="4" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;


