import Breadcrumbs from '@/src/components/Breadcrumbs';
import { BookOpen, Users, FlaskConical, BarChart3 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: 'About', href: '/about' }]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">About TS-Arena</h1>
          <p className="mt-2 text-gray-600">
            A live benchmarking platform for Time Series Foundation Models using forecast pre-registration.
          </p>
        </div>

        {/* Paper Section */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <h2 className="text-xl font-semibold text-gray-900">Research Paper</h2>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              TS-Arena: A Live Forecast Pre-Registration Platform
            </h3>
            <p className="text-sm text-gray-500">
              Marcel Meyer, Sascha Kaltenpoth, Henrik Albers, Kevin Zalipski, Oliver Müller &mdash; Paderborn University, Data Analytics Group
            </p>
          </div>

          <div className="bg-gray-50 rounded-md p-4 mb-5 text-sm text-gray-700 leading-relaxed border border-gray-200">
            <span className="font-semibold text-gray-800">Abstract. </span>
            TS-Arena is a live benchmarking platform that evaluates Time Series Foundation Models (TSFMs) by
            requiring forecast submissions <em>before</em> ground-truth data exists — a &ldquo;forecast
            pre-registration protocol.&rdquo; This design eliminates test-set contamination and information
            leakage, since the evaluation target physically does not exist at submission time. The platform
            continuously collects forecasts from models across 186 energy-sector time series in 14 challenge
            definitions, scores them with MASE, and ranks them using an ELO rating system with confidence
            intervals. Backtest results from 2025 show that modern foundation models substantially outperform
            statistical baselines, with Chronos-2 and TiRex leading the overall ranking, and that model size
            generally correlates with performance.
          </div>

          <a
            href="https://arxiv.org/abs/2512.20761"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            Read on arXiv
          </a>
        </div>

        {/* Platform Overview */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FlaskConical className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <h2 className="text-xl font-semibold text-gray-900">How It Works</h2>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            TS-Arena runs continuously scheduled forecasting challenges on real-world energy data. When a new
            challenge round opens, models have a registration window to submit their forecasts for a future
            time period. Once the ground truth becomes available, submitted forecasts are automatically
            evaluated and rankings are updated.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="font-semibold text-gray-800 text-sm mb-1">Pre-Registration</div>
              <p className="text-xs text-gray-600">Forecasts must be submitted before ground truth exists, making data leakage structurally impossible.</p>
            </div>
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="font-semibold text-gray-800 text-sm mb-1">MASE Scoring</div>
              <p className="text-xs text-gray-600">Mean Absolute Scaled Error provides scale-independent accuracy scores comparable across time series.</p>
            </div>
            <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
              <div className="font-semibold text-gray-800 text-sm mb-1">ELO Ranking</div>
              <p className="text-xs text-gray-600">Pairwise ELO ratings with confidence intervals enable fair comparison between models over time.</p>
            </div>
          </div>
        </div>

        {/* Data */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <h2 className="text-xl font-semibold text-gray-900">Data & Challenges</h2>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            The benchmark covers 186 energy-sector time series from multiple European and North American grid
            operators (SMARD, EIA, Fingrid, ENTSO-E, GridStatus), organized into 14 challenge definitions with
            varying forecast frequencies (15 min, 1 h) and horizons (1 day, 1 week). Challenges span
            electricity consumption and generation, providing diverse conditions for a thorough model
            evaluation.
          </p>
        </div>

        {/* Team */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <h2 className="text-xl font-semibold text-gray-900">Team</h2>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            TS-Arena is developed by the{' '}
            <a
              href="https://go.upb.de/data-analytics"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Data Analytics Group
            </a>{' '}
            at Paderborn University, Germany.
          </p>
          <div className="flex flex-wrap gap-2 text-sm text-gray-700">
            {['Marcel Meyer', 'Sascha Kaltenpoth', 'Henrik Albers', 'Kevin Zalipski', 'Prof. Dr. Oliver Müller'].map((name) => (
              <span key={name} className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200">{name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
