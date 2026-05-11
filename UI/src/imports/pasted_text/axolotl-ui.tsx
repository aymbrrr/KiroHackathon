import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookOpen,
  BarChart3,
  Droplets,
  MoreHorizontal,
  Volume2,
  Sun,
  Activity,
  Play,
  CheckCircle2,
  Mic,
  Pause,
  AlertTriangle,
  Settings,
} from "lucide-react";

const moodCopy = {
  calm: {
    label: "All systems calm",
    message: "You seem regulated right now.",
    face: "•ᴗ•",
    color: "#46B7AE",
  },
  rising: {
    label: "Stress may be rising",
    message: "Noise and motion are trending up.",
    face: "•︵•",
    color: "#F2B85B",
  },
  high: {
    label: "Support recommended",
    message: "Try a sensory reset soon.",
    face: ";︵;",
    color: "#EC7D6E",
  },
};

const initialLogs = [
  { time: "2:30 PM", title: "High noise detected", detail: "Sound reached 76 dB", risk: 68 },
  { time: "11:10 AM", title: "Calm environment", detail: "Light and sound stayed low", risk: 22 },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sparkline(points, width = 112, height = 54) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  return points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function useMotionReading(active) {
  const [motionLevel, setMotionLevel] = useState(18);
  useEffect(() => {
    if (!active) return;
    let last = 18;
    const onMotion = (event) => {
      const a = event.accelerationIncludingGravity || event.acceleration;
      if (!a) return;
      const magnitude = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
      last = clamp(Math.round(Math.abs(magnitude - 9.8) * 20), 0, 100);
      setMotionLevel(last);
    };
    window.addEventListener("devicemotion", onMotion);
    const fallback = setInterval(() => setMotionLevel((v) => clamp(v + Math.round(Math.random() * 12 - 5), 5, 75)), 850);
    return () => {
      window.removeEventListener("devicemotion", onMotion);
      clearInterval(fallback);
    };
  }, [active]);
  return motionLevel;
}

function useLightReading(active) {
  const [light, setLight] = useState(320);
  useEffect(() => {
    if (!active) return;
    const onLight = (event) => setLight(clamp(Math.round(event.value || 320), 40, 1200));
    window.addEventListener("devicelight", onLight);
    const fallback = setInterval(() => setLight((v) => clamp(v + Math.round(Math.random() * 90 - 35), 120, 850)), 1200);
    return () => {
      window.removeEventListener("devicelight", onLight);
      clearInterval(fallback);
    };
  }, [active]);
  return light;
}

async function captureMicrophoneDb(onSample) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone unavailable");
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  const samples = [];
  const start = performance.now();

  return await new Promise((resolve) => {
    function tick(now) {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const normalized = (data[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / data.length);
      const db = clamp(Math.round(30 + rms * 95), 30, 110);
      samples.push(db);
      onSample(db, Math.min(1, (now - start) / 5000));
      if (now - start < 5000) requestAnimationFrame(tick);
      else {
        stream.getTracks().forEach((track) => track.stop());
        audioContext.close();
        resolve(Math.round(samples.reduce((a, b) => a + b, 0) / samples.length));
      }
    }
    requestAnimationFrame(tick);
  });
}

function Axolotl({ mood = "calm" }) {
  const copy = moodCopy[mood];
  return (
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      className="relative mx-auto h-32 w-40"
    >
      <div className="absolute left-3 top-9 h-16 w-20 -rotate-12 rounded-full bg-[#ffa8a8]/70 blur-[1px]" />
      <div className="absolute right-3 top-9 h-16 w-20 rotate-12 rounded-full bg-[#ffa8a8]/70 blur-[1px]" />
      <div className="absolute left-0 top-12 h-5 w-16 rounded-full bg-[#ff9e9e]" />
      <div className="absolute left-1 top-7 h-5 w-16 rotate-[-24deg] rounded-full bg-[#ffabab]" />
      <div className="absolute left-3 top-[70px] h-5 w-14 rotate-[18deg] rounded-full bg-[#ffabab]" />
      <div className="absolute right-0 top-12 h-5 w-16 rounded-full bg-[#ff9e9e]" />
      <div className="absolute right-1 top-7 h-5 w-16 rotate-[24deg] rounded-full bg-[#ffabab]" />
      <div className="absolute right-3 top-[70px] h-5 w-14 rotate-[-18deg] rounded-full bg-[#ffabab]" />
      <div className="absolute left-1/2 top-6 h-[88px] w-[112px] -translate-x-1/2 rounded-[48%] border-2 border-[#7e4a4a]/30 bg-[#ffd0c9] shadow-[inset_0_-12px_18px_rgba(255,148,148,0.22)]" />
      <div className="absolute bottom-1 left-1/2 h-10 w-24 -translate-x-1/2 rounded-[50%] bg-[#ffc4bd]" />
      <div className="absolute left-[47px] top-[58px] h-3 w-3 rounded-full bg-[#523637]" />
      <div className="absolute right-[47px] top-[58px] h-3 w-3 rounded-full bg-[#523637]" />
      <div className="absolute left-1/2 top-[70px] -translate-x-1/2 text-[22px] leading-none text-[#523637]">{copy.face}</div>
      <div className="absolute left-[39px] top-[74px] h-3 w-5 rounded-full bg-[#ff8479]/70" />
      <div className="absolute right-[39px] top-[74px] h-3 w-5 rounded-full bg-[#ff8479]/70" />
    </motion.div>
  );
}

function PhoneFrame({ children }) {
  return (
    <div className="min-h-screen w-full bg-[#dbeff3] p-4 text-[#183844]">
      <div className="mx-auto flex min-h-screen max-w-[440px] items-center justify-center">
        <div className="relative h-[844px] w-[390px] overflow-hidden rounded-[48px] border-[10px] border-[#15181b] bg-[#F4FBFA] shadow-[0_30px_90px_rgba(27,57,67,0.35)]">
          <div className="absolute left-1/2 top-0 z-20 h-8 w-36 -translate-x-1/2 rounded-b-3xl bg-[#15181b]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(180,235,245,0.75),transparent_28%),radial-gradient(circle_at_80%_62%,rgba(75,177,190,0.28),transparent_26%),linear-gradient(180deg,#F8FEFC_0%,#DFF6F7_50%,#BDE6ED_100%)]" />
          <div className="absolute inset-0 opacity-70 mix-blend-multiply bg-[radial-gradient(circle_at_28%_68%,rgba(34,157,177,0.24),transparent_24%),radial-gradient(circle_at_15%_45%,rgba(92,188,204,0.18),transparent_22%),radial-gradient(circle_at_76%_32%,rgba(255,196,139,0.18),transparent_18%)] blur-xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,.75)_1px,transparent_1.5px)] bg-[size:28px_28px] opacity-35" />
          <div className="relative z-10 h-full">{children}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="flex h-10 items-center justify-between px-5 pt-2 text-sm font-semibold text-[#14313C]">
      <span>9:41</span>
      <span className="text-xs">▮▮▮  Wi‑Fi  ▭</span>
    </div>
  );
}

function Header() {
  return (
    <div className="px-6 pt-2 text-center">
      <div className="flex items-center justify-center gap-3">
        <h1 className="font-serif text-[42px] leading-none tracking-[-0.04em] text-[#123C4A]">Sensly</h1>
        <button className="absolute right-6 top-[54px] grid h-10 w-10 place-items-center rounded-full border-2 border-[#2c7180]/30 bg-white/45">
          <Settings size={20} />
        </button>
      </div>
      <p className="mt-1 text-xs text-[#39636d]">Sensory insights, simply</p>
    </div>
  );
}

function Card({ children, className = "" }) {
  return <div className={`rounded-[24px] border-2 border-[#235869]/35 bg-white/45 shadow-[0_8px_24px_rgba(67,129,143,0.14)] backdrop-blur ${className}`}>{children}</div>;
}

function SensorCard({ title, value, unit, data, icon: Icon, color = "#168FA0", label = "moderate" }) {
  return (
    <Card className="relative h-[132px] p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-[0.22em] text-[#173D49]">{title}</p>
          <p className="mt-1 text-[28px] font-medium text-[#163947]">{value}<span className="ml-1 text-lg">{unit}</span></p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#2c7180]/35 bg-[#eefbfc]/70">
          <Icon size={18} color="#1D6D7C" />
        </div>
      </div>
      <svg className="absolute bottom-7 left-4 right-4 h-[54px] w-[calc(100%-32px)]" viewBox="0 0 112 54">
        <polyline points={sparkline(data)} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="absolute bottom-3 left-4 font-mono text-[12px] text-[#315964]">{label}</p>
    </Card>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    ["home", Home, "Home"],
    ["journal", BookOpen, "Journal"],
    ["insights", BarChart3, "Insights"],
    ["calm", Droplets, "Calm"],
    ["more", MoreHorizontal, "More"],
  ];
  return (
    <div className="absolute bottom-4 left-4 right-4 flex h-[78px] items-center justify-around rounded-[24px] border-2 border-[#245968]/25 bg-white/55 shadow-[0_8px_20px_rgba(40,102,119,0.18)] backdrop-blur-xl">
      {items.map(([key, Icon, label]) => {
        const active = tab === key;
        return (
          <button key={key} onClick={() => setTab(key)} className={`grid h-[62px] w-[62px] place-items-center rounded-[18px] border-2 ${active ? "border-[#1D8D9D] bg-[#BEEBF0]" : "border-[#6c91a0]/30 bg-white/25"}`}>
            <Icon size={24} color={active ? "#086A79" : "#395E6A"} />
            <span className="text-[10px] font-semibold text-[#244C58]">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function HomeScreen({ readings, risk, mood, startIntervention }) {
  return (
    <>
      <StatusBar />
      <Header />
      <div className="px-5 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <SensorCard title="Sound" value={readings.sound} unit="dB" data={readings.soundSeries} icon={Volume2} label={readings.sound > 75 ? "loud" : "moderate"} />
          <SensorCard title="Motion" value={readings.motion} unit="%" data={readings.motionSeries} icon={Activity} color="#F2B85B" label={readings.motion > 55 ? "active" : "steady"} />
        </div>
        <div className="mx-auto mt-4 w-[210px]">
          <SensorCard title="Light" value={readings.light} unit="lux" data={readings.lightSeries} icon={Sun} color="#E9B83F" label="yellow light" />
        </div>

        <div className="mt-6 flex items-end gap-3">
          <Card className="flex-1 p-5">
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[#2F6874]">Current sense</p>
            <p className="mt-3 text-[28px] leading-tight text-[#183844]">{moodCopy[mood].message}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-3 flex-1 rounded-full bg-[#c9e8ec]">
                <motion.div className="h-full rounded-full" style={{ background: moodCopy[mood].color }} animate={{ width: `${risk}%` }} />
              </div>
              <span className="text-lg font-semibold">{risk}%</span>
            </div>
          </Card>
          <Axolotl mood={mood} />
        </div>

        <Card className="mt-5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm text-[#176F7E]">Insight ✦</p>
              <p className="mt-2 text-lg leading-snug text-[#183844]">Noise, light, and motion are combined into your stress risk.</p>
            </div>
            {risk >= 70 ? (
              <button onClick={startIntervention} className="rounded-2xl bg-[#F46F61] px-4 py-3 text-sm font-semibold text-white shadow-lg">Reset</button>
            ) : (
              <CheckCircle2 color="#1D9A78" />
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function InsightsScreen({ addLog }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sound, setSound] = useState(0);
  const motion = useMotionReading(isCapturing);
  const light = useLightReading(isCapturing);
  const [manualFallback, setManualFallback] = useState(false);

  async function logEnvironment() {
    setIsCapturing(true);
    setProgress(0);
    setManualFallback(false);
    try {
      const avgDb = await captureMicrophoneDb((db, p) => {
        setSound(db);
        setProgress(p);
      });
      const risk = clamp(Math.round(avgDb * 0.45 + motion * 0.25 + light / 20), 0, 100);
      addLog({ time: "Now", title: "Environment logged", detail: `${avgDb} dB • ${light} lux • motion ${motion}%`, risk });
    } catch (e) {
      setManualFallback(true);
      const avgDb = 64;
      const risk = clamp(Math.round(avgDb * 0.45 + motion * 0.25 + light / 20), 0, 100);
      addLog({ time: "Now", title: "Demo environment logged", detail: `${avgDb} dB • ${light} lux • motion ${motion}%`, risk });
    } finally {
      setIsCapturing(false);
      setProgress(1);
    }
  }

  return (
    <>
      <StatusBar />
      <div className="px-6 pt-4">
        <h1 className="text-[32px] font-semibold text-[#183844]">Insights</h1>
        <p className="mt-1 text-sm text-[#426773]">Log your current environment in 5 seconds.</p>

        <Card className="mt-8 p-5 text-center">
          <div className="mx-auto grid h-36 w-36 place-items-center rounded-full border-2 border-[#2c7180]/30 bg-[#E9FAFB]">
            <motion.div animate={isCapturing ? { scale: [1, 1.1, 1] } : { scale: 1 }} transition={{ repeat: isCapturing ? Infinity : 0, duration: 1 }}>
              {isCapturing ? <Mic size={48} color="#0E7E8E" /> : <Play size={48} color="#0E7E8E" />}
            </motion.div>
          </div>
          <h2 className="mt-5 text-2xl font-semibold">{isCapturing ? "Listening…" : "Log environment"}</h2>
          <p className="mt-2 text-sm text-[#426773]">Uses microphone, yellow light estimate, and motion reading.</p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#d4edf1]">
            <motion.div className="h-full rounded-full bg-[#1C9BAA]" animate={{ width: `${progress * 100}%` }} />
          </div>
          <button disabled={isCapturing} onClick={logEnvironment} className="mt-5 w-full rounded-2xl bg-[#22A6B3] py-4 font-semibold text-white shadow-lg disabled:opacity-50">
            {isCapturing ? "Capturing 5 seconds" : "Start 5-second log"}
          </button>
          {manualFallback && <p className="mt-3 text-xs text-[#8D5B3A]">Mic permission was unavailable, so a demo reading was used.</p>}
        </Card>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Card className="p-3 text-center"><Volume2 className="mx-auto" size={20} /><p className="mt-2 text-xl font-semibold">{sound || "--"}</p><p className="text-xs">dB</p></Card>
          <Card className="p-3 text-center"><Sun className="mx-auto" size={20} color="#D8A82F" /><p className="mt-2 text-xl font-semibold">{light}</p><p className="text-xs">lux</p></Card>
          <Card className="p-3 text-center"><Activity className="mx-auto" size={20} /><p className="mt-2 text-xl font-semibold">{motion}</p><p className="text-xs">motion</p></Card>
        </div>
      </div>
    </>
  );
}

function JournalScreen({ logs }) {
  return (
    <>
      <StatusBar />
      <div className="px-6 pt-4">
        <h1 className="text-[32px] font-semibold">Journal</h1>
        <p className="mt-1 text-sm text-[#426773]">Recent sensory moments</p>
        <div className="mt-6 space-y-4">
          {logs.map((log, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#5d7b86]">{log.time}</p>
                  <p className="mt-1 text-lg font-semibold">{log.title}</p>
                  <p className="text-sm text-[#426773]">{log.detail}</p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-[#2c7180]/25 bg-white/50 font-semibold">{log.risk}%</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

function CalmScreen({ endIntervention }) {
  return (
    <>
      <StatusBar />
      <div className="px-6 pt-8 text-center">
        <h1 className="text-[30px] font-semibold">Calm reset</h1>
        <p className="mt-2 text-sm text-[#426773]">Breathe with Sensly for a moment.</p>
        <div className="mt-10">
          <motion.div animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="mx-auto grid h-56 w-56 place-items-center rounded-full bg-[#D9F5F8] shadow-[0_0_55px_rgba(42,166,179,0.35)]">
            <Axolotl mood="calm" />
          </motion.div>
        </div>
        <p className="mt-8 text-2xl text-[#183844]">Breathe in… breathe out…</p>
        <div className="mt-8 space-y-3 text-left">
          {['Move to a quieter space', 'Try headphones', 'Dim bright yellow lights', 'Take slow breaths'].map((step, i) => (
            <Card key={step} className="flex items-center gap-3 p-4"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#22A6B3] text-white">{i + 1}</span><span>{step}</span></Card>
          ))}
        </div>
        <button onClick={endIntervention} className="mt-8 w-full rounded-2xl bg-[#22A6B3] py-4 font-semibold text-white shadow-lg">I feel safer</button>
      </div>
    </>
  );
}

function MoreScreen() {
  return (
    <>
      <StatusBar />
      <div className="px-6 pt-4">
        <h1 className="text-[32px] font-semibold">More</h1>
        <div className="mt-6 space-y-3">
          {['Care team', 'Sensory profile', 'Notification settings', 'Privacy controls'].map((item) => <Card key={item} className="p-5 text-lg">{item}</Card>)}
        </div>
      </div>
    </>
  );
}

export default function SenslyApp() {
  const [tab, setTab] = useState("home");
  const [logs, setLogs] = useState(initialLogs);
  const [readingTick, setReadingTick] = useState(0);
  const [intervention, setIntervention] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setReadingTick((x) => x + 1), 1400);
    return () => clearInterval(id);
  }, []);

  const readings = useMemo(() => {
    const soundSeries = Array.from({ length: 12 }, (_, i) => clamp(38 + i * 3 + Math.sin((readingTick + i) / 2) * 12, 32, 96));
    const motionSeries = Array.from({ length: 12 }, (_, i) => clamp(18 + i * 2 + Math.cos((readingTick + i) / 1.7) * 10, 5, 80));
    const lightSeries = Array.from({ length: 12 }, (_, i) => clamp(260 + Math.sin((readingTick + i) / 1.4) * 80 + i * 8, 120, 900));
    return {
      sound: Math.round(soundSeries.at(-1)),
      motion: Math.round(motionSeries.at(-1)),
      light: Math.round(lightSeries.at(-1)),
      soundSeries,
      motionSeries,
      lightSeries,
    };
  }, [readingTick]);

  const risk = clamp(Math.round(readings.sound * 0.45 + readings.motion * 0.25 + readings.light / 35), 0, 100);
  const mood = intervention ? "calm" : risk > 75 ? "high" : risk > 55 ? "rising" : "calm";

  function addLog(log) {
    setLogs((prev) => [log, ...prev]);
  }

  function startIntervention() {
    setIntervention(true);
    setTab("calm");
  }

  function endIntervention() {
    setIntervention(false);
    setLogs((prev) => [{ time: "Now", title: "Calm reset completed", detail: "Intervention steps finished", risk: 28 }, ...prev]);
    setTab("home");
  }

  return (
    <PhoneFrame>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }} className="h-full pb-28">
          {tab === "home" && <HomeScreen readings={readings} risk={risk} mood={mood} startIntervention={startIntervention} />}
          {tab === "insights" && <InsightsScreen addLog={addLog} />}
          {tab === "journal" && <JournalScreen logs={logs} />}
          {tab === "calm" && <CalmScreen endIntervention={endIntervention} />}
          {tab === "more" && <MoreScreen />}
        </motion.div>
      </AnimatePresence>
      <BottomNav tab={tab} setTab={setTab} />
    </PhoneFrame>
  );
}
