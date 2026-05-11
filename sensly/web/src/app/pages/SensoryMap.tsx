import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, MapPin, Check } from 'lucide-react';

// Fix leaflet default icon paths in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Types ─────────────────────────────────────────────────────────────────

interface SensoryRating {
  noise: number;
  light: number;
  smell: number;
  crowd: number;
  temperature: number;
  texture: number;
}

interface SensoryPin {
  id: string;
  lat: number;
  lng: number;
  name: string;
  ratings: SensoryRating;
  notes?: string;
  timestamp: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function avgRating(r: SensoryRating) {
  return (r.noise + r.light + r.smell + r.crowd + r.temperature + r.texture) / 6;
}

function pinColor(r: SensoryRating) {
  const avg = avgRating(r);
  if (avg <= 2.2) return '#7ED6A5';
  if (avg <= 3.5) return '#F2B85B';
  return '#FF8A8A';
}

function createDivIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.28);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
  });
}

const SAMPLE_PINS: SensoryPin[] = [
  {
    id: '1', lat: 35.3018, lng: -120.6620, name: 'Kennedy Library',
    ratings: { noise: 1, light: 3, smell: 1, crowd: 2, temperature: 2, texture: 1 },
    notes: 'Very quiet study floors 2–4', timestamp: '10:30 AM',
  },
  {
    id: '2', lat: 35.3054, lng: -120.6559, name: 'Campus Rec Center',
    ratings: { noise: 5, light: 4, smell: 3, crowd: 4, temperature: 4, texture: 3 },
    notes: 'Loud during peak hours', timestamp: '2:00 PM',
  },
  {
    id: '3', lat: 35.2997, lng: -120.6622, name: 'Dexter Lawn',
    ratings: { noise: 2, light: 4, smell: 1, crowd: 2, temperature: 3, texture: 1 },
    notes: 'Calm outdoor spot, open air', timestamp: 'Yesterday',
  },
  {
    id: '4', lat: 35.3065, lng: -120.6625, name: 'University Union',
    ratings: { noise: 4, light: 4, smell: 3, crowd: 5, temperature: 3, texture: 2 },
    notes: 'Very busy at lunch, loud music sometimes', timestamp: '11:00 AM',
  },
  {
    id: '5', lat: 35.3040, lng: -120.6680, name: 'Engineering Plaza',
    ratings: { noise: 3, light: 3, smell: 1, crowd: 3, temperature: 2, texture: 2 },
    notes: 'Moderate — construction nearby', timestamp: '9:15 AM',
  },
];

// ── Sensory dimensions config ─────────────────────────────────────────────

const DIMENSIONS = [
  { key: 'noise'       as const, label: 'Noise',   emoji: '🔊', hi: 'Overwhelming', lo: 'Silent' },
  { key: 'light'       as const, label: 'Light',   emoji: '💡', hi: 'Blinding',     lo: 'Dim' },
  { key: 'smell'       as const, label: 'Smell',   emoji: '👃', hi: 'Intense',      lo: 'Fresh' },
  { key: 'crowd'       as const, label: 'Crowd',   emoji: '👥', hi: 'Packed',       lo: 'Empty' },
  { key: 'temperature' as const, label: 'Temp',    emoji: '🌡', hi: 'Very hot',     lo: 'Cool' },
  { key: 'texture'     as const, label: 'Texture', emoji: '🖐', hi: 'Rough',        lo: 'Smooth' },
];

// ── Sub-components ────────────────────────────────────────────────────────

