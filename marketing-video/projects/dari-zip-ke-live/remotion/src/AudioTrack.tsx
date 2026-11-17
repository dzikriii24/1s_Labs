import React from 'react';
import { Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import timeline from './timeline.json';

export const AudioTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dynamic ducking for ambient background music:
  // Ambient plays softly across the entire video, ducking down when voiceover lines are active
  const isVoActive = timeline.vo.some((v) => {
    const startFrame = Math.round(v.start * fps);
    const endFrame = Math.round(v.end * fps);
    return frame >= startFrame && frame <= endFrame;
  });

  const bgmVolume = isVoActive ? 0.08 : 0.22;

  return (
    <>
      {/* Ambient BGM Bed */}
      <Audio
        src={staticFile('audio/ambient_bgm.wav')}
        volume={bgmVolume}
        startFrom={0}
      />

      {/* Voiceover Clips */}
      {timeline.vo.map((v) => {
        const fromFrame = Math.round(v.start * fps);
        return (
          <Sequence key={v.id} from={fromFrame} name={`VO_${v.id}`}>
            <Audio src={staticFile(v.file)} volume={1.0} />
          </Sequence>
        );
      })}

      {/* SFX Cues */}
      {timeline.sfx.map((cue, idx) => {
        const fromFrame = Math.round(cue.t * fps);
        const fileName = cue.sfx.includes('.') ? cue.sfx : `${cue.sfx}.wav`;
        return (
          <Sequence key={`${cue.sfx}_${idx}`} from={fromFrame} name={`SFX_${cue.sfx}`}>
            <Audio src={staticFile(`audio/${fileName}`)} volume={cue.gain} />
          </Sequence>
        );
      })}
    </>
  );
};
