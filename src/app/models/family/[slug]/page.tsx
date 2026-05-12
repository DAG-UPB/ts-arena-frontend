'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  FileText,
  Github,
  Globe,
} from 'lucide-react';
import Breadcrumbs from '@/src/components/Breadcrumbs';
import { findFamily } from '@/src/content/models';
import { CategoryBadge } from '@/src/content/models/CategoryBadge';
import {
  getAllModels,
  type ModelListItem,
} from '@/src/services/modelService';

/**
 * Build a strict `readable_id -> model_id` map from the dashboard-api
 * models list. No fuzzy fallback — the backend now owns this lookup
 * (frontend ticket #33, backend ticket #43).
 */
function buildReadableIdToModelId(
  models: ModelListItem[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const m of models) {
    if (m.readable_id) {
      map.set(m.readable_id, m.id);
    }
  }
  return map;
}

export default function ModelFamilyPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const family = useMemo(() => (slug ? findFamily(slug) : null), [slug]);

  const [models, setModels] = useState<ModelListItem[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchModels = async () => {
      try {
        const list = await getAllModels();
        if (!cancelled) setModels(list);
      } catch (err) {
        console.error('Error fetching models list:', err);
      } finally {
        if (!cancelled) setModelsLoaded(true);
      }
    };
    fetchModels();
    return () => {
      cancelled = true;
    };
  }, []);

  const idMap = useMemo(() => buildReadableIdToModelId(models), [models]);

  if (!family) {
    if (slug !== undefined) notFound();
    return null;
  }

  const FamilyBody = family.Component;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: 'Models', href: '/models' },
            { label: family.name, href: `/models/family/${family.slug}` },
          ]}
        />

        <article className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 sm:p-8">
          <header className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <CategoryBadge category={family.category} />
              <span className="text-xs text-gray-500">{family.vendor}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {family.name}
            </h1>
            <p className="text-gray-600 leading-relaxed">{family.summary}</p>

            {(family.links.paper ||
              family.links.repo ||
              family.links.website) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {family.links.paper && (
                  <a
                    href={family.links.paper}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Paper
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                  </a>
                )}
                {family.links.repo && (
                  <a
                    href={family.links.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                    Repository
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                  </a>
                )}
                {family.links.website && (
                  <a
                    href={family.links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Website
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                  </a>
                )}
              </div>
            )}
          </header>

          <div className="prose prose-sm max-w-none text-gray-800 space-y-4 leading-relaxed">
            <FamilyBody />
          </div>

          <section className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Versions on TS-Arena
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Each version below corresponds to one registered model id in the
              leaderboard. Click through to its detail page for per-model
              rankings, forecasts, and history.
            </p>

            <ul className="space-y-3">
              {family.versions.map((version) => {
                const modelId = idMap.get(version.readableId);
                const linked = typeof modelId === 'number';
                const cardClass = linked
                  ? 'block bg-white border border-gray-200 rounded-md p-4 hover:border-blue-300 hover:shadow-sm transition-all'
                  : 'block bg-gray-50 border border-gray-200 rounded-md p-4 opacity-70';

                const inner = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {version.displayName}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 font-mono">
                          {version.readableId}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {version.sizeM > 0 && (
                          <span className="text-xs text-gray-600 whitespace-nowrap">
                            {version.sizeM}M params
                          </span>
                        )}
                        {linked ? (
                          <ArrowRight className="w-4 h-4 text-blue-600" />
                        ) : (
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {modelsLoaded ? 'not registered' : '…'}
                          </span>
                        )}
                      </div>
                    </div>
                    {version.note && (
                      <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                        {version.note}
                      </p>
                    )}
                  </>
                );

                return (
                  <li key={version.readableId}>
                    {linked ? (
                      <Link
                        href={`/models/${modelId}`}
                        className={cardClass}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className={cardClass}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </article>

        <div className="mt-6">
          <Link
            href="/models"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all models
          </Link>
        </div>
      </div>
    </div>
  );
}
