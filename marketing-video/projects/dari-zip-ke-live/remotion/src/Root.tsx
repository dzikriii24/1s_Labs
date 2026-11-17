import React from 'react';
import { Composition } from 'remotion';
import { MainComposition } from './MainComposition';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="MainComposition"
        component={MainComposition}
        durationInFrames={1334}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

