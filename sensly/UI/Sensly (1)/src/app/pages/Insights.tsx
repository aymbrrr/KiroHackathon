import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Sun, Activity, Mic, X } from 'lucide-react';
import { AxolotlSvg } from '../components/AxolotlSvg';
import type { LogEntry } from './Journal';
import kelpImg from '../../imports/ChatGPT_Image_May_2,_2026,_03_50_25_PM.png';

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

async function captureMicrophoneDb(onSample: (db: number, progress: number) => void): Promise<number> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone unavailable');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioCtx();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  const samples: number[] = [];
  const start = performance.now();
  return await new Promise((resolve) => {
    function tick(now: number) {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const n = (data[i] - 128) / 128;
        sum += n * n;
      }
      const rms = Math.sqrt(sum / data.length);
      const db = clamp(Math.round(30 + rms * 95), 30, 110);
      samples.push(db);
      onSample(db, Math.min(1, (now - start) / 5000));
      if (now - start < 5000) requestAnimationFrame(tick);
      else {
        stream.getTracks().forEach((t) => t.stop());
        audioContext.close();
        resolve(Math.round(samples.reduce((a, b) => a + b, 0) / samples.length));
      }
    }
    requestAnimationFrame(tick);
  });
}

interface InsightsProps {
  onAddLog: (log: LogEntry) => void;
  motionLevel: number;
  lightLevel: number;
}

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.45)',
  border: '2px solid rgba(35,88,105,0.35)',
  borderRadius: 24,
  boxShadow: '0 8px 24px rgba(67,129,143,0.14)',
  backdropFilter: 'blur(8px)',
};

// Animated sound waveform bars
function SoundWave({ db, active }: { db: number; active: boolean }) {
  const bars = 16;
  const intensity = db / 110;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 60 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const baseH = 4 + (Math.sin(i * 1.2) * 0.5 + 0.5) * 28 * intensity;
        const barColor = db > 75 ? '#FF8A8A' : db > 55 ? '#F2B85B' : '#3AACB2';
        return (
          <motion.div
            key={i}
            animate={active ? {
              height: [Math.max(4, baseH * 0.7), Math.max(4, baseH * 1.3), Math.max(4, baseH * 0.7)],
            } : { height: 4 }}
            transition={{ duration: 0.3 + (i % 4) * 0.08, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 4, borderRadius: 9999,
              background: active ? barColor : 'rgba(58,172,178,0.25)',
              minHeight: 4,
            }}
          />
        );
      })}
    </div>
  );
}

