import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Sun, Lightbulb, Mic, Moon, Cloud } from 'lucide-react';
import { AxolotlSvg } from '../components/AxolotlSvg';

interface OnboardingProps {
  onComplete: (profile: any) => void;
}

// ── Noise reference tone (plays on each slider change) ─────────────────────
function playNoiseTone(sensitivity: number) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();

    // High sensitivity (low value) = quiet soft tone; low sensitivity (high value) = louder
    const volume = 0.015 + (sensitivity / 100) * 0.055;
    // Frequency represents "busyness" of environment
    const baseFreq = 140 + (1 - sensitivity / 100) * 200;

    const notes = [baseFreq, baseFreq * 1.5, baseFreq * 2];
    const dur = 0.65;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * (i === 0 ? 1 : 0.3), ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.04);
      osc.stop(ctx.currentTime + dur + 0.1);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch (_) { /* silent fail */ }
}

// ── Real thermometer SVG ───────────────────────────────────────────────────
function Thermometer({ value }: { value: number }) {
  const tubeH = 118;
  const tubeTop = 14;
  const fillH = tubeH * (value / 100);
  const fillY = tubeTop + (tubeH - fillH);

  // Interpolate hue: 210 (blue) → 0 (red) as value goes 0→100
  const hue = Math.round(210 * (1 - value / 100));
  const sat = value < 15 ? 75 : 82;
  const lit = value < 15 ? 65 : value > 85 ? 60 : 64;
  const fillColor = `hsl(${hue}, ${sat}%, ${lit}%)`;
  const borderColor = `hsl(${hue}, ${sat - 10}%, ${lit - 12}%)`;

  return (
    <svg width="64" height="196" viewBox="0 0 64 196" fill="none">
      <rect x="22" y={tubeTop} width="20" height={tubeH} rx="10" fill="white" stroke={borderColor} strokeWidth="2.5" strokeOpacity="0.5" />
      <circle cx="32" cy="152" r="22" fill="white" stroke={borderColor} strokeWidth="2.5" strokeOpacity="0.5" />
      <clipPath id="thermoClip">
        <rect x="25" y={tubeTop + 2} width="14" height={tubeH - 4} rx="7" />
      </clipPath>
      <rect x="25" y={fillY} width="14" height={fillH} rx="0" fill={fillColor} clipPath="url(#thermoClip)" />
      <rect x="25" y={tubeTop + tubeH - 6} width="14" height="14" fill={fillColor} />
      <circle cx="32" cy="152" r="19" fill={fillColor} />
      <circle cx="26" cy="146" r="5" fill="white" opacity="0.35" />
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const y = tubeTop + tubeH * (1 - frac);
        const long = i % 2 === 0;
        return (
          <line key={i} x1="42" y1={y} x2={long ? 52 : 47} y2={y} stroke={borderColor} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
        );
      })}
      <rect x="26" y={tubeTop + 4} width="4" height={tubeH - 8} rx="2" fill="white" opacity="0.35" />
    </svg>
  );
}

