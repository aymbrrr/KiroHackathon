import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Headphones, Heart, Coffee, CheckCircle, ArrowRight } from 'lucide-react';

interface InterventionPanelProps {
  onComplete: () => void;
}

export function InterventionPanel({ onComplete }: InterventionPanelProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const interventionSteps = [
    {
      icon: Headphones,
      title: 'Move to Quiet Space',
      description: 'Guide Miles to a calm, low-stimulation environment',
      duration: 2,
    },
    {
      icon: Headphones,
      title: 'Noise-Canceling Headphones',
      description: 'Provide headphones to reduce auditory input',
      duration: 1,
    },
    {
      icon: Coffee,
      title: 'Chewy Snack',
      description: 'Offer proprioceptive input + address hunger',
      duration: 3,
    },
    {
      icon: Heart,
      title: 'Deep Breathing',
      description: '5 deep breaths together to regulate',
      duration: 2,
    },
  ];

  useEffect(() => {
    if (currentStep < interventionSteps.length) {
      const stepDuration = interventionSteps[currentStep].duration * 1000; // Convert to ms
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            // Move to next step after a brief delay
            setTimeout(() => {
              if (currentStep < interventionSteps.length - 1) {
                setCurrentStep((s) => s + 1);
                setProgress(0);
              }
            }, 500);
            return 100;
          }
          return prev + (100 / (stepDuration / 100));
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const handleComplete = () => {
    onComplete();
  };

  const isComplete = currentStep >= interventionSteps.length - 1 && progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-2xl shadow-lg p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200"
    >
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-bold text-blue-900">Intervention In Progress</h3>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {interventionSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isDone = index < currentStep || (index === currentStep && progress >= 100);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0.5, scale: 0.95 }}
                animate={{
                  opacity: isActive ? 1 : isDone ? 0.7 : 0.5,
                  scale: isActive ? 1 : 0.95,
                }}
                className={`p-4 rounded-lg ${
                  isActive
                    ? 'bg-white shadow-md border-2 border-blue-400'
                    : isDone
                    ? 'bg-green-50 border border-green-300'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isDone
                        ? 'bg-green-100'
                        : isActive
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Icon
                        className={`w-5 h-5 ${
                          isActive ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`font-semibold ${
                          isDone
                            ? 'text-green-700'
                            : isActive
                            ? 'text-blue-900'
                            : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </h4>
                      {isDone && (
                        <span className="text-xs text-green-600 font-medium">
                          ✓ Complete
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm mt-1 ${
                        isActive ? 'text-gray-700' : 'text-gray-500'
                      }`}
                    >
                      {step.description}
                    </p>
                    {isActive && (
                      <div className="mt-2">
                        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className="absolute top-0 left-0 bottom-0 bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-green-100 rounded-lg border-2 border-green-300"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h4 className="font-bold text-green-900">Intervention Complete!</h4>
          </div>
          <p className="text-sm text-green-800 mb-4">
            Miles should be feeling more regulated. Monitor for improvement in risk score.
          </p>
          <motion.button
            onClick={handleComplete}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Mark Complete & Continue Monitoring
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}

      {!isComplete && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 text-center">
            Following evidence-based intervention protocol...
          </p>
        </div>
      )}
    </motion.div>
  );
}
