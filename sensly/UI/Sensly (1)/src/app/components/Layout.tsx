import { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Home, BookOpen, BarChart3, Droplets, MoreHorizontal, MapPin } from 'lucide-react';
import { Dashboard, type SenslyMood } from '../pages/Dashboard';
import { Insights } from '../pages/Insights';
import { Journal, type LogEntry } from '../pages/Journal';
import { Calm } from '../pages/Calm';
import { More } from '../pages/More';
import { SensoryMap } from '../pages/SensoryMap';
import { CareTeam } from '../pages/CareTeam';

type Tab = 'home' | 'journal' | 'insights' | 'calm' | 'map' | 'more';

interface LayoutProps {
  childProfile: { name: string; age: number };
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

// ── Sensor hooks ─────────────────────────────────────────────────────────────

function useMotionReading(active: boolean) {
  const [val, setVal] = useState(18);
  const lastRef = useRef(18);
  useEffect(() => {
    if (!active) return;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (!a) return;
      const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
      lastRef.current = clamp(Math.round(Math.abs(mag - 9.8) * 20), 0, 100);
      setVal(lastRef.current);
    };
    window.addEventListener('devicemotion', onMotion as EventListener);
    const fb = setInterval(() => {
      lastRef.current = clamp(lastRef.current + Math.round(Math.random() * 12 - 5), 5, 75);
      setVal(lastRef.current);
    }, 850);
    return () => {
      window.removeEventListener('devicemotion', onMotion as EventListener);
      clearInterval(fb);
    };
  }, [active]);
  return val;
}

function useLightReading(active: boolean) {
  const [val, setVal] = useState(320);
  useEffect(() => {
    if (!active) return;
    const onLight = (e: Event) => setVal(clamp(Math.round((e as any).value || 320), 40, 1200));
    window.addEventListener('devicelight', onLight);
    const fb = setInterval(() => setVal((v) => clamp(v + Math.round(Math.random() * 90 - 35), 120, 850)), 1200);
    return () => {
      window.removeEventListener('devicelight', onLight);
      clearInterval(fb);
    };
  }, [active]);
  return val;
}

// ── Bottom nav ───────────────────────────────────────────────────────────────

