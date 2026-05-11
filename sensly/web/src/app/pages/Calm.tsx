import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import { AxolotlSvg } from '../components/AxolotlSvg';
import kelpImg from '../../imports/ChatGPT_Image_May_2,_2026,_03_50_25_PM.png';

interface CalmProps {
  onEnd: () => void;
}

const TOOLS = [
  { id: 'quiet',     emoji: '🏠', title: 'Quiet space',    sub: 'Move to a calm environment' },
  { id: 'headphones',emoji: '🎧', title: 'Headphones',     sub: 'Reduce overwhelming sounds' },
  { id: 'breathe',  emoji: '🌬️', title: 'Deep breathing',  sub: 'Slow, calm breaths to reset' },
  { id: 'snack',    emoji: '🧸', title: 'Chewy snack',     sub: 'Proprioceptive input + hunger' },
  { id: 'eyes',     emoji: '👁️', title: 'Close eyes',      sub: 'Take a visual break' },
];

const BREATH_PHASES = [
  { label: 'Breathe in…',  dur: 4,  scale: 1.18 },
  { label: 'Hold…',        dur: 2,  scale: 1.18 },
  { label: 'Breathe out…', dur: 6,  scale: 1.0  },
];

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.5)',
  border: '2px solid rgba(35,88,105,0.3)',
  borderRadius: 20,
  boxShadow: '0 6px 20px rgba(67,129,143,0.12)',
  backdropFilter: 'blur(8px)',
};

// ── Kelp decoration layer ──────────────────────────────────────────────────
function KelpBg({ opacity = 0.15 }: { opacity?: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <img
        src={kelpImg}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(248,254,252,0.82) 0%, rgba(220,248,250,0.88) 100%)',
      }} />
    </div>
  );
}

// ── Phase 0: Breathing intro ───────────────────────────────────────────────
function BreathingPhase({ onNext }: { onNext: () => void }) {
  const [bpIdx, setBpIdx] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bp = BREATH_PHASES[bpIdx];
    const id = setTimeout(() => {
      setBpIdx((i) => (i + 1) % BREATH_PHASES.length);
      setTick((t) => t + 1);
    }, bp.dur * 1000);
    return () => clearTimeout(id);
  }, [bpIdx, tick]);

  const bp = BREATH_PHASES[bpIdx];

  return (
    <div className="relative" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <KelpBg opacity={0.13} />
      <div className="relative z-10 flex flex-col items-center px-6 pt-6 pb-6">
        <h1 style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 26, fontWeight: 600, marginBottom: 2 }}>
          Calm with Sensly
        </h1>
        <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#426773', fontSize: 13, marginBottom: 20 }}>
          Take a moment · You're doing a great job.
        </p>

        {/* Breathing circle */}
        <div style={{ position: 'relative', width: 224, height: 224, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <motion.div
            animate={{ scale: bp.scale, opacity: bp.scale > 1.1 ? 0.7 : 0.45 }}
            transition={{ duration: bp.dur, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(58,172,178,0.28), rgba(217,245,248,0.5))',
              boxShadow: '0 0 60px rgba(42,166,179,0.22)',
            }}
          />
          <motion.div
            animate={{ scale: bp.scale > 1.1 ? 1.06 : 0.96 }}
            transition={{ duration: bp.dur, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: '72%', height: '72%', borderRadius: '50%',
              border: '2px solid rgba(58,172,178,0.3)',
              background: 'rgba(240,252,255,0.4)',
            }}
          />
          <AxolotlSvg mood="relieved" size={138} animate={false} />
        </div>

        {/* Phase label */}
        <AnimatePresence mode="wait">
          <motion.p
            key={bpIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 22, marginBottom: 18 }}
          >
            {bp.label}
          </motion.p>
        </AnimatePresence>

        {/* Phase dots */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {BREATH_PHASES.map((b, i) => (
            <div key={b.label} style={{
              width: i === bpIdx ? 22 : 8, height: 8, borderRadius: 9999,
              background: i === bpIdx ? '#3AACB2' : 'rgba(58,172,178,0.2)',
              transition: 'all 0.4s ease',
            }} />
          ))}
        </div>

        <button
          onClick={onNext}
          style={{
            background: 'linear-gradient(135deg,#22A6B3,#3AACB2)',
            color: 'white', fontFamily: 'Fredoka, sans-serif',
            fontSize: 16, fontWeight: 600,
            padding: '14px 0', borderRadius: 9999, border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(34,166,179,0.28)', width: '100%',
          }}
        >
          I'm ready — choose my tools →
        </button>
      </div>
    </div>
  );
}

