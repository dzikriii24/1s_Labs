import React from 'react';
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { PageCam } from '../components/PageCam';
import { THEME } from '../theme';

export const Scene6_Files: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase timeline:
  // Phase 1 (frame 0-45): Drag & drop overlay
  // Phase 2 (frame 45-70): Extracted files table
  // Phase 3 (frame 70-146): In-browser editor opens
  const showEditor = frame >= 70;

  // Editor spring entrance
  const editorSpring = spring({
    frame: frame - 70,
    fps,
    config: { damping: 16, stiffness: 140 },
  });

  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: THEME.colors.bgPaper,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <PageCam scale={1.0}>
        <div
          style={{
            width: 1920,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Statement Header */}
          <div
            style={{
              position: 'absolute',
              top: 80,
              left: 240,
              display: 'flex',
              alignItems: 'baseline',
              gap: '20px',
              opacity: showEditor ? 0.2 : 1,
            }}
          >
            <span
              style={{
                fontFamily: THEME.fonts.serif,
                fontSize: 48,
                fontWeight: 600,
                color: THEME.colors.textInk,
                letterSpacing: '-0.02em',
              }}
            >
              {frame < 70 ? 'Unggah ZIP aplikasi.' : 'Edit langsung di browser.'}
            </span>
            <span
              style={{
                fontFamily: THEME.fonts.sans,
                fontSize: 16,
                color: THEME.colors.textMuted,
                backgroundColor: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: THEME.radii.pill,
                border: `1px solid ${THEME.colors.border}`,
              }}
            >
              Automatic Unzip &bull; Monaco Editor &bull; Instant Save
            </span>
          </div>

          {/* Base File Manager Container */}
          <div
            style={{
              position: 'absolute',
              top: 180,
              width: 1440,
              height: 720,
              backgroundColor: '#FFFFFF',
              borderRadius: THEME.radii.lg,
              boxShadow: THEME.shadows.card,
              border: `1px solid ${THEME.colors.border}`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Top Bar */}
            <div
              style={{
                height: 52,
                backgroundColor: '#FAFAFA',
                borderBottom: `1px solid ${THEME.colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
              }}
            >
              <span style={{ fontFamily: THEME.fonts.sans, fontWeight: 600, fontSize: 15, color: THEME.colors.textInk }}>
                File Manager &bull; /var/www/kopisenja-api
              </span>
              <div
                style={{
                  backgroundColor: '#F4F4F6',
                  color: THEME.colors.textInk,
                  fontFamily: THEME.fonts.sans,
                  fontSize: 13,
                  fontWeight: 500,
                  padding: '6px 14px',
                  borderRadius: THEME.radii.pill,
                  border: `1px solid ${THEME.colors.border}`,
                }}
              >
                Upload ZIP Archive
              </div>
            </div>

            {/* Screen snapshot */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <img
                src={staticFile(frame < 45 ? 'shots/detail_files_drag.png' : 'shots/el_files.png')}
                alt="File Manager View"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>

          {/* In-browser Editor Modal Pop */}
          {showEditor && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 1920,
                height: 1080,
                backgroundColor: 'rgba(17, 18, 21, 0.45)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 800,
                opacity: interpolate(editorSpring, [0, 1], [0, 1]),
              }}
            >
              <div
                style={{
                  width: 1280,
                  backgroundColor: '#FFFFFF',
                  borderRadius: THEME.radii.lg,
                  boxShadow: THEME.shadows.modal,
                  border: `1px solid ${THEME.colors.border}`,
                  overflow: 'hidden',
                  transform: `scale(${interpolate(editorSpring, [0, 1], [0.94, 1.0])})`,
                }}
              >
                {/* Native in-browser editor dialog */}
                <img
                  src={staticFile('shots/el_editor.png')}
                  alt="Code Editor"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </div>
          )}
        </div>
      </PageCam>
    </div>
  );
};
