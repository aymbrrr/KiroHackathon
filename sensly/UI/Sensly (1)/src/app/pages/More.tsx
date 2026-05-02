import { ChevronRight, Heart, User, Bell, Lock, HelpCircle, Info } from 'lucide-react';
import { AxolotlSvg } from '../components/AxolotlSvg';

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.45)',
  border: '2px solid rgba(35,88,105,0.35)',
  borderRadius: 20,
  boxShadow: '0 8px 24px rgba(67,129,143,0.14)',
  backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 18px',
  cursor: 'pointer',
  width: '100%',
};

interface MoreProps {
  onNavigate: (view: string) => void;
}

const items = [
  { label: 'Care team',             icon: Heart,        color: '#EC7D6E', view: 'careteam' },
  { label: 'Sensory profile',       icon: User,         color: '#46B7AE', view: null },
  { label: 'Reminders',             icon: Bell,         color: '#F2B85B', view: null },
  { label: 'Privacy controls',      icon: Lock,         color: '#8A8FBB', view: null },
  { label: 'Help & Support',        icon: HelpCircle,   color: '#3AACB2', view: null },
  { label: 'About Sensly v1.0',     icon: Info,         color: '#C5D8E0', view: null },
];

export function More({ onNavigate }: MoreProps) {
  return (
    <div className="px-5 pt-5 pb-6">
      {/* Profile preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <AxolotlSvg mood="happy" size={64} animate />
        <div>
          <h1 style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 22, fontWeight: 600, margin: 0 }}>
            Axolotl
          </h1>
          <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#5d7b86', fontSize: 13, margin: '2px 0 0' }}>
            Edit profile
          </p>
        </div>
        <ChevronRight size={18} color="#8AABB5" style={{ marginLeft: 'auto' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(({ label, icon: Icon, color, view }) => (
          <button
            key={label}
            style={CARD}
            onClick={() => view && onNavigate(view)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: `${color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} color={color} />
              </div>
              <span style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 16 }}>{label}</span>
            </div>
            <ChevronRight size={18} color="#8AABB5" />
          </button>
        ))}
      </div>

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#8AABB5', fontSize: 12 }}>
          Sensly v1.0 · Made with care 🌊
        </p>
      </div>
    </div>
  );
}
