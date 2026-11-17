import React from 'react';

interface PageCamProps {
  x?: number;
  y?: number;
  scale?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  originX?: string;
  originY?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const PageCam: React.FC<PageCamProps> = ({
  x = 0,
  y = 0,
  scale = 1,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  originX = '50%',
  originY = '50%',
  children,
  style = {},
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        perspective: '1400px',
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: `${originX} ${originY}`,
          transform: `translate3d(${-x}px, ${-y}px, 0px) scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
};

