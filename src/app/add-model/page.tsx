import Breadcrumbs from '@/src/components/Breadcrumbs';
import { Key, TrendingUp, Trophy, BarChart3, Users, CheckCircle } from 'lucide-react';

export default function InfoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Add Model', href: '/add-model' }]} />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Join the TS-Arena Benchmark</h1>
        <p className="mt-2 text-gray-600">
          Test your forecasting models against the best in real-time benchmark challenges
        </p>
      </div>

      {/* Main CTA Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Get Started</h2>
        <p className="text-gray-700 mb-4">
          Ready to test your forecasting models against the best? Participate actively in our benchmark challenges!
          Simply send us an email and we&apos;ll provide you with an API key to get started.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Double-blind review:</span>{' '}
            Contact details and repository links have been redacted. They will be restored after the review period.
          </p>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">How it Works</h2>
        <div className="space-y-4 text-gray-700">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
              1
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Request an API Key</h3>
              <p className="text-sm text-gray-600">
                Email us with your organization name and we&apos;ll send you an API key.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
              2
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Register Your Model</h3>
              <p className="text-sm text-gray-600">
                Use your API key to register models for challenges in the registration phase.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
              3
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Submit Forecasts</h3>
              <p className="text-sm text-gray-600">
                Obtain time-series context via our API and submit your forecasts before registration closes.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
              4
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Track Performance</h3>
              <p className="text-sm text-gray-600">
                During the active phase, your model is evaluated on live data. Monitor performance on leaderboards and explore forecasts through interactive plots.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">What You Get</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <Key className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">Personal API Key</h3>
              <p className="text-sm text-gray-600">For model registration and submission</p>
            </div>
          </div>

          <div className="flex gap-3">
            <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">Benchmark Datasets</h3>
              <p className="text-sm text-gray-600">Access to datasets and challenge specifications</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Trophy className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">Rankings & Leaderboards</h3>
              <p className="text-sm text-gray-600">Real-time performance tracking</p>
            </div>
          </div>

          <div className="flex gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">Detailed Metrics</h3>
              <p className="text-sm text-gray-600">Comprehensive evaluation across time series</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">Community Support</h3>
              <p className="text-sm text-gray-600">Connect with forecasting researchers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
        <div className="space-y-2">
          <div className="flex gap-2 items-start">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Valid organization or affiliation</span>
          </div>
          <div className="flex gap-2 items-start">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Commitment to fair participation</span>
          </div>
          <div className="flex gap-2 items-start">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Adherence to benchmark guidelines</span>
          </div>
        </div>
      </div>

      {/* Model Validation Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Help Us Validate Model Implementations</h2>
          <p className="text-gray-700">
            Transparency is at the heart of our live benchmarking project. We have integrated a wide range of
            state-of-the-art time series forecasting models to provide the community with real-time performance insights.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-gray-700 mb-3">
            To ensure that every model is evaluated under optimal conditions, <strong>we invite the original authors
              and maintainers to review our implementations.</strong> If you are a developer of one of the featured models,
            we would value your feedback on:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex gap-2 items-start text-gray-700">
              <span className="text-blue-600 font-bold">•</span>
              <span>Model configuration and hyperparameters</span>
            </li>
            <li className="flex gap-2 items-start text-gray-700">
              <span className="text-blue-600 font-bold">•</span>
              <span>Data preprocessing steps</span>
            </li>
            <li className="flex gap-2 items-start text-gray-700">
              <span className="text-blue-600 font-bold">•</span>
              <span>Implementation-specific nuances</span>
            </li>
          </ul>
        </div>

        <p className="text-gray-700 mb-4">
          Our goal is to represent your work as accurately as possible. Please visit our repository
          to review the code or open an issue for any suggested improvements.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Double-blind review:</span>{' '}
            The repository link has been redacted and will be restored after the review period.
          </p>
        </div>
      </div>
    </div>
  );
}
