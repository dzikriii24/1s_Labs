import React from 'react';
import { staticFile, useCurrentFrame } from 'remotion';

interface GrainOverlayProps {
  opacity?: number;
}

export const GrainOverlay: React.FC<GrainOverlayProps> = ({ opacity = 0.045 }) => {
  const frame = useCurrentFrame();
  // Jitter the background position slightly every frame to simulate organic analog 35mm grain
  const shiftX = (frame % 4) * 64;
  const shiftY = ((frame * 3) % 4) * 64;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 900,
        opacity,
        backgroundImage: `url(${staticFile('img/grain.png')})`,
        backgroundRepeat: 'repeat',
        backgroundPosition: `${shiftX}px ${shiftY}px`,
        mixBlendMode: 'multiply',
      }}
    />
  );
};

