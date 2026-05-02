import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X } from 'lucide-react';

interface AutoDemoProps {
  onScenarioStart?: (scenario: string) => void;
}

export function AutoDemo({ onScenarioStart }: AutoDemoProps) {
  const [showWelcome, setShowWelcome] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const startDemo = () => {
    setShowWelcome(false);
    if (onScenarioStart) {
      onScenarioStart('fire-drill');
    }
  };

  const dismiss = () => {
    setDismissed(true);
    setShowWelcome(false);
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                <Play className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Welcome to Sensly
              </h2>
              <p className="text-lg text-gray-600">
                Early warning system for autism meltdown prevention
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">🎯 The Problem</h3>
                <p className="text-sm text-blue-800">
                  Autism meltdowns seem random, but they're not. The signs are there 30
                  minutes before - we just can't see them.
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-2">✨ The Solution</h3>
                <p className="text-sm text-purple-800">
                  Sensly uses phone sensors (microphone, accelerometer, camera) to detect
                  sensory overload in real-time. Get alerts 30 minutes early. Intervene
                  before crisis.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">📊 The Impact</h3>
                <p className="text-sm text-green-800">
                  One family: 5 meltdowns/week → 0 meltdowns. Real-time data. Evidence-based
                  interventions. Peace of mind.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                onClick={startDemo}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-5 h-5" />
                See Live Demo
              </motion.button>
              <motion.button
                onClick={dismiss}
                className="px-6 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Explore Myself
              </motion.button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              💡 Use the Demo Controls at the bottom to simulate different scenarios
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
