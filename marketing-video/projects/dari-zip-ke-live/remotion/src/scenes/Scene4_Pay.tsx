import React from 'react';
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { PageCam } from '../components/PageCam';
import { Cursor } from '../components/Cursor';
import { THEME } from '../theme';

export const Scene4_Pay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Step progression:
  // Step 1 (frame 0-45): Select package & summary
  // Step 2 (frame 45-90): QRIS payment scan
  // Step 3 (frame 90-140): Proof upload
  // Step 4 (frame 140-204): Team verification
  const currentStep = frame < 45 ? 1 : frame < 90 ? 2 : frame < 140 ? 3 : 4;

  // Camera tracking: horizontal glide
  const camX = interpolate(frame, [0, 60, 140, 204], [0, 80, 220, 280], {
    extrapolateRight: 'clamp',
  });

  // Card deal-in springs
  const card1Spring = spring({ frame: frame - 5, fps, config: { damping: 16 } });
  const card2Spring = spring({ frame: frame - 40, fps, config: { damping: 16 } });
  const card3Spring = spring({ frame: frame - 85, fps, config: { damping: 16 } });
  const card4Spring = spring({ frame: frame - 135, fps, config: { damping: 16 } });

  // Verification status flip at frame 154 (17.47s mark)
  const isVerified = frame >= 154;

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
      <PageCam x={camX} scale={1.0}>
        <div
          style={{
            width: 2400,
            height: 1080,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '180px',
            position: 'relative',
          }}
        >
          {/* Top Step Breadcrumbs Indicator */}
          <div
            style={{
              position: 'absolute',
              top: 70,
              left: 200,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            {[
              { id: 1, label: 'Pilih paket' },
              { id: 2, label: 'Bayar lewat QRIS' },
              { id: 3, label: 'Kirim bukti' },
              { id: 4, label: 'Kami verifikasi' },
            ].map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: currentStep >= s.id ? THEME.colors.accent : '#E4E4E7',
                    color: currentStep >= s.id ? '#FFFFFF' : '#71717A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: THEME.fonts.sans,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {s.id}
                </div>
                <span
                  style={{
                    fontFamily: THEME.fonts.sans,
                    fontSize: 18,
                    fontWeight: currentStep === s.id ? 600 : 400,
                    color: currentStep === s.id ? THEME.colors.textInk : THEME.colors.textSubtle,
                  }}
                >
                  {s.label}
                </span>
                {s.id < 4 && <div style={{ width: 30, height: 1, backgroundColor: '#D4D4D8' }} />}
              </div>
            ))}
          </div>

          {/* Cards Display Row */}
          <div style={{ display: 'flex', gap: '40px', marginTop: '140px' }}>
            {/* Card 1: Order Summary */}
            <div
              style={{
                width: 480,
                backgroundColor: '#FFFFFF',
                borderRadius: THEME.radii.lg,
                boxShadow: THEME.shadows.card,
                border: `1px solid ${THEME.colors.border}`,
                overflow: 'hidden',
                transform: `translateY(${interpolate(card1Spring, [0, 1], [60, 0])}px)`,
                opacity: interpolate(card1Spring, [0, 1], [0, 1]),
              }}
            >
              <div
                style={{
                  padding: '24px 28px',
                  borderBottom: `1px solid ${THEME.colors.border}`,
                  backgroundColor: '#FAFAFA',
                  fontFamily: THEME.fonts.sans,
                  fontWeight: 600,
                  fontSize: 16,
                  color: THEME.colors.textInk,
                }}
              >
                Ringkasan Pesanan Hosting
              </div>
              <img
                src={staticFile('shots/pc_summary_after.png')}
                alt="Order Summary"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* Card 2: QRIS Payment */}
            <div
              style={{
                width: 460,
                backgroundColor: '#FFFFFF',
                borderRadius: THEME.radii.lg,
                boxShadow: THEME.shadows.card,
                border: `1px solid ${THEME.colors.border}`,
                overflow: 'hidden',
                transform: `translateY(${interpolate(card2Spring, [0, 1], [60, 0])}px)`,
                opacity: interpolate(card2Spring, [0, 1], [0, 1]),
              }}
            >
              <div
                style={{
                  padding: '24px 28px',
                  borderBottom: `1px solid ${THEME.colors.border}`,
                  backgroundColor: '#FAFAFA',
                  fontFamily: THEME.fonts.sans,
                  fontWeight: 600,
                  fontSize: 16,
                  color: THEME.colors.textInk,
                }}
              >
                Pembayaran via QRIS
              </div>
              <img
                src={staticFile('shots/pc_qr.png')}
                alt="QRIS Payment"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* Card 3: Upload Bukti Transfer */}
            <div
              style={{
                width: 460,
                backgroundColor: '#FFFFFF',
                borderRadius: THEME.radii.lg,
                boxShadow: THEME.shadows.card,
                border: `1px solid ${THEME.colors.border}`,
                overflow: 'hidden',
                transform: `translateY(${interpolate(card3Spring, [0, 1], [60, 0])}px)`,
                opacity: interpolate(card3Spring, [0, 1], [0, 1]),
              }}
            >
              <div
                style={{
                  padding: '24px 28px',
                  borderBottom: `1px solid ${THEME.colors.border}`,
                  backgroundColor: '#FAFAFA',
                  fontFamily: THEME.fonts.sans,
                  fontWeight: 600,
                  fontSize: 16,
                  color: THEME.colors.textInk,
                }}
              >
                Unggah Bukti Transfer
              </div>
              <img
                src={staticFile('shots/pc_form_after.png')}
                alt="Upload Form"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* Card 4: Verification Status Result */}
            <div
              style={{
                width: 460,
                backgroundColor: '#FFFFFF',
                borderRadius: THEME.radii.lg,
                boxShadow: THEME.shadows.card,
                border: `1px solid ${isVerified ? '#10B981' : THEME.colors.border}`,
                overflow: 'hidden',
                transform: `translateY(${interpolate(card4Spring, [0, 1], [60, 0])}px)`,
                opacity: interpolate(card4Spring, [0, 1], [0, 1]),
                transition: 'border 0.3s ease',
              }}
            >
              <div
                style={{
                  padding: '24px 28px',
                  borderBottom: `1px solid ${THEME.colors.border}`,
                  backgroundColor: isVerified ? 'rgba(16, 185, 129, 0.08)' : '#FAFAFA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontFamily: THEME.fonts.sans,
                    fontWeight: 600,
                    fontSize: 16,
                    color: isVerified ? '#047857' : THEME.colors.textInk,
                  }}
                >
                  {isVerified ? 'Pesanan Terverifikasi' : 'Verifikasi Tim 1sLabs'}
                </span>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: isVerified ? '#10B981' : '#F59E0B',
                  }}
                />
              </div>
              <img
                src={staticFile(isVerified ? 'shots/pay_status_after.png' : 'shots/pay_status_before.png')}
                alt="Status Card"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </PageCam>
    </div>
  );
};
