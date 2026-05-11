import { motion } from 'motion/react';
import { Volume2, Activity, Sun, CheckCircle2, Settings } from 'lucide-react';
import { AxolotlSvg } from '../components/AxolotlSvg';
import kelpImg from '../../assets/ChatGPT_Image_May_2,_2026,_03_50_25_PM.png';

export type SenslyMood = 'calm' | 'rising' | 'high';

export interface SensorReadings {
  sound: number;
  motion: number;
  light: number;
  soundSeries: number[];
  motionSeries: number[];
  lightSeries: number[];
}

interface DashboardProps {
  readings: SensorReadings;
  risk: number;
  mood: SenslyMood;
  childProfile: any;
  onStartIntervention: () => void;
  onOpenMore: () => void;
}

const moodCopy = {
  calm:   { label: 'All systems calm',     message: 'You seem regulated right now.',      face: 'happy' as const,    color: '#46B7AE' },
  rising: { label: 'Stress may be rising', message: 'Noise and motion are trending up.', face: 'thinking' as const, color: '#F2B85B' },
  high:   { label: 'Support recommended',  message: 'Try a sensory reset soon.',          face: 'stressed' as const, color: '#EC7D6E' },
};

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

// Chunky bar-style sparkline path (step chart)
function chunkySeries(points: number[], width = 110, height = 46): string {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const segW = width / points.length;
  return points.map((p, i) => {
    const x = i * segW;
    const y = height - ((p - min) / range) * (height - 4) - 2;
    const x2 = (i + 1) * segW;
    if (i === 0) return `M ${x.toFixed(1)},${y.toFixed(1)} L ${x2.toFixed(1)},${y.toFixed(1)}`;
    const prev = points[i - 1];
    const prevY = height - ((prev - min) / range) * (height - 4) - 2;
    return `L ${x.toFixed(1)},${prevY.toFixed(1)} L ${x.toFixed(1)},${y.toFixed(1)} L ${x2.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.45)',
  border: '2px solid rgba(35,88,105,0.35)',
  borderRadius: 24,
  boxShadow: '0 8px 24px rgba(67,129,143,0.14)',
  backdropFilter: 'blur(8px)',
};

// ── Triangle radar chart for Current Sense ─────────────────────────────────
function SenseTriangle({ sound, motion, light, childProfile }: {
  sound: number; motion: number; light: number; childProfile: any;
}) {
  const cx = 60, cy = 56, R = 40;
  const a0 = -Math.PI / 2;                  // top  = Sound
  const a1 = a0 + (2 * Math.PI) / 3;        // btm-right = Motion
  const a2 = a0 + (4 * Math.PI) / 3;        // btm-left  = Light

  // Normalize current readings 0-1
  const soundFrac  = Math.min(sound / 100, 1);
  const motionFrac = Math.min(motion / 100, 1);
  const lightFrac  = Math.min(light / 1000, 1);

  // User preferences (higher = tolerates more, larger comfort zone)
  const prefNoise  = ((childProfile?.noise  ?? 50) / 100);
  const prefStims  = ((childProfile?.stims  ?? 50) / 100);
  const prefLight  = ((childProfile?.insideLight ?? 50) / 100);

  function pts(f0: number, f1: number, f2: number) {
    const x0 = cx + f0 * R * Math.cos(a0), y0 = cy + f0 * R * Math.sin(a0);
    const x1 = cx + f1 * R * Math.cos(a1), y1 = cy + f1 * R * Math.sin(a1);
    const x2 = cx + f2 * R * Math.cos(a2), y2 = cy + f2 * R * Math.sin(a2);
    return `${x0.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }

  const stressed = soundFrac > prefNoise || motionFrac > prefStims || lightFrac > prefLight;
  const currColor = stressed ? '#FF8A8A' : '#7ED6A5';

  // Label coords (just outside each vertex)
  const lOff = R + 10;
  const lSound  = { x: (cx + lOff * Math.cos(a0)).toFixed(1), y: (cy + lOff * Math.sin(a0) + 4).toFixed(1) };
  const lMotion = { x: (cx + lOff * Math.cos(a1)).toFixed(1), y: (cy + lOff * Math.sin(a1) + 4).toFixed(1) };
  const lLight  = { x: (cx + lOff * Math.cos(a2)).toFixed(1), y: (cy + lOff * Math.sin(a2) + 4).toFixed(1) };

  return (
    <svg width="120" height="108" viewBox="0 0 120 108" style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {[a0, a1, a2].map((a, i) => (
        <line key={i}
          x1={cx} y1={cy}
          x2={(cx + R * Math.cos(a)).toFixed(1)}
          y2={(cy + R * Math.sin(a)).toFixed(1)}
          stroke="rgba(58,172,178,0.22)" strokeWidth="1" />
      ))}
      {/* Mid rings */}
      <polygon points={pts(0.5, 0.5, 0.5)} fill="none" stroke="rgba(58,172,178,0.15)" strokeWidth="1" />
      {/* Outer boundary */}
      <polygon points={pts(1, 1, 1)} fill="rgba(58,172,178,0.05)" stroke="rgba(58,172,178,0.28)" strokeWidth="1.5" />
      {/* Preference zone */}
      <polygon points={pts(prefNoise, prefStims, prefLight)} fill="rgba(126,214,165,0.22)" stroke="rgba(126,214,165,0.7)" strokeWidth="1.5" strokeDasharray="3 2" />
      {/* Current readings */}
      <polygon points={pts(soundFrac, motionFrac, lightFrac)} fill={`${currColor}38`} stroke={currColor} strokeWidth="2" />
      {/* Axis dots */}
      {[
        { a: a0, f: soundFrac },
        { a: a1, f: motionFrac },
        { a: a2, f: lightFrac },
      ].map(({ a, f }, i) => (
        <circle key={i}
          cx={(cx + f * R * Math.cos(a)).toFixed(1)}
          cy={(cy + f * R * Math.sin(a)).toFixed(1)}
          r="3" fill={currColor} />
      ))}
      {/* Labels */}
      <text x={lSound.x}  y={lSound.y}  textAnchor="middle" fill="#5d7b86" fontSize="8.5" fontFamily="Fredoka, sans-serif">Noise</text>
      <text x={lMotion.x} y={lMotion.y} textAnchor="middle" fill="#5d7b86" fontSize="8.5" fontFamily="Fredoka, sans-serif">Motion</text>
      <text x={lLight.x}  y={lLight.y}  textAnchor="middle" fill="#5d7b86" fontSize="8.5" fontFamily="Fredoka, sans-serif">Light</text>
    </svg>
  );
}

// Three distinct colors for the three sensors
const SENSOR_COLORS = {
  sound:  '#3AACB2', // teal
  motion: '#FF8A8A', // coral
  light:  '#F2B85B', // amber
};

function SensorCard({ title, value, unit, data, icon: Icon, colorKey, label = 'moderate' }: {
  title: string; value: number; unit: string; data: number[];
  icon: any; colorKey: keyof typeof SENSOR_COLORS; label?: string;
}) {
  const color = SENSOR_COLORS[colorKey];
  return (
    <div style={{ ...CARD, position: 'relative', height: 130, padding: '14px 14px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#173D49', fontWeight: 700 }}>
            {title}
          </p>
          <p style={{ marginTop: 3, fontSize: 24, fontWeight: 500, color: '#163947', fontFamily: 'Fredoka, sans-serif' }}>
            {value}<span style={{ marginLeft: 2, fontSize: 14 }}>{unit}</span>
          </p>
        </div>
        <div style={{
          width: 32, height: 32, display: 'grid', placeItems: 'center',
          borderRadius: '50%', border: `2px solid ${color}55`, background: `${color}18`,
        }}>
          <Icon size={15} color={color} />
        </div>
      </div>
      {/* Chunky step chart */}
      <svg style={{ position: 'absolute', bottom: 26, left: 14, right: 14, width: 'calc(100% - 28px)', height: 46 }} viewBox="0 0 110 46" preserveAspectRatio="none">
        <path d={chunkySeries(data)} fill="none" stroke={color} strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" opacity="0.85" />
        {/* Subtle fill */}
        <path d={chunkySeries(data) + ' V 46 H 0 Z'} fill={color} opacity="0.1" />
      </svg>
      <p style={{ position: 'absolute', bottom: 8, left: 14, fontFamily: 'monospace', fontSize: 10, color: color, fontWeight: 700 }}>{label}</p>
    </div>
  );
}

export function Dashboard({ readings, risk, mood, childProfile, onStartIntervention, onOpenMore }: DashboardProps) {
  const copy = moodCopy[mood];

  return (
    <div className="pb-4">
      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 20px 0', height: 40 }}>
        <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 15, fontWeight: 600, color: '#14313C' }}>9:41</span>
        <span style={{ fontSize: 12, color: '#14313C' }}>▮▮▮  Wi‑Fi  ▭</span>
      </div>

      {/* Header */}
      <div style={{ padding: '6px 24px', textAlign: 'center', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <h1 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 40, lineHeight: 1, letterSpacing: '-0.03em', color: '#123C4A' }}>
            Sensly
          </h1>
        </div>
        <p style={{ marginTop: 2, fontSize: 12, color: '#39636d', fontFamily: 'Fredoka, sans-serif' }}>
          Sensory insights, simply
        </p>
        <button
          onClick={onOpenMore}
          style={{
            position: 'absolute', right: 20, top: 8,
            width: 40, height: 40, borderRadius: '50%',
            border: '2px solid rgba(44,113,128,0.3)', background: 'rgba(255,255,255,0.45)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}
        >
          <Settings size={18} color="#2c7180" />
        </button>
      </div>

      {/* Sensor cards */}
      <div style={{ padding: '16px 18px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SensorCard
            title="Sound" value={readings.sound} unit="dB"
            data={readings.soundSeries} icon={Volume2}
            colorKey="sound"
            label={readings.sound > 75 ? 'loud' : 'moderate'}
          />
          <SensorCard
            title="Motion" value={readings.motion} unit="%"
            data={readings.motionSeries} icon={Activity}
            colorKey="motion"
            label={readings.motion > 55 ? 'active' : 'steady'}
          />
        </div>

        {/* Light card centred */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <div style={{ width: 200 }}>
            <SensorCard
              title="Light" value={readings.light} unit="lux"
              data={readings.lightSeries} icon={Sun}
              colorKey="light"
              label="ambient"
            />
          </div>
        </div>

        {/* Current sense + axolotl */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 16 }}>
          <div style={{ ...CARD, flex: 1, padding: 18 }}>
            <p style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2F6874' }}>
              Current sense
            </p>
            <p style={{ marginTop: 6, fontSize: 18, lineHeight: 1.3, color: '#183844', fontFamily: 'Fredoka, sans-serif' }}>
              {copy.message}
            </p>
            {/* Triangle radar chart */}
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
              <SenseTriangle
                sound={readings.sound}
                motion={readings.motion}
                light={readings.light}
                childProfile={childProfile}
              />
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 2, borderRadius: 9999, background: '#7ED6A5', borderTop: '1.5px dashed #7ED6A5' }} />
                <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 9, color: '#5d7b86' }}>comfort zone</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 2, borderRadius: 9999, background: risk > 55 ? '#FF8A8A' : '#7ED6A5' }} />
                <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 9, color: '#5d7b86' }}>now</span>
              </div>
            </div>
          </div>
          <AxolotlSvg mood={copy.face} size={108} animate />
        </div>

        {/* Kelp / underwater scene decoration */}
        <div style={{
          marginTop: 14, borderRadius: 20, overflow: 'hidden',
          height: 90, position: 'relative',
          border: '2px solid rgba(35,88,105,0.25)',
        }}>
          <img
            src={kelpImg}
            alt="Kelp scene"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, rgba(216,240,250,0.6) 0%, transparent 40%, rgba(216,240,250,0.35) 100%)',
            display: 'flex', alignItems: 'center', padding: '0 16px',
          }}>
            <div style={{ ...CARD, padding: '8px 14px', backdropFilter: 'blur(12px)' }}>
              <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 11, color: '#183844', fontWeight: 600 }}>
                Sensly is monitoring ✦
              </p>
              <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 10, color: '#39636d' }}>
                Stay calm, we've got you
              </p>
            </div>
          </div>
        </div>

        {/* Insight card */}
        <div style={{ ...CARD, padding: 16, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#176F7E', marginBottom: 5 }}>Insight ✦</p>
              <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 15, lineHeight: 1.35, color: '#183844' }}>
                Noise, light, and motion combine into your stress risk score.
              </p>
            </div>
            {risk >= 70 ? (
              <button
                onClick={onStartIntervention}
                style={{
                  background: '#F46F61', color: 'white', border: 'none',
                  borderRadius: 16, padding: '10px 14px', cursor: 'pointer',
                  fontFamily: 'Fredoka, sans-serif', fontSize: 14, fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(244,111,97,0.35)', flexShrink: 0,
                }}
              >
                Reset
              </button>
            ) : (
              <CheckCircle2 color="#1D9A78" size={26} style={{ flexShrink: 0 }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}