// ── Outside-light axolotl scene ────────────────────────────────────────────
function OutdoorScene({ level }: { level: number }) {
  const scenes = [
    { bg: 'linear-gradient(180deg, #0D1830 0%, #1A2540 60%, #2A3560 100%)', mood: 'thinking' as const },
    { bg: 'linear-gradient(180deg, #6A8FAD 0%, #8BA8C0 50%, #A8C4D8 100%)', mood: 'happy' as const },
    { bg: 'linear-gradient(180deg, #7BC4E8 0%, #A8D8F0 50%, #C8EAF8 100%)', mood: 'happy' as const },
  ];
  const sc = scenes[level];

  return (
    <div className="relative flex flex-col items-end justify-end" style={{ width: '100%', height: 200, borderRadius: 20, overflow: 'hidden' }}>
      {/* Sky background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: sc.bg,
        transition: 'background 0.6s ease',
      }} />

      {/* Stars (night) */}
      {level === 0 && [
        [20, 18], [45, 10], [70, 22], [100, 8], [130, 15], [145, 30], [110, 35],
        [55, 40], [85, 28], [160, 20], [175, 42], [30, 45],
      ].map(([x, y], i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
          style={{ position: 'absolute', left: x, top: y, width: 3, height: 3, borderRadius: '50%', background: 'white' }}
        />
      ))}

      {/* Moon (night) */}
      {level === 0 && (
        <div style={{ position: 'absolute', top: 14, right: 18 }}>
          <Moon size={32} color="#D0D8F0" strokeWidth={2} />
        </div>
      )}

      {/* Cloud (overcast) */}
      {level === 1 && (
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <Cloud size={36} color="rgba(255,255,255,0.75)" />
        </div>
      )}

      {/* Sun (sunny) */}
      {level === 2 && (
        <motion.div
          style={{ position: 'absolute', top: 14, right: 14 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        >
          <Sun size={36} color="#F5D060" strokeWidth={2} />
        </motion.div>
      )}

      {/* Axolotl centered in sky */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AxolotlSvg mood={sc.mood} size={100} animate />
      </div>
    </div>
  );
}

// ── Progress dots ──────────────────────────────────────────────────────────
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 16 : 6, height: 6,
          borderRadius: 9999,
          background: i <= current ? '#3AACB2' : 'rgba(58,172,178,0.2)',
          transition: 'all 0.3s ease',
        }} />
      ))}
    </div>
  );
}

