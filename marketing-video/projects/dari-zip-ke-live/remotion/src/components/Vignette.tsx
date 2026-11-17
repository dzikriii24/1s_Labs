import React from 'react';

interface VignetteProps {
  intensity?: number;
}

export const Vignette: React.FC<VignetteProps> = ({ intensity = 0.22 }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 890,
        background: `radial-gradient(circle at 50% 50%, transparent 60%, rgba(0, 0, 0, ${intensity}) 100%)`,
      }}
    />
  );
};

