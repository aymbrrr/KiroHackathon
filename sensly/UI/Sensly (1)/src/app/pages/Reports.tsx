import { motion } from 'motion/react';
import { FileText, Download, Mail, Calendar, TrendingDown, CheckCircle } from 'lucide-react';

export function Reports() {
  const reportTypes = [
    {
      icon: Calendar,
      title: 'Weekly Summary',
      description: 'Comprehensive overview of risk scores, interventions, and patterns',
      frequency: 'Generated every Monday',
      color: 'blue',
    },
    {
      icon: TrendingDown,
      title: 'Progress Report',
      description: 'Month-over-month improvements and trend analysis',
      frequency: 'Generated monthly',
      color: 'green',
    },
    {
      icon: CheckCircle,
      title: 'IEP Documentation',
      description: 'Formatted for school IEP meetings with accommodations',
      frequency: 'On demand',
      color: 'purple',
    },
    {
      icon: FileText,
      title: 'Insurance Report',
      description: 'Clinical documentation for therapy pre-authorization',
      frequency: 'On demand',
      color: 'orange',
    },
  ];

  const recentReports = [
    {
      title: 'Weekly Summary - Week of May 27',
      date: 'May 2, 2026',
      size: '2.4 MB',
      type: 'PDF',
    },
    {
      title: 'Progress Report - April 2026',
      date: 'May 1, 2026',
      size: '1.8 MB',
      type: 'PDF',
    },
    {
      title: 'IEP Meeting Documentation',
      date: 'Apr 28, 2026',
      size: '3.1 MB',
      type: 'PDF',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate professional documentation for schools and providers</p>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 bg-${report.color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 text-${report.color}-600`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                  <div className="text-xs text-gray-500">{report.frequency}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Generate
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Preview Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Latest Weekly Summary Preview</h2>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Meltdowns</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">38%</div>
              <div className="text-sm text-gray-600">Avg Risk</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">8</div>
              <div className="text-sm text-gray-600">Interventions</div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">71%</div>
              <div className="text-sm text-gray-600">Sleep Quality</div>
            </div>
          </div>

          {/* Key Findings */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Key Findings</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>100% reduction in meltdown frequency compared to previous week</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>43% decrease in average daily risk score</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>8 successful early interventions prevented escalation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">→</span>
                <span>Sleep quality improved 11% (58% → 71%)</span>
              </li>
            </ul>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">1.</span>
                <span>Continue current intervention strategies (90% success rate with headphones)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">2.</span>
                <span>Maintain improved sleep routine to sustain lower risk levels</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">3.</span>
                <span>Schedule proactive sensory breaks at 10 AM and 2 PM (high-risk times identified)</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Recent Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Reports</h2>
        <div className="space-y-3">
          {recentReports.map((report, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{report.title}</div>
                  <div className="text-sm text-gray-500">
                    {report.date} • {report.size} • {report.type}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white rounded-lg transition-colors">
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-white rounded-lg transition-colors">
                  <Mail className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Export Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-purple-200"
      >
        <h3 className="font-semibold text-gray-900 mb-4">Export Options</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <button className="p-4 bg-white rounded-lg hover:shadow-lg transition-shadow text-left">
            <div className="font-semibold text-gray-900 mb-1">PDF Format</div>
            <div className="text-sm text-gray-600">Professional documents</div>
          </button>
          <button className="p-4 bg-white rounded-lg hover:shadow-lg transition-shadow text-left">
            <div className="font-semibold text-gray-900 mb-1">CSV Data</div>
            <div className="text-sm text-gray-600">Raw data for analysis</div>
          </button>
          <button className="p-4 bg-white rounded-lg hover:shadow-lg transition-shadow text-left">
            <div className="font-semibold text-gray-900 mb-1">Email Report</div>
            <div className="text-sm text-gray-600">Send to care team</div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