const NAV_ITEMS: [Tab, typeof Home, string][] = [
  ['home',     Home,          'Home'],
  ['journal',  BookOpen,      'Journal'],
  ['insights', BarChart3,     'Sense'],
  ['map',      MapPin,        'Map'],
  ['calm',     Droplets,      'Calm'],
  ['more',     MoreHorizontal,'More'],
];

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div style={{
      position: 'absolute', bottom: 12, left: 12, right: 12,
      height: 72,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      borderRadius: 22,
      border: '2px solid rgba(36,89,104,0.25)',
      background: 'rgba(255,255,255,0.6)',
      boxShadow: '0 8px 20px rgba(40,102,119,0.18)',
      backdropFilter: 'blur(20px)',
      zIndex: 50,
    }}>
      {NAV_ITEMS.map(([key, Icon, label]) => {
        const active = tab === key;
        return (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: 'grid', placeItems: 'center',
              width: 52, height: 56,
              borderRadius: 16,
              border: `2px solid ${active ? '#1D8D9D' : 'rgba(108,145,160,0.25)'}`,
              background: active ? '#BEEBF0' : 'rgba(255,255,255,0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Icon size={19} color={active ? '#086A79' : '#395E6A'} />
            <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 9, fontWeight: 600, color: '#244C58', marginTop: -2 }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Main Layout ──────────────────────────────────────────────────────────────

export function Layout({ childProfile }: LayoutProps) {
  const [tab, setTab] = useState<Tab>('home');
  const [subView, setSubView] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: '2:30 PM', title: 'High noise detected',  detail: 'Sound reached 76 dB',        risk: 68 },
    { time: '11:10 AM', title: 'Calm environment',    detail: 'Light and sound stayed low',  risk: 22 },
  ]);
  const [readingTick, setReadingTick] = useState(0);
  const [intervention, setIntervention] = useState(false);

  const motionLevel = useMotionReading(true);
  const lightLevel  = useLightReading(true);

  // Static series — computed once, never updated so graphs stay stable
  const [staticSeries] = useState(() => ({
    soundSeries:  [42, 55, 48, 68, 74, 62, 55, 70, 65, 58, 72, 60],
    motionSeries: [18, 26, 32, 20, 15, 28, 35, 22, 18, 30, 25, 20],
    lightSeries:  [320, 380, 420, 395, 360, 445, 415, 370, 350, 480, 420, 395],
  }));

  // Tick readings every 1.4s — only updates scalar values, not series
  useEffect(() => {
    const id = setInterval(() => setReadingTick((x) => x + 1), 1400);
    return () => clearInterval(id);
  }, []);

  const readings = useMemo(() => ({
    sound:  clamp(Math.round(58 + Math.sin(readingTick * 0.42) * 16), 30, 92),
    motion: clamp(Math.round(28 + Math.cos(readingTick * 0.36) * 13), 8, 62),
    light:  clamp(Math.round(390 + Math.sin(readingTick * 0.31) * 85), 200, 720),
    ...staticSeries,
  }), [readingTick, staticSeries]);

  const risk: number = clamp(Math.round(readings.sound * 0.45 + readings.motion * 0.25 + readings.light / 35), 0, 100);
  const mood: SenslyMood = intervention ? 'calm' : risk > 75 ? 'high' : risk > 55 ? 'rising' : 'calm';

  function addLog(log: LogEntry) { setLogs((prev) => [log, ...prev]); }

  function startIntervention() {
    setIntervention(true);
    setTab('calm');
  }

  function endIntervention() {
    setIntervention(false);
    addLog({ time: 'Now', title: 'Calm reset completed', detail: 'Intervention steps finished', risk: 28 });
    setTab('home');
  }

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: '#F4FBFA' }}>
      {/* Background layers */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 22% 18%, rgba(180,235,245,0.75), transparent 28%), radial-gradient(circle at 80% 62%, rgba(75,177,190,0.28), transparent 26%), linear-gradient(180deg, #F8FEFC 0%, #DFF6F7 50%, #BDE6ED 100%)',
      }} />
      <div className="absolute inset-0 opacity-70 mix-blend-multiply" style={{ filter: 'blur(48px)',
        background: 'radial-gradient(circle at 28% 68%, rgba(34,157,177,0.24), transparent 24%), radial-gradient(circle at 15% 45%, rgba(92,188,204,0.18), transparent 22%), radial-gradient(circle at 76% 32%, rgba(255,196,139,0.18), transparent 18%)',
      }} />
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.75) 1px, transparent 1.5px)',
        backgroundSize: '28px 28px',
        opacity: 0.35,
      }} />

      {/* Scrollable content */}
      <main className="h-full overflow-y-auto relative z-10" style={{ paddingBottom: 96 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab + (subView ?? '')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="min-h-full"
          >
            {tab === 'home' && (
              <Dashboard
                readings={readings}
                risk={risk}
                mood={mood}
                childProfile={childProfile}
                onStartIntervention={startIntervention}
                onOpenMore={() => setTab('more')}
              />
            )}
            {tab === 'journal' && <Journal logs={logs} />}
            {tab === 'insights' && (
              <Insights
                onAddLog={addLog}
                motionLevel={motionLevel}
                lightLevel={lightLevel}
              />
            )}
            {tab === 'map' && <SensoryMap />}
            {tab === 'calm' && <Calm onEnd={endIntervention} />}
            {tab === 'more' && !subView && <More onNavigate={(view) => setSubView(view)} />}
            {tab === 'more' && subView === 'careteam' && <CareTeam onBack={() => setSubView(null)} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav */}
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}