import { Volume2, Activity, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface SensorPanelProps {
  noiseLevel: number;
  movementPattern: 'calm' | 'stimming' | 'agitated';
  brightness: number;
  sleepQuality: number;
}

export function SensorPanel({
  noiseLevel,
  movementPattern,
  brightness,
  sleepQuality,
}: SensorPanelProps) {
  const getNoiseColor = () => {
    if (noiseLevel < 60) return 'text-green-600';
    if (noiseLevel < 75) return 'text-yellow-600';
    if (noiseLevel < 85) return 'text-orange-600';
    return 'text-red-600';
  };

  const getMovementColor = () => {
    if (movementPattern === 'calm') return 'text-green-600';
    if (movementPattern === 'stimming') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBrightnessColor = () => {
    if (brightness < 300) return 'text-green-600';
    if (brightness < 500) return 'text-yellow-600';
    if (brightness < 1000) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSleepColor = () => {
    if (sleepQuality > 80) return 'text-green-600';
    if (sleepQuality > 60) return 'text-yellow-600';
    if (sleepQuality > 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Live Sensor Readings</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Noise Level */}
        <motion.div
          className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Volume2 className={`w-5 h-5 ${getNoiseColor()}`} />
              <span className="font-semibold text-gray-700">Noise Level</span>
            </div>
            <span className={`text-2xl font-bold ${getNoiseColor()}`}>
              {Math.round(noiseLevel)} dB
            </span>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`absolute top-0 left-0 bottom-0 ${
                noiseLevel < 60
                  ? 'bg-green-500'
                  : noiseLevel < 75
                  ? 'bg-yellow-500'
                  : noiseLevel < 85
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${(noiseLevel / 120) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {noiseLevel < 60 && 'Quiet - Safe environment'}
            {noiseLevel >= 60 && noiseLevel < 75 && 'Moderate - Monitor'}
            {noiseLevel >= 75 && noiseLevel < 85 && 'Loud - Caution'}
            {noiseLevel >= 85 && 'Very loud - High risk'}
          </p>
        </motion.div>

        {/* Movement Pattern */}
        <motion.div
          className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className={`w-5 h-5 ${getMovementColor()}`} />
              <span className="font-semibold text-gray-700">Movement</span>
            </div>
            <span className={`text-lg font-bold capitalize ${getMovementColor()}`}>
              {movementPattern}
            </span>
          </div>
          <div className="flex gap-1 mt-2">
            {['calm', 'stimming', 'agitated'].map((pattern) => (
              <div
                key={pattern}
                className={`flex-1 h-2 rounded-full ${
                  movementPattern === pattern
                    ? pattern === 'calm'
                      ? 'bg-green-500'
                      : pattern === 'stimming'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {movementPattern === 'calm' && 'Baseline - Regulated'}
            {movementPattern === 'stimming' && 'Self-regulating behavior'}
            {movementPattern === 'agitated' && 'Dysregulation detected'}
          </p>
        </motion.div>

        {/* Brightness */}
        <motion.div
          className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sun className={`w-5 h-5 ${getBrightnessColor()}`} />
              <span className="font-semibold text-gray-700">Brightness</span>
            </div>
            <span className={`text-2xl font-bold ${getBrightnessColor()}`}>
              {Math.round(brightness)} lux
            </span>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`absolute top-0 left-0 bottom-0 ${
                brightness < 300
                  ? 'bg-green-500'
                  : brightness < 500
                  ? 'bg-yellow-500'
                  : brightness < 1000
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${(brightness / 1500) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {brightness < 300 && 'Dim - Comfortable'}
            {brightness >= 300 && brightness < 500 && 'Moderate lighting'}
            {brightness >= 500 && brightness < 1000 && 'Bright - Monitor'}
            {brightness >= 1000 && 'Very bright - Risk'}
          </p>
        </motion.div>

        {/* Sleep Quality */}
        <motion.div
          className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Moon className={`w-5 h-5 ${getSleepColor()}`} />
              <span className="font-semibold text-gray-700">Last Night Sleep</span>
            </div>
            <span className={`text-2xl font-bold ${getSleepColor()}`}>
              {Math.round(sleepQuality)}%
            </span>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`absolute top-0 left-0 bottom-0 ${
                sleepQuality > 80
                  ? 'bg-green-500'
                  : sleepQuality > 60
                  ? 'bg-yellow-500'
                  : sleepQuality > 40
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${sleepQuality}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {sleepQuality > 80 && 'Great sleep - Protected'}
            {sleepQuality > 60 && sleepQuality <= 80 && 'Fair sleep'}
            {sleepQuality > 40 && sleepQuality <= 60 && 'Poor sleep - Vulnerable'}
            {sleepQuality <= 40 && 'Very poor - High risk today'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
