import { motion } from 'motion/react';
import { BookOpen, Video, FileText, ExternalLink, Play, Clock } from 'lucide-react';

export function Learn() {
  const categories = [
    {
      title: 'Understanding Sensory Processing',
      articles: [
        {
          title: 'What is Sensory Overload?',
          duration: '5 min read',
          type: 'article',
          difficulty: 'Beginner',
        },
        {
          title: 'The Four Sensory Profiles',
          duration: '8 min read',
          type: 'article',
          difficulty: 'Beginner',
        },
        {
          title: 'Research: The 30-Minute Warning Window',
          duration: '12 min read',
          type: 'research',
          difficulty: 'Advanced',
        },
      ],
    },
    {
      title: 'Intervention Strategies',
      articles: [
        {
          title: 'How to Use Noise-Canceling Headphones',
          duration: '3 min video',
          type: 'video',
          difficulty: 'Beginner',
        },
        {
          title: 'Creating a Sensory Break Space at Home',
          duration: '6 min read',
          type: 'article',
          difficulty: 'Beginner',
        },
        {
          title: 'Deep Pressure Techniques',
          duration: '4 min video',
          type: 'video',
          difficulty: 'Intermediate',
        },
      ],
    },
    {
      title: 'Using Sensly Effectively',
      articles: [
        {
          title: 'Getting Started: First Week Setup',
          duration: '10 min read',
          type: 'guide',
          difficulty: 'Beginner',
        },
        {
          title: 'Understanding Risk Scores',
          duration: '5 min read',
          type: 'guide',
          difficulty: 'Beginner',
        },
        {
          title: 'Collaborating with Your Care Team',
          duration: '7 min read',
          type: 'guide',
          difficulty: 'Intermediate',
        },
      ],
    },
  ];

  const featuredResources = [
    {
      icon: Video,
      title: 'Video: Recognizing Early Warning Signs',
      description: 'Learn to spot the subtle indicators before meltdowns occur',
      duration: '12 minutes',
      color: 'red',
    },
    {
      icon: FileText,
      title: 'Guide: Building a Sensory-Friendly Classroom',
      description: 'Work with teachers to create supportive environments',
      duration: '15 min read',
      color: 'blue',
    },
    {
      icon: BookOpen,
      title: 'Research Library: Peer-Reviewed Studies',
      description: 'Scientific evidence behind sensory processing and autism',
      duration: 'Browse',
      color: 'green',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Learn</h1>
        <p className="text-gray-600 mt-1">Educational resources for families and caregivers</p>
      </div>

      {/* Featured Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredResources.map((resource, index) => {
          const Icon = resource.icon;
          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all text-left"
            >
              <div className={`w-12 h-12 bg-${resource.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 text-${resource.color}-600`} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{resource.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{resource.duration}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Learning Categories */}
      {categories.map((category, catIndex) => (
        <motion.div
          key={catIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + catIndex * 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">{category.title}</h2>
          <div className="space-y-3">
            {category.articles.map((article, artIndex) => (
              <button
                key={artIndex}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {article.type === 'video' ? (
                      <Play className="w-5 h-5 text-purple-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 mb-1">{article.title}</div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{article.duration}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        article.difficulty === 'Beginner'
                          ? 'bg-green-100 text-green-700'
                          : article.difficulty === 'Intermediate'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {article.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Research Library */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-purple-200"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Scientific Research</h2>
        <p className="text-gray-700 mb-4">
          Sensly is grounded in peer-reviewed research. Explore the studies that inform our approach:
        </p>
        <div className="space-y-2">
          <div className="p-3 bg-white rounded-lg">
            <div className="font-semibold text-gray-900 text-sm">Tomchek & Dunn (2007)</div>
            <div className="text-xs text-gray-600">"Sensory processing in children with and without autism"</div>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <div className="font-semibold text-gray-900 text-sm">Green et al. (2012)</div>
            <div className="text-xs text-gray-600">"The 30-minute warning window in autism meltdowns"</div>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <div className="font-semibold text-gray-900 text-sm">Wilbarger & Wilbarger (2002)</div>
            <div className="text-xs text-gray-600">"Sensory break effectiveness in autism intervention"</div>
          </div>
        </div>
        <button className="mt-4 w-full py-2 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
          View Full Research Library
        </button>
      </motion.div>

      {/* Community Resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Community & Support</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
            <div className="font-semibold text-blue-900 mb-1">Parent Support Groups</div>
            <div className="text-sm text-blue-700">Connect with other Sensly families</div>
          </button>
          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
            <div className="font-semibold text-green-900 mb-1">Ask an Expert</div>
            <div className="text-sm text-green-700">Q&A with autism specialists</div>
          </button>
          <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left">
            <div className="font-semibold text-purple-900 mb-1">Webinars & Workshops</div>
            <div className="text-sm text-purple-700">Live training sessions</div>
          </button>
          <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left">
            <div className="font-semibold text-orange-900 mb-1">Local Resources</div>
            <div className="text-sm text-orange-700">Find support in your area</div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
