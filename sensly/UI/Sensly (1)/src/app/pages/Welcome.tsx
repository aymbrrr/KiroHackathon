import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { AxolotlSvg } from '../components/AxolotlSvg';

interface WelcomeProps {
  onGetStarted: () => void;
}

const STORY = [
  {
    mood: 'stressed' as const,
    bg: 'linear-gradient(160deg, #1A4D55 0%, #2A6B76 100%)',
    textColor: 'rgba(255,255,255,0.92)',
    subColor: 'rgba(255,255,255,0.55)',
    title: 'Some days feel like too much.',
    sub: 'The noise. The lights. The chaos.',
  },
  {
    mood: 'thinking' as const,
    bg: 'linear-gradient(160deg, #2A7A85 0%, #3A9EA5 100%)',
    textColor: 'rgba(255,255,255,0.92)',
    subColor: 'rgba(255,255,255,0.6)',
    title: 'Sensly watches quietly for you.',
    sub: "Learning what feels safe, before it\u2019s too late.",
  },
  {
    mood: 'happy' as const,
    bg: 'linear-gradient(160deg, #DFF6F7 0%, #B8E5EA 50%, #C8EEF2 100%)',
    textColor: '#1A4D55',
    subColor: '#4A8A96',
    title: 'Your calm companion.',
    sub: 'Monitor · Predict · Prevent',
    cta: true,
  },
];

export function Welcome({ onGetStarted }: WelcomeProps) {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  // Auto-advance first two slides
  useEffect(() => {
    if (slide < 2) {
      const timer = setTimeout(() => setSlide((s) => s + 1), 2800);
      return () => clearTimeout(timer);
    }
  }, [slide]);

  const current = STORY[slide];

  const handleBegin = () => {
    onGetStarted();
    navigate('/onboarding');
  };

  return (
    <div
      className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center cursor-pointer"
      style={{ background: current.bg, transition: 'background 0.8s ease' }}
      onClick={() => { if (slide < 2) setSlide((s) => Math.min(s + 1, 2)); }}
    >
      {/* Grain texture */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.035 }}>
        <filter id="wg">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#wg)" />
      </svg>

      {/* Slide dots */}
      <div className="absolute top-14 left-0 right-0 flex justify-center gap-2 z-20">
        {STORY.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === slide ? 18 : 6,
              height: 6,
              borderRadius: 9999,
              background: slide === 2 ? (i === slide ? '#1A5060' : 'rgba(30,80,100,0.25)') : (i === slide ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)'),
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={slide}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="flex flex-col items-center px-8 text-center z-10"
        >
          {/* Axolotl */}
          <AxolotlSvg mood={current.mood} size={slide === 0 ? 110 : slide === 1 ? 120 : 130} animate />

          <div style={{ height: 28 }} />

          {/* Title */}
          <h2
            style={{
              fontFamily: 'Fredoka, sans-serif',
              color: current.textColor,
              fontSize: '26px',
              fontWeight: 600,
              lineHeight: 1.25,
              marginBottom: '10px',
              maxWidth: '260px',
            }}
          >
            {current.title}
          </h2>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: 'Fredoka, sans-serif',
              color: current.subColor,
              fontSize: '15px',
              lineHeight: 1.5,
              maxWidth: '220px',
            }}
          >
            {current.sub}
          </p>

          {/* CTA on final slide */}
          {current.cta && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col items-center gap-4 mt-10"
            >
              <button
                onClick={(e) => { e.stopPropagation(); handleBegin(); }}
                style={{
                  background: 'linear-gradient(135deg, #2A8A96 0%, #3AACB2 100%)',
                  color: 'white',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  padding: '14px 48px',
                  borderRadius: 9999,
                  boxShadow: '0 8px 24px rgba(42,138,150,0.35)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Begin
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onGetStarted(); navigate('/app'); }}
                style={{
                  color: '#4A8A96',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '13px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: 0.7,
                }}
              >
                Already using Sensly? Continue →
              </button>
            </motion.div>
          )}

          {/* "Tap to continue" hint on first two slides */}
          {!current.cta && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ delay: 1.5, duration: 1.2, repeat: Infinity }}
              style={{
                marginTop: 32,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: slide < 2 ? 'rgba(255,255,255,0.4)' : 'rgba(30,80,100,0.4)',
              }}
            >
              tap to continue
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}