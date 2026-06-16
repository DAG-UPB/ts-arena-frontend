import Link from 'next/link';
import type { Metadata } from 'next';
import { Boxes, Plus } from 'lucide-react';
import Breadcrumbs from '@/src/components/Breadcrumbs';
import { families } from '@/src/content/models';
import { CategoryBadge } from '@/src/content/models/CategoryBadge';

export const metadata: Metadata = {
  title: 'Models — TS-Arena',
  description:
    'Time-series foundation models and statistical baselines evaluated on TS-Arena: descriptions, papers, repositories, and the specific checkpoints in use.',
};

export default function ModelsListPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: 'Models', href: '/models' }]} />

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Boxes className="w-7 h-7 text-blue-600 flex-shrink-0" />
              <h1 className="text-3xl font-bold text-gray-900">Models</h1>
            </div>
            <p className="text-gray-600 max-w-3xl">
              Time-series foundation models and statistical baselines evaluated
              on TS-Arena. Click a family for a description, links to the
              original paper / repo / website, and the specific checkpoints we
              run.
            </p>
          </div>
          <Link
            href="/add-model"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Model
          </Link>
        </div>

        {families.length === 0 ? (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 sm:p-8 text-sm text-gray-600">
            No models registered yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {families.map((family) => (
              <li key={family.slug}>
                <Link
                  href={`/models/family/${family.slug}`}
                  className="block bg-white shadow-sm rounded-lg border border-gray-200 p-6 sm:p-8 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <CategoryBadge category={family.category} />
                    <span className="text-xs text-gray-500">
                      {family.vendor}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">
                      {family.versions.length}{' '}
                      {family.versions.length === 1 ? 'version' : 'versions'}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    {family.name}
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {family.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {family.versions.map((v) => (
                      <span
                        key={v.readableId}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        {v.displayName}
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