function StarRow({ label, emoji, value, lo, hi, onChange }: {
  label: string; emoji: string; value: number; lo: string; hi: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 14, color: '#183844', fontWeight: 600 }}>
          {emoji} {label}
        </span>
        <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 12, color: '#5d7b86' }}>
          {value < 2 ? lo : value > 3.5 ? hi : 'Moderate'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              flex: 1, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: n <= value
                ? (value >= 4 ? '#FF8A8A' : value >= 3 ? '#F2B85B' : '#7ED6A5')
                : 'rgba(200,225,230,0.5)',
              transition: 'all 0.15s',
              transform: n === value ? 'scale(1.08)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Rating Sheet ──────────────────────────────────────────────────────────

const EMPTY_RATINGS: SensoryRating = { noise: 3, light: 3, smell: 1, crowd: 3, temperature: 2, texture: 1 };

function RatingSheet({
  lat, lng, existingPin, onSave, onClose,
}: {
  lat: number; lng: number;
  existingPin: SensoryPin | null;
  onSave: (name: string, ratings: SensoryRating, notes: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(existingPin?.name ?? '');
  const [notes, setNotes] = useState(existingPin?.notes ?? '');
  const [ratings, setRatings] = useState<SensoryRating>(existingPin?.ratings ?? { ...EMPTY_RATINGS });

  const setRating = (key: keyof SensoryRating, v: number) =>
    setRatings((prev) => ({ ...prev, [key]: v }));

  const avg = avgRating(ratings);
  const comfort = avg <= 2.2 ? '😌 Comfortable' : avg <= 3.5 ? '😐 Moderate' : '😣 Overwhelming';
  const avgColor = avg <= 2.2 ? '#7ED6A5' : avg <= 3.5 ? '#F2B85B' : '#FF8A8A';

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      style={{
        background: 'rgba(248,254,252,0.98)',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 32px rgba(30,80,100,0.18)',
        maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Handle */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 9999, background: 'rgba(58,172,178,0.3)' }} />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px' }}>
        <div>
          <h3 style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 20, fontWeight: 600, margin: 0 }}>
            {existingPin ? 'Edit rating' : 'Rate this spot'}
          </h3>
          <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 12, color: '#5d7b86', marginTop: 2 }}>
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(58,172,178,0.3)', background: 'rgba(255,255,255,0.6)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
        >
          <X size={16} color="#2c7180" />
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {/* Name */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Place name (e.g. Hyde Park)"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 14,
            border: '1.5px solid rgba(58,172,178,0.4)',
            background: 'rgba(255,255,255,0.8)',
            fontFamily: 'Fredoka, sans-serif', fontSize: 15, color: '#183844',
            marginBottom: 14, boxSizing: 'border-box', outline: 'none',
          }}
        />

        {/* Overall comfort badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          padding: '10px 14px', borderRadius: 14,
          background: `${avgColor}22`,
          border: `1.5px solid ${avgColor}55`,
        }}>
          <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 15, color: '#183844' }}>{comfort}</span>
          <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 12, color: '#5d7b86', marginLeft: 'auto' }}>
            avg {avg.toFixed(1)} / 5
          </span>
        </div>

        {/* Rating rows */}
        {DIMENSIONS.map((d) => (
          <StarRow
            key={d.key}
            label={d.label}
            emoji={d.emoji}
            value={ratings[d.key]}
            lo={d.lo}
            hi={d.hi}
            onChange={(v) => setRating(d.key, v)}
          />
        ))}

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes? (optional)"
          rows={2}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 14,
            border: '1.5px solid rgba(58,172,178,0.35)',
            background: 'rgba(255,255,255,0.7)',
            fontFamily: 'Fredoka, sans-serif', fontSize: 13, color: '#183844',
            resize: 'none', boxSizing: 'border-box', outline: 'none',
            marginBottom: 14,
          }}
        />

        {/* Save */}
        <button
          onClick={() => onSave(name || 'My spot', ratings, notes)}
          style={{
            width: '100%', padding: '14px 0',
            borderRadius: 20, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #2A8A96, #3AACB2)',
            color: 'white', fontFamily: 'Fredoka, sans-serif', fontSize: 16, fontWeight: 600,
            boxShadow: '0 6px 20px rgba(34,166,179,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Check size={18} />
          Save rating
        </button>
      </div>
    </motion.div>
  );
}

// ── Leaflet Map (direct, no react-leaflet) ────────────────────────────────

interface LeafletMapProps {
  pins: SensoryPin[];
  adding: boolean;
  center: [number, number];
  onMapClick: (lat: number, lng: number) => void;
  onPinClick: (pin: SensoryPin) => void;
}

function LeafletMap({ pins, adding, center, onMapClick, onPinClick }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const addingRef = useRef(adding);
  const onMapClickRef = useRef(onMapClick);
  const onPinClickRef = useRef(onPinClick);

  // Keep refs in sync so event handlers always have latest callbacks
  useEffect(() => { addingRef.current = adding; }, [adding]);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onPinClickRef.current = onPinClick; }, [onPinClick]);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom: 14,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on('click', (e) => {
      if (addingRef.current) {
        onMapClickRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers whenever pins change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(pins.map((p) => p.id));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add / update markers
    pins.forEach((pin) => {
      const existing = markersRef.current.get(pin.id);
      if (existing) {
        existing.setLatLng([pin.lat, pin.lng]);
        existing.setIcon(createDivIcon(pinColor(pin.ratings)));
      } else {
        const marker = L.marker([pin.lat, pin.lng], { icon: createDivIcon(pinColor(pin.ratings)) })
          .addTo(map);

        const popupContent = document.createElement('div');
        popupContent.style.fontFamily = 'Fredoka, sans-serif';
        popupContent.style.minWidth = '140px';
        popupContent.innerHTML = `
          <p style="font-weight:600;color:#183844;margin:0 0 4px">${pin.name}</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${DIMENSIONS.map((d) => `<span style="font-size:11px;color:#426773">${d.emoji} ${pin.ratings[d.key as keyof SensoryRating]}</span>`).join('')}
          </div>
          ${pin.notes ? `<p style="font-size:11px;color:#5d7b86;margin-top:4px;font-style:italic">${pin.notes}</p>` : ''}
          <button id="edit-${pin.id}" style="margin-top:6px;padding:4px 10px;border-radius:8px;border:none;cursor:pointer;background:#3AACB2;color:white;font-family:Fredoka,sans-serif;font-size:12px;">
            Edit rating
          </button>
        `;

        const popup = L.popup({ closeButton: false }).setContent(popupContent);
        marker.bindPopup(popup);

        marker.on('click', () => {
          onPinClickRef.current(pin);
        });

        // Wire up edit button after popup opens
        marker.on('popupopen', () => {
          const btn = document.getElementById(`edit-${pin.id}`);
          if (btn) {
            btn.onclick = (e) => {
              e.stopPropagation();
              onPinClickRef.current(pin);
            };
          }
        });

        markersRef.current.set(pin.id, marker);
      }
    });
  }, [pins]);

  // Update cursor style based on adding mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getContainer().style.cursor = adding ? 'crosshair' : '';
  }, [adding]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}

