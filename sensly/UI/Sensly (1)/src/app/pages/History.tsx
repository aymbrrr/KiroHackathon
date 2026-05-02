import { motion } from 'motion/react';
import { Calendar, Filter, Download, TrendingDown, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function History() {
  const mockData = [
    { date: 'Mon', risk: 42, meltdowns: 0, interventions: 1 },
    { date: 'Tue', risk: 55, meltdowns: 0, interventions: 2 },
    { date: 'Wed', risk: 38, meltdowns: 0, interventions: 1 },
    { date: 'Thu', risk: 68, meltdowns: 0, interventions: 3 },
    { date: 'Fri', risk: 35, meltdowns: 0, interventions: 1 },
    { date: 'Sat', risk: 28, meltdowns: 0, interventions: 0 },
    { date: 'Sun', risk: 32, meltdowns: 0, interventions: 0 },
  ];

  const events = [
    {
      time: 'Today, 2:30 PM',
      type: 'intervention',
      title: 'Intervention Successful',
      description: 'Sensory break prevented high risk situation (Risk: 78% → 32%)',
      color: 'green',
    },
    {
      time: 'Today, 9:15 AM',
      type: 'alert',
      title: 'High Risk Alert',
      description: 'Fire drill detected - Noise: 95dB, Movement: Agitated',
      color: 'orange',
    },
    {
      time: 'Yesterday, 3:45 PM',
      type: 'intervention',
      title: 'Intervention Successful',
      description: 'Quiet space + headphones (Risk: 72% → 28%)',
      color: 'green',
    },
    {
      time: 'Yesterday, 10:20 AM',
      type: 'log',
      title: 'Parent Note',
      description: 'Rough night sleep - extra support needed today',
      color: 'blue',
    },
    {
      time: '2 days ago, 4:10 PM',
      type: 'intervention',
      title: 'Intervention Successful',
      description: 'Grocery store visit - headphones + chewy snack',
      color: 'green',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">History</h1>
          <p className="text-gray-600 mt-1">Track patterns and progress over time</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white rounded-2xl shadow-lg border-2 border-green-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">This Week</div>
            <TrendingDown className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">0</div>
          <div className="text-sm text-gray-600">Meltdowns</div>
          <div className="text-xs text-green-600 mt-1">↓ 100% from last week</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-white rounded-2xl shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Avg Risk Score</div>
            <TrendingDown className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-600">38%</div>
          <div className="text-sm text-gray-600">This week</div>
          <div className="text-xs text-blue-600 mt-1">↓ 43% from last week</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white rounded-2xl shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Interventions</div>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-600">8</div>
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-xs text-purple-600 mt-1">100% success rate</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-white rounded-2xl shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Sleep Quality</div>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-indigo-600">71%</div>
          <div className="text-sm text-gray-600">Average</div>
          <div className="text-xs text-indigo-600 mt-1">↑ 11% from last week</div>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Risk Score Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockData} id="history-risk-chart">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Line type="monotone" dataKey="risk" stroke="#8b5cf6" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0 w-2">
                <div className={`w-2 h-2 rounded-full mt-2 bg-${event.color}-500`} />
                {index < events.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-200 mx-auto mt-2" />
                )}
              </div>
              <div className="flex-1 pb-6">
                <div className="text-sm text-gray-500 mb-1">{event.time}</div>
                <div className="font-semibold text-gray-900">{event.title}</div>
                <div className="text-sm text-gray-600 mt-1">{event.description}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}