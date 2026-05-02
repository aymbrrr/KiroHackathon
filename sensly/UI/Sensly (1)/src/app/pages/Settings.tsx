import { motion } from 'motion/react';
import {
  ShieldCheck,
  User,
  Volume2,
  Sun,
  Lock,
  Zap,
  EyeOff,
  LogOut,
} from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';

interface SettingsProps {
  childProfile: any;
  setChildProfile: (p: any) => void;
}

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.8)',
  border: '1px solid rgba(100,170,190,0.35)',
  borderRadius: '24px',
  boxShadow: '0 2px 12px rgba(30,90,120,0.06)',
};

export function Settings({ childProfile, setChildProfile }: SettingsProps) {
  return (
    <div className="flex flex-col min-h-full px-5 pt-6 pb-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1
            style={{
              fontFamily: 'Fredoka, sans-serif',
              color: '#1A5060',
              fontSize: '28px',
              fontWeight: 600,
            }}
          >
            Settings
          </h1>
          <p style={{ color: '#5A8A96', fontSize: '13px', fontFamily: 'Fredoka, sans-serif' }}>
            Shielding Configuration
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(125,205,214,0.2)', border: '1px solid rgba(125,205,214,0.4)' }}
        >
          <ShieldCheck size={20} color="#3AACB2" />
        </div>
      </div>

      {/* Profile card */}
      <div style={CARD} className="p-5 mb-6 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#7DCDD6' }}
        >
          <User size={28} color="white" />
        </div>
        <div>
          <h2
            style={{
              fontFamily: 'Fredoka, sans-serif',
              color: '#1A5060',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            {childProfile.name}
          </h2>
          <p
            style={{
              color: '#7AABB5',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: 'Fredoka, sans-serif',
            }}
          >
            Active Guardian
          </p>
        </div>
      </div>

      {/* Thresholds */}
      <div className="flex flex-col gap-5 mb-6">
        <p
          style={{
            color: '#7AABB5',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontFamily: 'Fredoka, sans-serif',
            paddingLeft: '4px',
          }}
        >
          Sensory Thresholds
        </p>

        <div style={CARD} className="p-5 flex flex-col gap-7">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Volume2 size={16} color="#3AACB2" />
                <span
                  style={{
                    color: '#2A6070',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontFamily: 'Fredoka, sans-serif',
                  }}
                >
                  Noise Limit
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'Fredoka, sans-serif',
                  color: '#1A5060',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                {childProfile.preferences.noiseThreshold} dB
              </span>
            </div>
            <Slider
              defaultValue={[childProfile.preferences.noiseThreshold]}
              max={100}
              min={40}
              step={1}
              onValueChange={(v) =>
                setChildProfile({
                  ...childProfile,
                  preferences: { ...childProfile.preferences, noiseThreshold: v[0] },
                })
              }
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sun size={16} color="#3AACB2" />
                <span
                  style={{
                    color: '#2A6070',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontFamily: 'Fredoka, sans-serif',
                  }}
                >
                  Light Limit
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'Fredoka, sans-serif',
                  color: '#1A5060',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                {childProfile.preferences.lightThreshold} lx
              </span>
            </div>
            <Slider
              defaultValue={[childProfile.preferences.lightThreshold]}
              max={2000}
              min={100}
              step={50}
              onValueChange={(v) =>
                setChildProfile({
                  ...childProfile,
                  preferences: { ...childProfile.preferences, lightThreshold: v[0] },
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Toggle rows */}
      <div className="flex flex-col gap-3 mb-8">
        <ToggleRow icon={<Zap size={16} color="#3AACB2" />} label="Predictive Protection" />
        <ToggleRow icon={<Lock size={16} color="#3AACB2" />} label="Shield Mode" />
        <ToggleRow icon={<EyeOff size={16} color="#3AACB2" />} label="Stealth Monitoring" />
      </div>

      <button
        className="py-4 rounded-3xl flex items-center justify-center gap-2"
        style={{
          border: '1px solid rgba(239,108,114,0.3)',
          background: 'rgba(239,108,114,0.08)',
          color: '#EF6C72',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        <LogOut size={14} />
        Terminate Session
      </button>
    </div>
  );
}

function ToggleRow({ icon, label }: any) {
  return (
    <div
      className="flex items-center justify-between p-4"
      style={{
        background: 'rgba(255,255,255,0.75)',
        border: '1px solid rgba(100,170,190,0.3)',
        borderRadius: '16px',
      }}
    >
      <div className="flex items-center gap-3">
        <div>{icon}</div>
        <span
          style={{
            fontFamily: 'Fredoka, sans-serif',
            color: '#2A6070',
            fontSize: '14px',
          }}
        >
          {label}
        </span>
      </div>
      <Switch defaultChecked />
    </div>
  );
}
