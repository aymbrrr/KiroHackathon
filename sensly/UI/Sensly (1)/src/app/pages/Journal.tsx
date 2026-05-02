import { motion } from 'motion/react';

export interface LogEntry {
  time: string;
  title: string;
  detail: string;
  risk: number;
}

interface JournalProps {
  logs: LogEntry[];
}

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.45)',
  border: '2px solid rgba(35,88,105,0.35)',
  borderRadius: 24,
  boxShadow: '0 8px 24px rgba(67,129,143,0.14)',
  backdropFilter: 'blur(8px)',
  padding: '16px 18px',
};

function riskColor(risk: number) {
  if (risk > 75) return '#EC7D6E';
  if (risk > 55) return '#F2B85B';
  return '#46B7AE';
}

export function Journal({ logs }: JournalProps) {
  return (
    <div className="px-5 pt-5 pb-6">
      <h1 style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 30, fontWeight: 600 }}>Journal</h1>
      <p style={{ color: '#426773', fontSize: 13, fontFamily: 'Fredoka, sans-serif', marginBottom: 20, marginTop: 2 }}>
        Recent sensory moments
      </p>

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#7AABB5', fontFamily: 'Fredoka, sans-serif', marginTop: 60, fontSize: 16 }}>
          <p>No entries yet.</p>
          <p style={{ fontSize: 13, marginTop: 6 }}>Log an environment in Insights to start.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={CARD}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#5d7b86', fontSize: 11, fontFamily: 'Fredoka, sans-serif' }}>{log.time}</p>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#183844', margin: '3px 0', fontFamily: 'Fredoka, sans-serif' }}>
                    {log.title}
                  </p>
                  <p style={{ color: '#426773', fontSize: 13, fontFamily: 'Fredoka, sans-serif' }}>{log.detail}</p>
                </div>
                <div style={{
                  width: 52, height: 52, flexShrink: 0,
                  borderRadius: '50%',
                  border: `2px solid ${riskColor(log.risk)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 14,
                  color: riskColor(log.risk),
                  background: `${riskColor(log.risk)}18`,
                }}>
                  {log.risk}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
