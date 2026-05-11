import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Mail, Phone, Plus, MessageCircle, Calendar, Share2, ChevronLeft, Send, Check, Bell } from 'lucide-react';
import { AxolotlSvg } from '../components/AxolotlSvg';
import kelpImg from '../../imports/ChatGPT_Image_May_2,_2026,_03_50_25_PM.png';

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.5)',
  border: '2px solid rgba(35,88,105,0.28)',
  borderRadius: 20,
  boxShadow: '0 6px 20px rgba(67,129,143,0.12)',
  backdropFilter: 'blur(8px)',
};

const TEAM = [
  {
    id: 'sarah',
    name: 'Sarah Johnson',
    role: 'Parent',
    initials: 'SJ',
    color: '#3AACB2',
    bg: 'rgba(58,172,178,0.12)',
    permissions: 'Full Access',
    lastActive: '2 min ago',
    status: 'online',
    email: 'sarah.j@email.com',
    phone: '(555) 123-4567',
    recentNote: 'Miles had a great morning — minimal sensory triggers.',
  },
  {
    id: 'mrs_rodriguez',
    name: 'Ms. Rodriguez',
    role: 'Special Ed Teacher',
    initials: 'MR',
    color: '#9B8ADB',
    bg: 'rgba(155,138,219,0.12)',
    permissions: 'View & Log Events',
    lastActive: '1 hour ago',
    status: 'away',
    email: 'mrodriguez@school.edu',
    phone: '(555) 234-5678',
    recentNote: 'Transition to recess went smoothly today.',
  },
  {
    id: 'emily',
    name: 'Dr. Emily Chen',
    role: 'ABA Therapist',
    initials: 'EC',
    color: '#7ED6A5',
    bg: 'rgba(126,214,165,0.12)',
    permissions: 'View & Interventions',
    lastActive: '3 hours ago',
    status: 'away',
    email: 'echen@therapy.com',
    phone: '(555) 345-6789',
    recentNote: 'Great progress with self-regulation this week.',
  },
  {
    id: 'david',
    name: 'David Martinez',
    role: 'Speech Therapist',
    initials: 'DM',
    color: '#F2B85B',
    bg: 'rgba(242,184,91,0.12)',
    permissions: 'View Only',
    lastActive: 'Yesterday',
    status: 'offline',
    email: 'dmartinez@therapy.com',
    phone: '(555) 456-7890',
    recentNote: 'Will review latest session notes tomorrow.',
  },
];

const ACTIVITY = [
  { id: '1', member: 'Ms. Rodriguez', action: 'logged an event',       detail: 'Transition to recess went smoothly today.',         time: '1 hour ago',  dot: '#7ED6A5' },
  { id: '2', member: 'Sarah Johnson', action: 'started intervention',   detail: 'Noise-canceling headphones + quiet space.',          time: '2 hours ago', dot: '#3AACB2' },
  { id: '3', member: 'Dr. Emily Chen',action: 'added a note',           detail: 'Great progress with self-regulation this week.',     time: '4 hours ago', dot: '#9B8ADB' },
  { id: '4', member: 'Ms. Rodriguez', action: 'updated sleep log',      detail: 'Miles had a good night — 85% quality.',             time: '1 day ago',   dot: '#F2B85B' },
  { id: '5', member: 'David Martinez',action: 'scheduled a session',    detail: 'Speech therapy moved to Thursday 10am.',            time: '2 days ago',  dot: '#FF8A8A' },
];

const MESSAGES = [
  { id: '1', from: 'Ms. Rodriguez', text: 'How was Miles this morning?', time: '9:32 AM', mine: false },
  { id: '2', from: 'You',           text: "He had a calm start. Sensly showed low noise levels until 10am.", time: '9:35 AM', mine: true },
  { id: '3', from: 'Ms. Rodriguez', text: "Great! I'll keep the classroom quieter this afternoon too.", time: '9:36 AM', mine: false },
  { id: '4', from: 'Dr. Emily Chen',text: 'Checking in — any meltdowns today?', time: '11:20 AM', mine: false },
];

type View = 'overview' | 'member' | 'chat' | 'calendar';

interface CareTeamProps {
  onBack: () => void;
}

