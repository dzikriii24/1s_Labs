import React from 'react';
import { Sequence } from 'remotion';
import { Scene1_Hook } from './scenes/Scene1_Hook';
import { Scene2_Gap } from './scenes/Scene2_Gap';
import { Scene3_Brand } from './scenes/Scene3_Brand';
import { Scene4_Pay } from './scenes/Scene4_Pay';
import { Scene5_Portal } from './scenes/Scene5_Portal';
import { Scene6_Files } from './scenes/Scene6_Files';
import { Scene7_Tabs } from './scenes/Scene7_Tabs';
import { Scene8_CTA } from './scenes/Scene8_CTA';
import { GrainOverlay } from './components/GrainOverlay';
import { Vignette } from './components/Vignette';
import { PaperWipe } from './components/PaperWipe';
import { AudioTrack } from './AudioTrack';

export const MainComposition: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: 1920,
        height: 1080,
        backgroundColor: '#F4F4F6',
        overflow: 'hidden',
      }}
    >
      {/* 8 Sequenced Scenes */}
      <Sequence from={0} durationInFrames={113} name="Scene1_Hook">
        <Scene1_Hook />
      </Sequence>

      <Sequence from={112} durationInFrames={159} name="Scene2_Gap">
        <Scene2_Gap />
      </Sequence>

      <Sequence from={271} durationInFrames={99} name="Scene3_Brand">
        <Scene3_Brand />
      </Sequence>

      <Sequence from={370} durationInFrames={204} name="Scene4_Pay">
        <Scene4_Pay />
      </Sequence>

      <Sequence from={574} durationInFrames={260} name="Scene5_Portal">
        <Scene5_Portal />
      </Sequence>

      <Sequence from={834} durationInFrames={146} name="Scene6_Files">
        <Scene6_Files />
      </Sequence>

      <Sequence from={980} durationInFrames={204} name="Scene7_Tabs">
        <Scene7_Tabs />
      </Sequence>

      <Sequence from={1184} durationInFrames={150} name="Scene8_CTA">
        <Scene8_CTA />
      </Sequence>

      {/* Cinematic Paper Transitions */}
      <PaperWipe startFrame={262} durationInFrames={18} direction="left-to-right" />
      <PaperWipe startFrame={361} durationInFrames={18} direction="right-to-left" />
      <PaperWipe startFrame={1175} durationInFrames={18} direction="left-to-right" />

      {/* Atmospheric Overlays */}
      <GrainOverlay opacity={0.04} />
      <Vignette intensity={0.16} />

      {/* Synchronized Master Audio */}
      <AudioTrack />
    </div>
  );
};

