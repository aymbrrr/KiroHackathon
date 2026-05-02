import { motion } from 'motion/react';
import { Heart, Headphones, Home, Coffee, Wind, Sparkles, Star, Plus } from 'lucide-react';

export function Interventions() {
  const interventions = [
    {
      icon: Headphones,
      name: 'Noise-Canceling Headphones',
      category: 'Auditory',
      successRate: 90,
      timesUsed: 12,
      avgDuration: '5 min',
      description: 'Reduce auditory input during overwhelming situations',
      color: 'blue',
    },
    {
      icon: Home,
      name: 'Quiet Space',
      category: 'Environmental',
      successRate: 85,
      timesUsed: 10,
      avgDuration: '8 min',
      description: 'Low-stimulation environment for regulation',
      color: 'purple',
    },
    {
      icon: Coffee,
      name: 'Chewy Snack',
      category: 'Proprioceptive',
      successRate: 75,
      timesUsed: 8,
      avgDuration: '3 min',
      description: 'Oral motor input + address hunger',
      color: 'orange',
    },
    {
      icon: Wind,
      name: 'Deep Breathing',
      category: 'Calming',
      successRate: 70,
      timesUsed: 6,
      avgDuration: '4 min',
      description: 'Regulated breathing to reduce arousal',
      color: 'green',
    },
    {
      icon: Heart,
      name: 'Weighted Blanket',
      category: 'Tactile',
      successRate: 80,
      timesUsed: 5,
      avgDuration: '10 min',
      description: 'Deep pressure for calming',
      color: 'pink',
    },
    {
      icon: Sparkles,
      name: 'Sensory Break',
      category: 'Movement',
      successRate: 78,
      timesUsed: 7,
      avgDuration: '6 min',
      description: 'Physical activity to regulate',
      color: 'indigo',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interventions</h1>
          <p className="text-gray-600 mt-1">Evidence-based strategies that work for your child</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Custom
        </button>
      </div>

      {/* Success Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white rounded-2xl shadow-lg"
        >
          <div className="text-sm font-medium text-gray-600 mb-2">Total Interventions</div>
          <div className="text-4xl font-bold text-purple-600 mb-1">48</div>
          <div className="text-sm text-gray-600">All time</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-white rounded-2xl shadow-lg"
        >
          <div className="text-sm font-medium text-gray-600 mb-2">Success Rate</div>
          <div className="text-4xl font-bold text-green-600 mb-1">82%</div>
          <div className="text-sm text-gray-600">Average across all strategies</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white rounded-2xl shadow-lg"
        >
          <div className="text-sm font-medium text-gray-600 mb-2">Avg Duration</div>
          <div className="text-4xl font-bold text-blue-600 mb-1">6m</div>
          <div className="text-sm text-gray-600">Time to regulation</div>
        </motion.div>
      </div>

      {/* Intervention Library */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interventions.map((intervention, index) => {
          const Icon = intervention.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-${intervention.color}-100 rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${intervention.color}-600`} />
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-semibold text-gray-700">{intervention.successRate}%</span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">{intervention.name}</h3>
              <div className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600 mb-3">
                {intervention.category}
              </div>

              <p className="text-sm text-gray-600 mb-4">{intervention.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div>
                  <div className="font-semibold text-gray-700">{intervention.timesUsed}</div>
                  <div className="text-xs">Times used</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">{intervention.avgDuration}</div>
                  <div className="text-xs">Avg duration</div>
                </div>
              </div>

              <button className={`w-full py-2 px-4 bg-${intervention.color}-50 text-${intervention.color}-700 rounded-lg font-semibold hover:bg-${intervention.color}-100 transition-colors`}>
                Start Now
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Start Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-purple-200"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Start Guide</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">When to Intervene</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">⚠️</span>
                <span>Risk score reaches 60% (elevated)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">🚨</span>
                <span>Risk score reaches 80% (critical)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">👁️</span>
                <span>You notice early warning signs (stimming, withdrawal)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Proactively before high-risk situations</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">How to Choose</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">1️⃣</span>
                <span>Check what worked last time (success rate)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">2️⃣</span>
                <span>Consider the environment (can you access quiet space?)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">3️⃣</span>
                <span>Combine strategies (headphones + snack)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">4️⃣</span>
                <span>Trust your instinct - you know your child best</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
