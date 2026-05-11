import type { PostCategory } from './types';

const STYLES: Record<PostCategory, { label: string; classes: string }> = {
  feature: {
    label: 'Feature',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  incident: {
    label: 'Incident',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  investigation: {
    label: 'Investigation',
    classes: 'bg-purple-50 text-purple-700 border-purple-200',
  },
};

export function CategoryBadge({ category }: { category: PostCategory }) {
  const { label, classes } = STYLES[category];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${classes}`}
    >
      {label}
    </span>
  );
}
