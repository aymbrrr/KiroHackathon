import { motion } from 'motion/react';
import { AlertCircle, Bell } from 'lucide-react';

interface AlertPanelProps {
  riskScore: number;
  onStartIntervention: () => void;
}

export function AlertPanel({ riskScore, onStartIntervention }: AlertPanelProps) {
  const isHighRisk = riskScore >= 60;
  const isCritical = riskScore >= 80;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-2xl shadow-lg p-6 border-2 ${
        isCritical
          ? 'bg-red-50 border-red-300'
          : 'bg-orange-50 border-orange-300'
      }`}
    >
      <div className="flex items-start gap-3 mb-4">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Bell className={`w-6 h-6 ${isCritical ? 'text-red-600' : 'text-orange-600'}`} />
        </motion.div>
        <div>
          <h3 className={`text-lg font-bold ${isCritical ? 'text-red-800' : 'text-orange-800'}`}>
            {isCritical ? '🚨 CRITICAL ALERT' : '⚠️ HIGH RISK DETECTED'}
          </h3>
          <p className={`text-sm mt-1 ${isCritical ? 'text-red-700' : 'text-orange-700'}`}>
            {isCritical
              ? 'Immediate intervention needed to prevent meltdown'
              : 'Sensory overload likely within 15-30 minutes'}
          </p>
        </div>
      </div>

      <div className={`p-4 rounded-lg mb-4 ${isCritical ? 'bg-red-100' : 'bg-orange-100'}`}>
        <p className={`text-sm font-semibold mb-2 ${isCritical ? 'text-red-900' : 'text-orange-900'}`}>
          Risk Factors Detected:
        </p>
        <ul className={`text-sm space-y-1 ${isCritical ? 'text-red-800' : 'text-orange-800'}`}>
          <li>• Elevated noise levels (stimulation building)</li>
          <li>• Movement patterns show stress</li>
          <li>• Poor sleep quality (reduced capacity)</li>
        </ul>
      </div>

      <motion.button
        onClick={onStartIntervention}
        className={`w-full py-3 px-4 rounded-lg font-bold text-white shadow-lg ${
          isCritical
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-orange-600 hover:bg-orange-700'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        START INTERVENTION NOW
      </motion.button>

      <p className="text-xs text-gray-600 mt-3 text-center">
        Early intervention prevents escalation
      </p>
    </motion.div>
  );
}
