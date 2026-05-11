import type { ModelCategory } from './types';

const styles: Record<ModelCategory, { label: string; className: string }> = {
  'foundation-model': {
    label: 'Foundation Model',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  statistical: {
    label: 'Statistical Baseline',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
};

export function CategoryBadge({ category }: { category: ModelCategory }) {
  const { label, className } = styles[category];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${className}`}
    >
      {label}
    </span>
  );
}
