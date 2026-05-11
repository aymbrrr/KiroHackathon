import { motion } from 'motion/react';

interface AxolotlSvgProps {
  mood?: 'happy' | 'thinking' | 'alert' | 'stressed' | 'relieved';
  size?: number;
  animate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Face definitions in 160×128 base coordinate space
const FACES = {
  happy: {
    leftEyeRx: 6, leftEyeRy: 6,
    rightEyeRx: 6, rightEyeRy: 6,
    mouth: 'M 64,80 Q 80,96 96,80',
    leftBrow: null as string | null,
    rightBrow: null as string | null,
  },
  relieved: {
    leftEyeRx: 7, leftEyeRy: 3.5,
    rightEyeRx: 7, rightEyeRy: 3.5,
    mouth: 'M 64,80 Q 80,95 96,80',
    leftBrow: null as string | null,
    rightBrow: null as string | null,
  },
  thinking: {
    leftEyeRx: 6, leftEyeRy: 6,
    rightEyeRx: 7, rightEyeRy: 4,
    mouth: 'M 68,82 Q 80,90 92,82',
    leftBrow: 'M 43,57 Q 53,52 63,55',
    rightBrow: 'M 97,55 Q 107,52 117,57',
  },
  alert: {
    leftEyeRx: 8, leftEyeRy: 8,
    rightEyeRx: 8, rightEyeRy: 8,
    mouth: 'M 73,82 Q 80,91 87,82',
    leftBrow: 'M 42,52 Q 53,48 63,52',
    rightBrow: 'M 97,52 Q 107,48 118,52',
  },
  stressed: {
    leftEyeRx: 6, leftEyeRy: 7,
    rightEyeRx: 6, rightEyeRy: 7,
    mouth: 'M 64,87 Q 80,73 96,87',
    leftBrow: 'M 42,57 Q 53,63 63,57',
    rightBrow: 'M 97,57 Q 107,63 118,57',
  },
};

export function AxolotlSvg({
  mood = 'happy',
  size = 128,
  animate = true,
  className = '',
  style = {},
}: AxolotlSvgProps) {
  const s = size / 128;
  const px = (n: number) => n * s;
  const face = FACES[mood] ?? FACES.happy;

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ height: px(128), width: px(160), flexShrink: 0, ...style }}
      animate={animate ? { y: [0, -5 * s, 0] } : {}}
      transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* ── Left gill fronds ── */}
      <div style={{ position: 'absolute', left: px(3), top: px(36), height: px(64), width: px(80), transform: 'rotate(-12deg)', borderRadius: '50%', background: '#ffa8a8', opacity: 0.7, filter: 'blur(1px)' }} />
      <div style={{ position: 'absolute', left: 0, top: px(48), height: px(20), width: px(64), borderRadius: 9999, background: '#ff9e9e' }} />
      <div style={{ position: 'absolute', left: px(4), top: px(28), height: px(20), width: px(64), borderRadius: 9999, background: '#ffabab', transform: 'rotate(-24deg)' }} />
      <div style={{ position: 'absolute', left: px(12), top: px(70), height: px(20), width: px(56), borderRadius: 9999, background: '#ffabab', transform: 'rotate(18deg)' }} />

      {/* ── Right gill fronds ── */}
      <div style={{ position: 'absolute', right: px(3), top: px(36), height: px(64), width: px(80), transform: 'rotate(12deg)', borderRadius: '50%', background: '#ffa8a8', opacity: 0.7, filter: 'blur(1px)' }} />
      <div style={{ position: 'absolute', right: 0, top: px(48), height: px(20), width: px(64), borderRadius: 9999, background: '#ff9e9e' }} />
      <div style={{ position: 'absolute', right: px(4), top: px(28), height: px(20), width: px(64), borderRadius: 9999, background: '#ffabab', transform: 'rotate(24deg)' }} />
      <div style={{ position: 'absolute', right: px(12), top: px(70), height: px(20), width: px(56), borderRadius: 9999, background: '#ffabab', transform: 'rotate(-18deg)' }} />

      {/* ── Main body ── */}
      <div style={{
        position: 'absolute', left: '50%', top: px(24),
        height: px(88), width: px(112),
        transform: 'translateX(-50%)',
        borderRadius: '48%',
        border: '2px solid rgba(126,74,74,0.28)',
        background: 'linear-gradient(160deg, #ffe3de 0%, #ffc8c0 100%)',
        boxShadow: 'inset 0 -10px 18px rgba(255,148,148,0.2)',
      }} />

      {/* ── Belly ── */}
      <div style={{
        position: 'absolute', bottom: px(4), left: '50%',
        height: px(40), width: px(96),
        transform: 'translateX(-50%)',
        borderRadius: '50%',
        background: '#ffc4bd',
      }} />

      {/* ── SVG face overlay (two distinct face styles per mood) ── */}
      <svg
        style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
        width={px(160)}
        height={px(128)}
        viewBox="0 0 160 128"
      >
        {/* Left eye */}
        <ellipse cx="53" cy="64" rx={face.leftEyeRx} ry={face.leftEyeRy} fill="#3d2425" />
        <circle cx="50" cy="61" r="2.2" fill="white" opacity="0.9" />

        {/* Right eye */}
        <ellipse cx="107" cy="64" rx={face.rightEyeRx} ry={face.rightEyeRy} fill="#3d2425" />
        <circle cx="110" cy="61" r="2.2" fill="white" opacity="0.9" />

        {/* Eyebrows (mood-specific, face style 2 = stressed/alert have them) */}
        {face.leftBrow && (
          <path d={face.leftBrow} fill="none" stroke="#3d2425" strokeWidth="2.8" strokeLinecap="round" />
        )}
        {face.rightBrow && (
          <path d={face.rightBrow} fill="none" stroke="#3d2425" strokeWidth="2.8" strokeLinecap="round" />
        )}

        {/* Nose */}
        <circle cx="80" cy="74" r="2.5" fill="rgba(61,36,37,0.35)" />

        {/* Mouth */}
        <path d={face.mouth} fill="none" stroke="#3d2425" strokeWidth="2.8" strokeLinecap="round" />

        {/* Cheek blushes */}
        <ellipse cx="42" cy="77" rx="11" ry="6.5" fill="#ff7a70" opacity="0.55" />
        <ellipse cx="118" cy="77" rx="11" ry="6.5" fill="#ff7a70" opacity="0.55" />
      </svg>
    </motion.div>
  );
}