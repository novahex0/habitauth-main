import React from 'react';

/**
 * AnimatedDarkWaves - Pure code (SVG + CSS) animated wave background
 * Recreates the exact dark obsidian gradient and multi-layered fluid waves
 * from the user reference without any PNG or external raster images.
 */
export default function AnimatedDarkWaves() {
  return (
    <div className="landing-pure-waves" aria-hidden="true">
      {/* Wave Layer 1 (Back wave - slowest, subtle dark blue/charcoal depth) */}
      <svg
        className="pure-wave-svg wave-layer-1"
        viewBox="0 0 2880 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0,130 C360,70 720,190 1080,130 C1440,70 1800,190 2160,130 C2520,70 2880,190 2880,360 L0,360 Z"
          fill="rgba(22, 26, 38, 0.55)"
        />
      </svg>

      {/* Wave Layer 2 (Mid wave - reverse oscillation, rich obsidian body) */}
      <svg
        className="pure-wave-svg wave-layer-2"
        viewBox="0 0 2880 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0,175 C420,115 840,235 1260,175 C1680,115 2100,235 2520,175 C2700,145 2880,205 2880,360 L0,360 Z"
          fill="rgba(14, 17, 24, 0.82)"
        />
      </svg>

      {/* Wave Layer 3 (Front wave - fastest smooth roll, deepest black with subtle illuminated crest) */}
      <svg
        className="pure-wave-svg wave-layer-3"
        viewBox="0 0 2880 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0,220 C480,160 960,280 1440,220 C1920,160 2400,280 2880,220 L2880,360 L0,360 Z"
          fill="#07080b"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
}
