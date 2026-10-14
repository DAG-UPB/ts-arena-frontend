'use client';

import type { ScoreMetric } from '@/src/services/modelService';

const VIEWS: ScoreMetric[] = ['point', 'probabilistic'];

const LABEL: Record<ScoreMetric, string> = {
  point: 'Point',
  probabilistic: 'Probabilistic',
};

const DESCRIPTION: Record<ScoreMetric, string> = {
  point: 'Arena Score on the error of the point forecasts.',
  probabilistic:
    'Arena Score on the error of the quantile forecasts. Only models that submit quantiles are listed.',
};

interface MetricSwitchProps {
  value: ScoreMetric;
  onChange: (metric: ScoreMetric) => void;
}

/** Segmented control choosing between the point and the probabilistic Arena Score. */
export default function MetricSwitch({ value, onChange }: MetricSwitchProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Arena Score view"
      className="inline-flex rounded-md border border-gray-200 bg-white p-0.5"
    >
      {VIEWS.map((view) => {
        const selected = view === value;
        return (
          <button
            key={view}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${LABEL[view]} Arena Score`}
            title={DESCRIPTION[view]}
            onClick={() => onChange(view)}
            className={`inline-flex min-h-[32px] items-center rounded px-2.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
              selected ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {LABEL[view]}
          </button>
        );
      })}
    </div>
  );
}
