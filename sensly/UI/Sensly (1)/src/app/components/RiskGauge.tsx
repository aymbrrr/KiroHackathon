import { motion } from 'motion/react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface RiskGaugeProps {
  score: number;
}

export function RiskGauge({ score }: RiskGaugeProps) {
  const getRiskLevel = () => {
    if (score < 30) return { level: 'Low', color: 'green', icon: CheckCircle };
    if (score < 60) return { level: 'Elevated', color: 'yellow', icon: AlertTriangle };
    if (score < 80) return { level: 'High', color: 'orange', icon: AlertCircle };
    return { level: 'Critical', color: 'red', icon: AlertCircle };
  };

  const { level, color, icon: Icon } = getRiskLevel();

  const getColor = () => {
    if (score < 30) return '#4FB3BF'; // calm teal
    if (score < 60) return '#7DCDD6'; // light teal
    if (score < 80) return '#EF9A53'; // warm orange
    return '#EF6C72'; // soft coral
  };

  const strokeColor = getColor();

  // Calculate stroke dasharray for circular progress
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-lg p-8 border border-[#4FB3BF]/20">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#1A4D55]">Risk Score</h2>
        <p className="text-sm text-[#2A6B76] mt-1">Real-time sensory overload risk</p>
      </div>

      <div className="flex flex-col items-center">
        {/* Circular Gauge */}
        <div className="relative w-80 h-80">
          <svg className="transform -rotate-90 w-full h-full">
            {/* Background circle */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke="rgba(79, 179, 191, 0.2)"
              strokeWidth="24"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="160"
              cy="160"
              r={radius}
              stroke={strokeColor}
              strokeWidth="24"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              <Icon className="w-16 h-16 mb-4" style={{ color: strokeColor }} />
            </motion.div>
            <motion.div
              className="text-6xl font-bold"
              style={{ color: strokeColor }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {Math.round(score)}%
            </motion.div>
            <div className="text-xl font-semibold text-[#2A6B76] mt-2">
              {level} Risk
            </div>
          </div>
        </div>

        {/* Risk Level Indicators */}
        <div className="mt-8 w-full max-w-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-[#2A6B76]">Risk Level</span>
            <span className="text-xs text-[#7DCDD6]">0% - 100%</span>
          </div>
          <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
            <div className="absolute inset-0 flex">
              <div className="bg-[#4FB3BF] flex-1"></div>
              <div className="bg-[#7DCDD6] flex-1"></div>
              <div className="bg-[#EF9A53] flex-1"></div>
              <div className="bg-[#EF6C72] flex-1"></div>
            </div>
            <motion.div
              className="absolute top-0 bottom-0 w-1 bg-white border-2 border-[#E8F6F8]"
              initial={{ left: '0%' }}
              animate={{ left: `${score}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-[#2A6B76]">
            <span>Low</span>
            <span>Elevated</span>
            <span>High</span>
            <span>Critical</span>
          </div>
        </div>

        {/* Status Message */}
        <motion.div
          className={`mt-6 p-4 rounded-2xl w-full max-w-md ${
            score < 30
              ? 'bg-[#4FB3BF]/20 border border-[#4FB3BF]/40'
              : score < 60
              ? 'bg-[#7DCDD6]/20 border border-[#7DCDD6]/40'
              : score < 80
              ? 'bg-orange-500/20 border border-orange-400/40'
              : 'bg-red-500/20 border border-red-400/40'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-sm text-center font-medium text-[#1A4D55]">
            {score < 30 && 'Currently regulated. Continue monitoring.'}
            {score >= 30 && score < 60 && 'Stress building. Monitor closely.'}
            {score >= 60 && score < 80 && 'High risk detected. Intervention recommended.'}
            {score >= 80 && 'IMMEDIATE INTERVENTION NEEDED'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
