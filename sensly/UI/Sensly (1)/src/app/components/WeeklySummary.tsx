import { motion } from 'motion/react';
import { TrendingDown, Shield, Brain, Heart } from 'lucide-react';

export function WeeklySummary() {
  const stats = [
    {
      icon: Shield,
      label: 'Meltdowns Prevented',
      value: '3',
      subtext: 'This week',
      trend: 'success',
    },
    {
      icon: TrendingDown,
      label: 'Average Risk Score',
      value: '38%',
      previous: '67%',
      change: '-43%',
      trend: 'success',
    },
    {
      icon: Brain,
      label: 'Interventions Used',
      value: '5',
      subtext: '100% success rate',
      trend: 'info',
    },
    {
      icon: Heart,
      label: 'Sleep Quality',
      value: '71%',
      previous: '64%',
      change: '+11%',
      trend: 'success',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Weekly Summary</h3>
          <p className="text-sm text-gray-600 mt-1">
            Progress with Sensly
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">100%</div>
          <div className="text-xs text-gray-500">Success rate</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl ${
                stat.trend === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <Icon
                  className={`w-5 h-5 ${
                    stat.trend === 'success' ? 'text-green-600' : 'text-blue-600'
                  }`}
                />
                {stat.change && (
                  <span className="text-xs font-semibold text-green-600">
                    {stat.change}
                  </span>
                )}
              </div>
              <div
                className={`text-2xl font-bold mb-1 ${
                  stat.trend === 'success' ? 'text-green-700' : 'text-blue-700'
                }`}
              >
                {stat.value}
              </div>
              <div className="text-xs font-medium text-gray-600">
                {stat.label}
              </div>
              {stat.subtext && (
                <div className="text-xs text-gray-500 mt-1">{stat.subtext}</div>
              )}
              {stat.previous && (
                <div className="text-xs text-gray-500 mt-1">
                  Previously: {stat.previous}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200"
      >
        <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          AI Insights
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            ✨ <strong>Top trigger identified:</strong> Noise levels above 75dB combined
            with poor sleep quality
          </p>
          <p>
            🎯 <strong>Most effective intervention:</strong> Noise-canceling headphones + quiet
            space (90% success rate)
          </p>
          <p>
            💡 <strong>Recommendation:</strong> Prioritize sleep routine - better sleep
            correlates with 40% lower risk scores
          </p>
        </div>
      </motion.div>
    </div>
  );
}