export function CareTeam({ onBack }: CareTeamProps) {
  const [view, setView] = useState<View>('overview');
  const [activeMember, setActiveMember] = useState<typeof TEAM[0] | null>(null);
  const [msg, setMsg] = useState('');
  const [msgs, setMsgs] = useState(MESSAGES);

  const sendMsg = () => {
    if (!msg.trim()) return;
    setMsgs((prev) => [...prev, { id: String(Date.now()), from: 'You', text: msg, time: 'Now', mine: true }]);
    setMsg('');
  };

  // ── Member detail view ────────────────────────────────────────────────────
  if (view === 'member' && activeMember) {
    const m = activeMember;
    return (
      <div className="px-5 pt-4 pb-6">
        <button onClick={() => setView('overview')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
          <ChevronLeft size={18} color="#3AACB2" />
          <span style={{ fontFamily: 'Fredoka, sans-serif', color: '#3AACB2', fontSize: 15 }}>Care Team</span>
        </button>

        {/* Avatar header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: m.bg, border: `2.5px solid ${m.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 24, fontWeight: 600, color: m.color }}>{m.initials}</span>
          </div>
          <div>
            <h2 style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 22, fontWeight: 600, margin: 0 }}>{m.name}</h2>
            <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#5d7b86', fontSize: 13, margin: '2px 0 0' }}>{m.role}</p>
            <div style={{ display: 'inline-block', marginTop: 4, padding: '3px 10px', borderRadius: 9999, background: `${m.color}18`, border: `1px solid ${m.color}44` }}>
              <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 11, color: m.color, fontWeight: 600 }}>{m.permissions}</span>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div style={{ ...CARD, padding: '14px 16px', marginBottom: 12 }}>
          <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 11, color: '#5d7b86', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>Contact</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Mail size={16} color="#3AACB2" />
            <span style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 14 }}>{m.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Phone size={16} color="#3AACB2" />
            <span style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 14 }}>{m.phone}</span>
          </div>
        </div>

        {/* Recent note */}
        <div style={{ ...CARD, padding: '14px 16px', marginBottom: 12 }}>
          <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 11, color: '#5d7b86', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Latest note</p>
          <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 14, lineHeight: 1.5 }}>{m.recentNote}</p>
          <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#8AABB5', fontSize: 11, marginTop: 6 }}>Last active {m.lastActive}</p>
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            onClick={() => setView('chat')}
            style={{ ...CARD, padding: '14px 10px', border: `2px solid rgba(58,172,178,0.35)`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <MessageCircle size={22} color="#3AACB2" />
            <span style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 13, fontWeight: 600 }}>Message</span>
          </button>
          <button style={{ ...CARD, padding: '14px 10px', border: `2px solid rgba(242,184,91,0.35)`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Bell size={22} color="#F2B85B" />
            <span style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 13, fontWeight: 600 }}>Notify</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Chat view ─────────────────────────────────────────────────────────────
  if (view === 'chat') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(35,88,105,0.12)', flexShrink: 0 }}>
          <button onClick={() => setView('overview')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={20} color="#3AACB2" />
          </button>
          <span style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 18, fontWeight: 600 }}>Team Chat</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {msgs.map((m) => (
            <div key={m.id} style={{ display: 'flex', flexDirection: m.mine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
              {!m.mine && (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(58,172,178,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 10, color: '#3AACB2', fontWeight: 600 }}>
                    {m.from.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
              )}
              <div style={{
                maxWidth: '72%',
                padding: '10px 14px',
                borderRadius: m.mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: m.mine ? 'linear-gradient(135deg,#22A6B3,#3AACB2)' : 'rgba(255,255,255,0.7)',
                border: m.mine ? 'none' : '1.5px solid rgba(35,88,105,0.18)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                {!m.mine && (
                  <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 10, color: '#3AACB2', marginBottom: 3 }}>{m.from}</p>
                )}
                <p style={{ fontFamily: 'Fredoka, sans-serif', color: m.mine ? 'white' : '#183844', fontSize: 14, lineHeight: 1.4, margin: 0 }}>{m.text}</p>
                <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 10, color: m.mine ? 'rgba(255,255,255,0.65)' : '#8AABB5', marginTop: 4, textAlign: 'right' }}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '10px 16px 20px', borderTop: '1px solid rgba(35,88,105,0.12)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
            placeholder="Message your care team…"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 14,
              border: '1.5px solid rgba(58,172,178,0.4)',
              background: 'rgba(255,255,255,0.7)',
              fontFamily: 'Fredoka, sans-serif', fontSize: 14, color: '#183844', outline: 'none',
            }}
          />
          <button
            onClick={sendMsg}
            style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#3AACB2', display: 'grid', placeItems: 'center', boxShadow: '0 3px 10px rgba(58,172,178,0.35)', flexShrink: 0 }}
          >
            <Send size={18} color="white" />
          </button>
        </div>
      </div>
    );
  }

  // ── Overview ──────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Kelp background strip */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, overflow: 'hidden', borderRadius: '0 0 24px 24px', zIndex: 0, pointerEvents: 'none' }}>
        <img src={kelpImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(220,248,252,0.7) 0%, rgba(248,254,252,0.95) 100%)' }} />
      </div>

      <div className="relative z-10 px-5 pt-5 pb-24">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={20} color="#3AACB2" />
            </button>
            <h1 style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 28, fontWeight: 600 }}>Care Team</h1>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: '#3AACB2', color: 'white',
            fontFamily: 'Fredoka, sans-serif', fontSize: 13, fontWeight: 600,
            boxShadow: '0 3px 10px rgba(58,172,178,0.28)',
          }}>
            <Plus size={14} />
            Invite
          </button>
        </div>
        <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#5d7b86', fontSize: 13, marginBottom: 20, marginLeft: 30 }}>
          Everyone supporting your journey
        </p>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
          {[
            { label: 'Members', value: TEAM.length, color: '#3AACB2' },
            { label: 'Events',  value: 127,          color: '#9B8ADB' },
            { label: 'Notes',   value: 23,            color: '#7ED6A5' },
          ].map(({ label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{ ...CARD, padding: '12px 10px', textAlign: 'center' }}
            >
              <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 26, fontWeight: 600, color, margin: 0 }}>{value}</p>
              <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 11, color: '#5d7b86' }}>{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Team members */}
        <p style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#5d7b86', marginBottom: 10 }}>
          Your team
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {TEAM.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              onClick={() => { setActiveMember(m); setView('member'); }}
              style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', width: '100%', textAlign: 'left', cursor: 'pointer', border: `2px solid ${m.color}28` }}
            >
              {/* Avatar */}
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: m.bg, border: `2px solid ${m.color}44`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 16, fontWeight: 600, color: m.color }}>{m.initials}</span>
                {/* Status dot */}
                <div style={{
                  position: 'absolute', bottom: 1, right: 1,
                  width: 10, height: 10, borderRadius: '50%', border: '1.5px solid white',
                  background: m.status === 'online' ? '#7ED6A5' : m.status === 'away' ? '#F2B85B' : '#C5D8E0',
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 15, fontWeight: 600, margin: 0 }}>{m.name}</p>
                <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#5d7b86', fontSize: 12, margin: '1px 0 4px' }}>{m.role}</p>
                <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 9999, background: `${m.color}18`, border: `1px solid ${m.color}35` }}>
                  <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 10, color: m.color, fontWeight: 600 }}>{m.permissions}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 10, color: '#8AABB5' }}>{m.lastActive}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setView('chat'); }}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${m.color}44`, background: m.bg, display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                >
                  <MessageCircle size={14} color={m.color} />
                </button>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Quick actions */}
        <p style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#5d7b86', marginBottom: 10 }}>
          Tools
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[
            { icon: MessageCircle, label: 'Team Chat',   color: '#3AACB2', action: () => setView('chat') },
            { icon: Calendar,      label: 'Calendar',    color: '#9B8ADB', action: () => {} },
            { icon: Share2,        label: 'Share',       color: '#7ED6A5', action: () => {} },
          ].map(({ icon: Icon, label, color, action }) => (
            <button
              key={label}
              onClick={action}
              style={{ ...CARD, padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, border: `2px solid ${color}28` }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
              <span style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 12, fontWeight: 600 }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Activity feed */}
        <p style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#5d7b86', marginBottom: 10 }}>
          Recent activity
        </p>
        <div style={{ ...CARD, padding: '14px 16px' }}>
          {ACTIVITY.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', gap: 12, paddingBottom: i < ACTIVITY.length - 1 ? 14 : 0 }}>
              {/* Timeline dot + line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 14 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: a.dot, marginTop: 4, flexShrink: 0 }} />
                {i < ACTIVITY.length - 1 && (
                  <div style={{ width: 1.5, flex: 1, background: 'rgba(58,172,178,0.15)', marginTop: 4 }} />
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: i < ACTIVITY.length - 1 ? 6 : 0 }}>
                <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 10, color: '#8AABB5', marginBottom: 2 }}>{a.time}</p>
                <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 14, color: '#183844', margin: 0 }}>
                  <span style={{ fontWeight: 600 }}>{a.member}</span>{' '}
                  <span style={{ color: '#5d7b86' }}>{a.action}</span>
                </p>
                <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 12, color: '#426773', marginTop: 2 }}>{a.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sensly mascot footer */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, gap: 12, alignItems: 'center' }}>
          <AxolotlSvg mood="happy" size={56} animate style={{ opacity: 0.8 }} />
          <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#8AABB5', fontSize: 12 }}>
            Your care team has your back 💙
          </p>
        </div>
      </div>
    </div>
  );
}