// ── Noise sensitivity visual icon ──────────────────────────────────────────
function NoiseBars({ level }: { level: number }) {
  const bars = [0.3, 0.55, 0.75, 0.9, 1.0];
  const activeCount = Math.ceil((level / 100) * 5);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 64 }}>
      {bars.map((h, i) => (
        <motion.div
          key={i}
          animate={level > 70 && i >= 3 ? { scaleY: [1, 1.15, 1] } : { scaleY: 1 }}
          transition={{ duration: 0.5, repeat: level > 70 ? Infinity : 0, delay: i * 0.08 }}
          style={{
            width: 14,
            height: `${h * 100}%`,
            borderRadius: 6,
            background: i < activeCount ? (level > 75 ? '#FF8A8A' : '#3AACB2') : 'rgba(58,172,178,0.2)',
            transition: 'background 0.3s',
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function Onboarding({ onComplete }: OnboardingProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<'caregiver' | 'user' | null>(null);
  const [noise, setNoise] = useState(50);
  const [temperature, setTemperature] = useState(50);
  const [stims, setStims] = useState(50);
  const [insideLight, setInsideLight] = useState(50);
  const [outsideLight, setOutsideLight] = useState(1);
  const noiseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const TOTAL_STEPS = 8;

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      onComplete({ role, noise, temperature, stims, insideLight, outsideLight });
      navigate('/app');
    }
  };

  const handleBack = () => { if (step > 0) setStep(step - 1); };

  // Debounced noise tone: plays a short reference tone on each slider change
  const handleNoiseChange = (val: number) => {
    setNoise(val);
    if (noiseTimerRef.current) clearTimeout(noiseTimerRef.current);
    noiseTimerRef.current = setTimeout(() => {
      playNoiseTone(val);
    }, 120);
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(100,170,190,0.4)',
    borderRadius: 24,
    boxShadow: '0 4px 20px rgba(30,90,120,0.08)',
    padding: '24px',
    width: '100%',
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden" style={{
      background: 'radial-gradient(circle at 22% 18%, rgba(180,235,245,0.7), transparent 28%), radial-gradient(circle at 80% 62%, rgba(75,177,190,0.25), transparent 26%), linear-gradient(180deg, #F8FEFC 0%, #DFF6F7 50%, #BDE6ED 100%)',
    }}>
      {/* Dot pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1.5px)',
        backgroundSize: '28px 28px',
        opacity: 0.35,
      }} />

      {/* Back button */}
      {step > 0 && step < TOTAL_STEPS - 1 && (
        <button
          onClick={handleBack}
          style={{
            position: 'absolute', top: 52, left: 20, zIndex: 20,
            fontFamily: 'Fredoka, sans-serif', fontSize: 15, color: '#3AACB2',
            background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative z-10 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* STEP 0 — Welcome */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center w-full text-center gap-6">
              <AxolotlSvg mood="happy" size={130} animate />
              <div>
                <h1 style={{ fontFamily: 'Fredoka, sans-serif', color: '#1A5060', fontSize: 32, fontWeight: 600 }}>Welcome to Sensly</h1>
                <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#4A8A96', fontSize: 15, marginTop: 8 }}>
                  {"Let's set up your sensory profile. It only takes a minute."}
                </p>
              </div>
              <StepDots total={TOTAL_STEPS} current={step} />
              <button onClick={handleNext} style={{ background: 'linear-gradient(135deg,#2A8A96,#3AACB2)', color: 'white', fontFamily: 'Fredoka, sans-serif', fontSize: 17, fontWeight: 600, padding: '13px 44px', borderRadius: 9999, border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(42,138,150,0.3)' }}>
                {"Let's go"}
              </button>
            </motion.div>
          )}

          {/* STEP 1 — Role */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-col items-center w-full gap-5">
              <div className="text-center mb-2">
                <h2 style={{ fontFamily: 'Fredoka, sans-serif', color: '#1A5060', fontSize: 26, fontWeight: 600 }}>I am a…</h2>
                <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#4A8A96', fontSize: 14 }}>This helps Sensly personalise for you.</p>
              </div>
              <div className="flex gap-3 w-full">
                {[
                  { val: 'caregiver' as const, title: 'Caregiver', sub: "Using Sensly on someone\u2019s behalf" },
                  { val: 'user' as const, title: 'Myself', sub: 'Using Sensly for me' },
                ].map(({ val, title, sub }) => (
                  <button key={val} onClick={() => setRole(val)} style={{
                    flex: 1, padding: '20px 12px', borderRadius: 20, cursor: 'pointer',
                    border: role === val ? '2px solid #3AACB2' : '2px solid rgba(58,172,178,0.2)',
                    background: role === val ? 'rgba(58,172,178,0.1)' : 'rgba(255,255,255,0.6)',
                    boxShadow: role === val ? '0 4px 16px rgba(42,138,150,0.18)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#1A5060', fontSize: 17, fontWeight: 600 }}>{title}</p>
                    <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#4A8A96', fontSize: 12, marginTop: 4 }}>{sub}</p>
                  </button>
                ))}
              </div>
              <StepDots total={TOTAL_STEPS} current={step} />
              <button onClick={handleNext} disabled={!role} style={{ background: role ? 'linear-gradient(135deg,#1A4D55,#2A6B76)' : 'rgba(200,220,225,0.7)', color: role ? 'white' : '#8AABB5', fontFamily: 'Fredoka, sans-serif', fontSize: 17, fontWeight: 600, padding: '13px 44px', borderRadius: 9999, border: 'none', cursor: role ? 'pointer' : 'not-allowed', boxShadow: role ? '0 6px 20px rgba(26,77,85,0.25)' : 'none' }}>
                Next
              </button>
            </motion.div>
          )}

          {/* STEP 2 — Noise sensitivity */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-col items-center w-full gap-5">
              <NoiseBars level={noise} />
              <div className="text-center">
                <h2 style={{ fontFamily: 'Fredoka, sans-serif', color: '#1A5060', fontSize: 26, fontWeight: 600 }}>Noise sensitivity</h2>
                <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#4A8A96', fontSize: 14 }}>How much does sound bother you?</p>
                <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#7AABB5', fontSize: 12, marginTop: 4 }}>
                  Move the slider — you'll hear a reference tone.
                </p>
              </div>
              <div style={cardStyle}>
                <input
                  type="range" min={0} max={100} value={noise}
                  onChange={(e) => handleNoiseChange(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#3AACB2', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: 'Fredoka, sans-serif', fontSize: 13, color: '#4A8A96' }}>
                  <span>Very sensitive</span>
                  <span>Not bothered</span>
                </div>
                <div style={{ textAlign: 'center', marginTop: 8, fontFamily: 'Fredoka, sans-serif', fontSize: 22, color: '#1A5060', fontWeight: 600 }}>
                  {noise < 33 ? '🤫 Needs quiet' : noise < 66 ? '😊 Moderate' : '🎵 Noise-tolerant'}
                </div>
              </div>
              <StepDots total={TOTAL_STEPS} current={step} />
              <button onClick={handleNext} style={{ background: 'linear-gradient(135deg,#1A4D55,#2A6B76)', color: 'white', fontFamily: 'Fredoka, sans-serif', fontSize: 17, fontWeight: 600, padding: '13px 44px', borderRadius: 9999, border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(26,77,85,0.25)' }}>
                Next
              </button>
            </motion.div>
          )}

          {/* STEP 3 — Temperature */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-col items-center w-full gap-5">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
                <Thermometer value={temperature} />
              </motion.div>
              <div className="text-center">
                <h2 style={{ fontFamily: 'Fredoka, sans-serif', color: '#1A5060', fontSize: 26, fontWeight: 600 }}>Temperature</h2>
                <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#4A8A96', fontSize: 14 }}>How do you feel about heat?</p>
              </div>
              <div style={cardStyle}>
                <input type="range" min={0} max={100} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#FFB8D0', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: 'Fredoka, sans-serif', fontSize: 13, color: '#4A8A96' }}>
                  <span>Prefer cool (≤22°)</span>
                  <span>Prefer warm (≥28°)</span>
                </div>
                <div style={{ textAlign: 'center', marginTop: 8, fontFamily: 'Fredoka, sans-serif', fontSize: 22, color: '#1A5060', fontWeight: 600 }}>
                  {temperature < 33 ? '🧊 Cool comfort' : temperature < 66 ? '🌤 Moderate range' : '🌡 Warm comfort'}
                </div>
              </div>
              <StepDots total={TOTAL_STEPS} current={step} />
              <button onClick={handleNext} style={{ background: 'linear-gradient(135deg,#1A4D55,#2A6B76)', color: 'white', fontFamily: 'Fredoka, sans-serif', fontSize: 17, fontWeight: 600, padding: '13px 44px', borderRadius: 9999, border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(26,77,85,0.25)' }}>
                Next
              </button>
            </motion.div>
          )}

          {/* STEP 4 — Stims */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-col items-center w-full gap-5">
              <motion.div
                animate={stims > 65 ? { x: [-4, 4, -4], y: [-2, 2, -2] } : stims > 30 ? { y: [0, -5, 0] } : {}}
                transition={{ duration: stims > 65 ? 0.25 : 2, repeat: Infinity }}
              >
                <AxolotlSvg mood={stims > 65 ? 'alert' : stims > 30 ? 'thinking' : 'happy'} size={120} animate={false} />
              </motion.div>
              <div className="text-center">
                <h2 style={{ fontFamily: 'Fredoka, sans-serif', color: '#1A5060', fontSize: 26, fontWeight: 600 }}>Movement & stims</h2>
                <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#4A8A96', fontSize: 14 }}>How much do you move or stim?</p>
              </div>
              <div style={cardStyle}>
                <input type="range" min={0} max={100} value={stims} onChange={(e) => setStims(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#3AACB2', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: 'Fredoka, sans-serif', fontSize: 13, color: '#4A8A96' }}>
                  <span>Still</span>
                  <span>Always moving</span>
                </div>
              </div>
              <StepDots total={TOTAL_STEPS} current={step} />
              <button onClick={handleNext} style={{ background: 'linear-gradient(135deg,#1A4D55,#2A6B76)', color: 'white', fontFamily: 'Fredoka, sans-serif', fontSize: 17, fontWeight: 600, padding: '13px 44px', borderRadius: 9999, border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(26,77,85,0.25)' }}>
                Next
              </button>
            </motion.div>
          )}

          {/* STEP 5 — Inside light */}
          {step === 5 && (
            <motion.div key="s5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-col items-center w-full gap-5">
              <Lightbulb style={{ width: 72, height: 72, color: insideLight > 50 ? '#F5D060' : '#8AABB5', filter: insideLight > 50 ? 'drop-shadow(0 0 12px rgba(245,208,96,0.6))' : 'none', transition: 'all 0.3s' }} strokeWidth={1.5} />
              <div className="text-center">
                <h2 style={{ fontFamily: 'Fredoka, sans-serif', color: '#1A5060', fontSize: 26, fontWeight: 600 }}>Indoor lighting</h2>
                <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#4A8A96', fontSize: 14 }}>How bright do you like it indoors?</p>
              </div>
              <div style={cardStyle}>
                <input type="range" min={0} max={100} value={insideLight} onChange={(e) => setInsideLight(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#F5D060', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: 'Fredoka, sans-serif', fontSize: 13, color: '#4A8A96' }}>
                  <span>Dim</span>
                  <span>Very bright</span>
                </div>
              </div>
              <StepDots total={TOTAL_STEPS} current={step} />
              <button onClick={handleNext} style={{ background: 'linear-gradient(135deg,#1A4D55,#2A6B76)', color: 'white', fontFamily: 'Fredoka, sans-serif', fontSize: 17, fontWeight: 600, padding: '13px 44px', borderRadius: 9999, border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(26,77,85,0.25)' }}>
                Next
              </button>
            </motion.div>
          )}

          {/* STEP 6 — Outside light */}
          {step === 6 && (
            <motion.div key="s6" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-col items-center w-full gap-5">
              <OutdoorScene level={outsideLight} />
              <div className="text-center">
                <h2 style={{ fontFamily: 'Fredoka, sans-serif', color: '#1A5060', fontSize: 26, fontWeight: 600 }}>Outdoor light</h2>
                <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#4A8A96', fontSize: 14 }}>What do you find comfortable outside?</p>
              </div>
              <div style={cardStyle}>
                <input type="range" min={0} max={2} step={1} value={outsideLight} onChange={(e) => setOutsideLight(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#3AACB2', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: 'Fredoka, sans-serif', fontSize: 13, color: '#4A8A96' }}>
                  <span>Night</span>
                  <span>Overcast</span>
                  <span>Sunny</span>
                </div>
              </div>
              <StepDots total={TOTAL_STEPS} current={step} />
              <button onClick={handleNext} style={{ background: 'linear-gradient(135deg,#1A4D55,#2A6B76)', color: 'white', fontFamily: 'Fredoka, sans-serif', fontSize: 17, fontWeight: 600, padding: '13px 44px', borderRadius: 9999, border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(26,77,85,0.25)' }}>
                Next
              </button>
            </motion.div>
          )}

          {/* STEP 7 — Microphone permission */}
          {step === 7 && (
            <motion.div key="s7" initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center w-full gap-6">
              <AxolotlSvg mood="happy" size={100} animate />
              <div className="text-center">
                <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#4A8A96', fontSize: 15, lineHeight: 1.7 }}>
                  {'Great!'}<br />{'Now we know a bit about you,'}<br />{'Sensly needs one last thing.'}
                </p>
              </div>
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(58,172,178,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Mic style={{ width: 32, height: 32, color: '#3AACB2' }} />
                </div>
                <h3 style={{ fontFamily: 'Fredoka, sans-serif', color: '#1A5060', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
                  Allow microphone access
                </h3>
                <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#4A8A96', fontSize: 13, lineHeight: 1.5 }}>
                  {'Sensly uses your mic to monitor environmental noise — privately, on your device.'}
                </p>
              </div>
              <StepDots total={TOTAL_STEPS} current={step} />
              <button onClick={handleNext} style={{ background: 'linear-gradient(135deg,#2A8A96,#3AACB2)', color: 'white', fontFamily: 'Fredoka, sans-serif', fontSize: 17, fontWeight: 600, padding: '14px 44px', borderRadius: 9999, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(42,138,150,0.3)', width: '100%' }}>
                Allow & continue
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}