// ── Phase 1: Pick your tools ──────────────────────────────────────────────
function ToolPickerPhase({ onNext }: { onNext: (selected: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div className="px-5 pt-5 pb-6">
      <h1 style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 24, fontWeight: 600 }}>
        Calm Steps
      </h1>
      <p style={{ color: '#426773', fontSize: 13, fontFamily: 'Fredoka, sans-serif', marginBottom: 16, marginTop: 2 }}>
        Pick what helps you most right now.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TOOLS.map((tool) => {
          const sel = selected.includes(tool.id);
          return (
            <motion.button
              key={tool.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggle(tool.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 20, border: `2px solid ${sel ? '#3AACB2' : 'rgba(35,88,105,0.22)'}`,
                background: sel ? 'rgba(58,172,178,0.1)' : 'rgba(255,255,255,0.45)',
                boxShadow: '0 4px 14px rgba(67,129,143,0.1)',
                backdropFilter: 'blur(8px)', cursor: 'pointer', width: '100%', textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 24 }}>{tool.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 16, fontWeight: 600, margin: 0 }}>
                  {tool.title}
                </p>
                <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#5d7b86', fontSize: 12, margin: '2px 0 0' }}>
                  {tool.sub}
                </p>
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${sel ? '#3AACB2' : 'rgba(58,172,178,0.3)'}`,
                background: sel ? '#3AACB2' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                {sel && <Check size={14} color="white" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#5d7b86', fontSize: 13, textAlign: 'center', marginTop: 16 }}>
        You've got this! 💕
      </p>

      <button
        onClick={() => onNext(selected)}
        disabled={selected.length === 0}
        style={{
          marginTop: 12, width: '100%', padding: '14px 0',
          borderRadius: 9999, border: 'none',
          cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
          background: selected.length > 0 ? 'linear-gradient(135deg,#22A6B3,#3AACB2)' : 'rgba(200,220,225,0.6)',
          color: selected.length > 0 ? 'white' : '#8AABB5',
          fontFamily: 'Fredoka, sans-serif', fontSize: 16, fontWeight: 600,
          boxShadow: selected.length > 0 ? '0 8px 24px rgba(34,166,179,0.28)' : 'none',
        }}
      >
        Start my calm plan →
      </button>
    </div>
  );
}

// ── Phase 2: Guided intervention ──────────────────────────────────────────
function InterventionPhase({ tools, onFinish }: { tools: typeof TOOLS; onFinish: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    setTimeLeft(120);
  }, [stepIdx]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [stepIdx, timeLeft]);

  const tool = tools[stepIdx];
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const isLast = stepIdx === tools.length - 1;

  return (
    <div className="relative" style={{ minHeight: '100%' }}>
      <KelpBg opacity={0.11} />
      <div className="relative z-10 flex flex-col items-center px-6 pt-5 pb-6">
        {/* Step counter */}
        <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#5d7b86', fontSize: 12, marginBottom: 2 }}>
          Step {stepIdx + 1} of {tools.length}
        </p>
        <h1 style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
          Intervention
        </h1>
        <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#426773', fontSize: 13, textAlign: 'center', marginBottom: 18 }}>
          You're in a safe space.<br />Let's reduce the stress together.
        </p>

        {/* Progress bar */}
        <div style={{ width: '100%', height: 6, borderRadius: 9999, background: 'rgba(58,172,178,0.15)', overflow: 'hidden', marginBottom: 20 }}>
          <motion.div
            animate={{ width: `${((stepIdx + 1) / tools.length) * 100}%` }}
            transition={{ duration: 0.5 }}
            style={{ height: '100%', borderRadius: 9999, background: 'linear-gradient(90deg, #22A6B3, #7ED6A5)' }}
          />
        </div>

        {/* Step card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ ...CARD, width: '100%', padding: '20px 24px', textAlign: 'center', marginBottom: 20 }}
          >
            <span style={{ fontSize: 42 }}>{tool.emoji}</span>
            <h2 style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 22, fontWeight: 600, marginTop: 8 }}>
              {tool.title}
            </h2>
            <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#426773', fontSize: 13, marginTop: 4 }}>
              {tool.sub}
            </p>
            <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#3AACB2', fontSize: 32, fontWeight: 600, marginTop: 12, lineHeight: 1 }}>
              {fmt(timeLeft)}
            </p>
            <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#5d7b86', fontSize: 11, marginTop: 2 }}>time remaining</p>
          </motion.div>
        </AnimatePresence>

        {/* Axolotl */}
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ marginBottom: 20 }}
        >
          <AxolotlSvg mood="happy" size={96} animate={false} />
        </motion.div>

        <button
          onClick={() => isLast ? onFinish() : setStepIdx((i) => i + 1)}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 9999, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#22A6B3,#3AACB2)',
            color: 'white', fontFamily: 'Fredoka, sans-serif', fontSize: 16, fontWeight: 600,
            boxShadow: '0 8px 24px rgba(34,166,179,0.28)',
          }}
        >
          {isLast ? 'I feel better ✦' : 'I feel better · Next step →'}
        </button>
      </div>
    </div>
  );
}

// ── Phase 3: Crisis averted ───────────────────────────────────────────────
function CrisisAverted({ onEnd }: { onEnd: () => void }) {
  return (
    <div className="relative" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <KelpBg opacity={0.2} />
      <div className="relative z-10 flex flex-col items-center px-6 gap-5 text-center py-8">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <AxolotlSvg mood="relieved" size={150} animate={false} />
        </motion.div>

        <div>
          <h2 style={{ fontFamily: 'Fredoka, sans-serif', color: '#1D9A78', fontSize: 30, fontWeight: 600 }}>
            Crisis averted ✦
          </h2>
          <p style={{ color: '#426773', fontSize: 14, fontFamily: 'Fredoka, sans-serif', marginTop: 8 }}>
            Great job! You took action and prevented a meltdown.
          </p>
        </div>

        {/* Risk badge */}
        <div style={{ ...CARD, padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 10, color: '#5d7b86', margin: 0 }}>Risk was</p>
            <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 20, fontWeight: 600, color: '#FF8A8A', margin: 0 }}>High</p>
          </div>
          <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 24, color: '#3AACB2' }}>→</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 10, color: '#5d7b86', margin: 0 }}>Now</p>
            <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 20, fontWeight: 600, color: '#7ED6A5', margin: 0 }}>Calm</p>
          </div>
        </div>

        <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#5d7b86', fontSize: 12 }}>
          Sensly logged this moment ✦
        </p>

        <button
          onClick={onEnd}
          style={{
            background: 'linear-gradient(135deg,#22A6B3,#3AACB2)',
            color: 'white', fontFamily: 'Fredoka, sans-serif',
            fontSize: 17, fontWeight: 600, padding: '14px 44px',
            borderRadius: 9999, border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(34,166,179,0.3)', width: '100%',
          }}
        >
          View summary
        </button>
        <button
          onClick={onEnd}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Fredoka, sans-serif', color: '#5d7b86', fontSize: 14 }}
        >
          Back to home
        </button>
      </div>
    </div>
  );
}

// ── Main Calm ─────────────────────────────────────────────────────────────
export function Calm({ onEnd }: CalmProps) {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const [selectedTools, setSelectedTools] = useState<typeof TOOLS>([]);

  return (
    <AnimatePresence mode="wait">
      {phase === 0 && (
        <motion.div key="p0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-full">
          <BreathingPhase onNext={() => setPhase(1)} />
        </motion.div>
      )}
      {phase === 1 && (
        <motion.div key="p1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-full">
          <ToolPickerPhase
            onNext={(ids) => {
              const tools = TOOLS.filter((t) => ids.includes(t.id));
              setSelectedTools(tools.length > 0 ? tools : [TOOLS[0]]);
              setPhase(2);
            }}
          />
        </motion.div>
      )}
      {phase === 2 && (
        <motion.div key="p2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-full">
          <InterventionPhase tools={selectedTools} onFinish={() => setPhase(3)} />
        </motion.div>
      )}
      {phase === 3 && (
        <motion.div key="p3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="min-h-full">
          <CrisisAverted onEnd={onEnd} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