export function Insights({ onAddLog, motionLevel, lightLevel }: InsightsProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sound, setSound] = useState<number | null>(null);
  const [manualFallback, setManualFallback] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  function dbToMood(db: number | null): 'happy' | 'thinking' | 'alert' | 'stressed' {
    if (!db) return 'happy';
    if (db > 75) return 'stressed';
    if (db > 60) return 'alert';
    if (db > 45) return 'thinking';
    return 'happy';
  }

  async function logEnvironment() {
    setIsCapturing(true);
    setProgress(0);
    setManualFallback(false);
    setCancelled(false);
    try {
      const avgDb = await captureMicrophoneDb((db, p) => {
        setSound(db);
        setProgress(p);
      });
      const risk = clamp(Math.round(avgDb * 0.45 + motionLevel * 0.25 + lightLevel / 20), 0, 100);
      onAddLog({ time: 'Now', title: 'Environment logged', detail: `${avgDb} dB · ${lightLevel} lux · motion ${motionLevel}%`, risk });
    } catch (_) {
      setManualFallback(true);
      const avgDb = 64;
      const risk = clamp(Math.round(avgDb * 0.45 + motionLevel * 0.25 + lightLevel / 20), 0, 100);
      onAddLog({ time: 'Now', title: 'Demo environment logged', detail: `${avgDb} dB · ${lightLevel} lux · motion ${motionLevel}%`, risk });
    } finally {
      setIsCapturing(false);
      setProgress(1);
    }
  }

  return (
    <div className="relative">
      {/* ── Fullscreen axolotl capture overlay ── */}
      <AnimatePresence>
        {isCapturing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* Kelp background */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              <img
                src={kelpImg}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(216,240,250,0.92) 0%, rgba(190,225,245,0.88) 60%, rgba(144,200,230,0.9) 100%)',
              }} />
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '0 32px' }}>
              {/* Giant axolotl */}
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <AxolotlSvg
                  mood={dbToMood(sound)}
                  size={240}
                  animate
                />
              </motion.div>

              {/* dB readout */}
              <div style={{ textAlign: 'center' }}>
                <motion.p
                  key={sound}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 52, fontWeight: 600, color: '#1A4D55', lineHeight: 1 }}
                >
                  {sound ?? '--'}
                </motion.p>
                <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 16, color: '#4A8A96', marginTop: 2 }}>dB</p>
              </div>

              {/* Waveform */}
              <SoundWave db={sound ?? 30} active={isCapturing} />

              {/* Progress bar */}
              <div style={{ width: 220, height: 8, borderRadius: 9999, background: 'rgba(58,172,178,0.25)', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 9999, background: '#3AACB2' }}
                  animate={{ width: `${progress * 100}%` }}
                />
              </div>
              <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 14, color: '#2A7A85' }}>
                Listening… {Math.round(progress * 5)}s / 5s
              </p>

              {/* Cancel */}
              <button
                onClick={() => { setCancelled(true); setIsCapturing(false); }}
                style={{
                  width: 48, height: 48, borderRadius: '50%',
                  border: '2px solid rgba(58,172,178,0.4)',
                  background: 'rgba(255,255,255,0.7)',
                  display: 'grid', placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={20} color="#2A7A85" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Normal page content ── */}
      <div className="px-5 pt-5 pb-6">
        <h1 style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 30, fontWeight: 600 }}>Sense</h1>
        <p style={{ color: '#426773', fontSize: 13, fontFamily: 'Fredoka, sans-serif', marginBottom: 24, marginTop: 2 }}>
          Log your current environment in 5 seconds.
        </p>

        {/* Main capture card */}
        <div style={{ ...CARD, padding: 20, textAlign: 'center' }}>
          {/* Axolotl preview */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <AxolotlSvg
              mood={dbToMood(sound)}
              size={96}
              animate={!isCapturing}
            />
          </div>

          <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 22, color: '#183844' }}>
            {isCapturing ? 'Listening…' : 'Log environment'}
          </h2>
          <p style={{ marginTop: 6, fontSize: 13, color: '#426773', fontFamily: 'Fredoka, sans-serif' }}>
            5-second mic capture · axolotl reacts live
          </p>

          {/* Progress bar */}
          <div style={{ marginTop: 16, height: 10, borderRadius: 9999, background: '#d4edf1', overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', borderRadius: 9999, background: '#1C9BAA' }}
              animate={{ width: `${progress * 100}%` }}
            />
          </div>

          <button
            disabled={isCapturing}
            onClick={logEnvironment}
            style={{
              marginTop: 16, width: '100%', padding: '14px 0',
              borderRadius: 20, border: 'none', cursor: isCapturing ? 'not-allowed' : 'pointer',
              background: isCapturing ? 'rgba(34,166,179,0.4)' : '#22A6B3',
              color: 'white', fontFamily: 'Fredoka, sans-serif', fontSize: 16, fontWeight: 600,
              boxShadow: isCapturing ? 'none' : '0 6px 20px rgba(34,166,179,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Mic size={18} />
            {isCapturing ? 'Capturing 5 seconds…' : 'Start 5-second log'}
          </button>

          {manualFallback && !cancelled && (
            <p style={{ marginTop: 10, fontSize: 12, color: '#8D5B3A', fontFamily: 'Fredoka, sans-serif' }}>
              Mic unavailable — demo reading used instead.
            </p>
          )}
        </div>

        {/* Live mini readouts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 14 }}>
          {[
            { Icon: Volume2, value: sound ?? '--', label: 'dB',     color: '#3AACB2' },
            { Icon: Sun,     value: lightLevel,    label: 'lux',    color: '#F2B85B' },
            { Icon: Activity, value: motionLevel,  label: 'motion', color: '#FF8A8A' },
          ].map(({ Icon, value, label, color }) => (
            <div key={label} style={{ ...CARD, padding: 12, textAlign: 'center' }}>
              <Icon size={20} color={color} style={{ margin: '0 auto' }} />
              <p style={{ marginTop: 6, fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600, color: '#183844' }}>
                {value}
              </p>
              <p style={{ fontSize: 11, color: '#5d7b86', fontFamily: 'Fredoka, sans-serif' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}