// ── Main SensoryMap ───────────────────────────────────────────────────────

export function SensoryMap() {
  const [pins, setPins] = useState<SensoryPin[]>(SAMPLE_PINS);
  const [adding, setAdding] = useState(false);
  const [sheet, setSheet] = useState<{ lat: number; lng: number; existing: SensoryPin | null } | null>(null);
  const [center] = useState<[number, number]>([35.3050, -120.6625]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setAdding(false);
    setSheet({ lat, lng, existing: null });
  }, []);

  const handlePinClick = useCallback((pin: SensoryPin) => {
    setSheet({ lat: pin.lat, lng: pin.lng, existing: pin });
  }, []);

  const handleSave = (name: string, ratings: SensoryRating, notes: string) => {
    if (!sheet) return;
    if (sheet.existing) {
      setPins((prev) => prev.map((p) =>
        p.id === sheet.existing!.id ? { ...p, name, ratings, notes, timestamp: 'Just now' } : p
      ));
    } else {
      const newPin: SensoryPin = {
        id: String(Date.now()),
        lat: sheet.lat, lng: sheet.lng,
        name, ratings, notes,
        timestamp: 'Just now',
      };
      setPins((prev) => [newPin, ...prev]);
    }
    setSheet(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px 10px', flexShrink: 0 }}>
        <h1 style={{ fontFamily: 'Fredoka, sans-serif', color: '#183844', fontSize: 30, fontWeight: 600, margin: 0 }}>
          Sensory Map
        </h1>
        <p style={{ color: '#426773', fontSize: 13, fontFamily: 'Fredoka, sans-serif', marginTop: 2 }}>
          Rate places around you
        </p>
      </div>

      {/* Legend + Add button */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px 10px', flexShrink: 0 }}>
        {[
          { color: '#7ED6A5', label: 'Calm' },
          { color: '#F2B85B', label: 'Moderate' },
          { color: '#FF8A8A', label: 'Intense' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: '1.5px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 12, color: '#426773' }}>{label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => setAdding((a) => !a)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: adding ? '#FF8A8A' : '#3AACB2',
              color: 'white', fontFamily: 'Fredoka, sans-serif', fontSize: 13, fontWeight: 600,
              boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
              transition: 'background 0.2s',
            }}
          >
            {adding ? <X size={14} /> : <Plus size={14} />}
            {adding ? 'Cancel' : 'Add spot'}
          </button>
        </div>
      </div>

      {/* Instruction banner when adding */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 36 }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(58,172,178,0.12)',
              borderTop: '1px solid rgba(58,172,178,0.2)',
              borderBottom: '1px solid rgba(58,172,178,0.2)',
            }}
          >
            <MapPin size={14} color="#3AACB2" style={{ marginRight: 6 }} />
            <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 13, color: '#2A7A85' }}>
              Tap on the map to place a rating pin
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <div style={{ height: 360, position: 'relative', flexShrink: 0 }}>
        <LeafletMap
          pins={pins}
          adding={adding}
          center={center}
          onMapClick={handleMapClick}
          onPinClick={handlePinClick}
        />
      </div>

      {/* Recent pins list */}
      <div style={{ flexShrink: 0, padding: '10px 20px 100px', borderTop: '1px solid rgba(35,88,105,0.15)' }}>
        <p style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 12, color: '#5d7b86', marginBottom: 8 }}>
          Recent spots ({pins.length})
        </p>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {pins.slice(0, 8).map((pin) => {
            const color = pinColor(pin.ratings);
            return (
              <button
                key={pin.id}
                onClick={() => handlePinClick(pin)}
                style={{
                  flexShrink: 0, padding: '8px 12px',
                  borderRadius: 14, border: `1.5px solid ${color}66`,
                  background: `${color}18`, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 12, color: '#183844', whiteSpace: 'nowrap' }}>
                  {pin.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom sheet overlay */}
      <AnimatePresence>
        {sheet && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.25)' }}
              onClick={() => setSheet(null)}
            />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 401, maxWidth: 390, margin: '0 auto' }}>
              <RatingSheet
                lat={sheet.lat}
                lng={sheet.lng}
                existingPin={sheet.existing}
                onSave={handleSave}
                onClose={() => setSheet(null)}
              />
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}