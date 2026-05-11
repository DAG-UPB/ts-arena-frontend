import Link from 'next/link';
import type { Metadata } from 'next';
import { Newspaper } from 'lucide-react';
import Breadcrumbs from '@/src/components/Breadcrumbs';
import { posts } from '@/src/content/news';
import { CategoryBadge } from '@/src/content/news/CategoryBadge';

export const metadata: Metadata = {
  title: 'News — TS-Arena',
  description:
    'Platform updates, incident post-mortems, and investigations into past TS-Arena challenge rounds.',
};

function formatDate(iso: string): string {
  // ISO YYYY-MM-DD — render in a stable, locale-independent form so SSR and CSR match.
  const [y, m, d] = iso.split('-');
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthIdx = Number(m) - 1;
  if (Number.isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return iso;
  return `${months[monthIdx]} ${Number(d)}, ${y}`;
}

export default function NewsListPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: 'News', href: '/news' }]} />

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Newspaper className="w-7 h-7 text-blue-600 flex-shrink-0" />
            <h1 className="text-3xl font-bold text-gray-900">News</h1>
          </div>
          <p className="text-gray-600">
            Platform updates, incident post-mortems, and investigations into past
            challenge rounds.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 sm:p-8 text-sm text-gray-600">
            No posts yet. Check back soon.
          </div>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/news/${post.slug}`}
                  className="block bg-white shadow-sm rounded-lg border border-gray-200 p-6 sm:p-8 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <CategoryBadge category={post.category} />
                    <time
                      dateTime={post.date}
                      className="text-xs text-gray-500"
                    >
                      {formatDate(post.date)}
                    </time>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {post.summary}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
