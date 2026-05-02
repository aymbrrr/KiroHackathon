import { motion } from 'motion/react';
import { Sliders, Zap } from 'lucide-react';
import { useState } from 'react';

interface DemoControlsProps {
  noiseLevel: number;
  setNoiseLevel: (value: number) => void;
  movementPattern: 'calm' | 'stimming' | 'agitated';
  setMovementPattern: (value: 'calm' | 'stimming' | 'agitated') => void;
  brightness: number;
  setBrightness: (value: number) => void;
  sleepQuality: number;
  setSleepQuality: (value: number) => void;
}

export function DemoControls({
  noiseLevel,
  setNoiseLevel,
  movementPattern,
  setMovementPattern,
  brightness,
  setBrightness,
  sleepQuality,
  setSleepQuality,
}: DemoControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const simulateFireDrill = () => {
    setNoiseLevel(95);
    setBrightness(850);
    setMovementPattern('agitated');
  };

  const simulateQuietRoom = () => {
    setNoiseLevel(42);
    setBrightness(250);
    setMovementPattern('calm');
  };

  const simulateGroceryStore = () => {
    setNoiseLevel(75);
    setBrightness(650);
    setMovementPattern('stimming');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 bg-white rounded-2xl shadow-lg border-2 border-purple-200 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold flex items-center justify-between hover:from-purple-600 hover:to-blue-600 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5" />
          <span>Demo Controls</span>
          <span className="text-xs bg-white/20 px-2 py-1 rounded">
            Interactive Mode
          </span>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          ▼
        </motion.span>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          className="p-6"
        >
          {/* Quick Scenarios */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              Quick Scenarios
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <motion.button
                onClick={simulateFireDrill}
                className="p-3 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-left">
                  <div className="font-semibold text-red-700">🚨 Fire Drill</div>
                  <div className="text-xs text-red-600 mt-1">
                    Loud alarm + bright lights
                  </div>
                </div>
              </motion.button>

              <motion.button
                onClick={simulateGroceryStore}
                className="p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-left">
                  <div className="font-semibold text-yellow-700">🛒 Grocery Store</div>
                  <div className="text-xs text-yellow-600 mt-1">
                    Moderate noise + bright lighting
                  </div>
                </div>
              </motion.button>

              <motion.button
                onClick={simulateQuietRoom}
                className="p-3 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-left">
                  <div className="font-semibold text-green-700">😌 Quiet Room</div>
                  <div className="text-xs text-green-600 mt-1">
                    Calm environment
                  </div>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Manual Controls */}
          <div className="space-y-6">
            <h4 className="font-semibold text-gray-700">Manual Adjustments</h4>

            {/* Noise Level */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Noise Level
                </label>
                <span className="text-sm font-bold text-purple-600">
                  {Math.round(noiseLevel)} dB
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="110"
                value={noiseLevel}
                onChange={(e) => setNoiseLevel(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Quiet (40)</span>
                <span>Moderate (70)</span>
                <span>Loud (110)</span>
              </div>
            </div>

            {/* Movement Pattern */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Movement Pattern
              </label>
              <div className="flex gap-2">
                {(['calm', 'stimming', 'agitated'] as const).map((pattern) => (
                  <button
                    key={pattern}
                    onClick={() => setMovementPattern(pattern)}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                      movementPattern === pattern
                        ? pattern === 'calm'
                          ? 'bg-green-500 text-white'
                          : pattern === 'stimming'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Brightness */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Brightness
                </label>
                <span className="text-sm font-bold text-purple-600">
                  {Math.round(brightness)} lux
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="1200"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Dim (100)</span>
                <span>Office (500)</span>
                <span>Bright (1200)</span>
              </div>
            </div>

            {/* Sleep Quality */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Sleep Quality (Last Night)
                </label>
                <span className="text-sm font-bold text-purple-600">
                  {Math.round(sleepQuality)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sleepQuality}
                onChange={(e) => setSleepQuality(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Poor (0%)</span>
                <span>Fair (50%)</span>
                <span>Great (100%)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-700 text-center">
              💡 Try the scenarios above or adjust sliders to see how risk score changes
              in real-time
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
