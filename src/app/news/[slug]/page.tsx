import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Breadcrumbs from '@/src/components/Breadcrumbs';
import { posts, findPost } from '@/src/content/news';
import { CategoryBadge } from '@/src/content/news/CategoryBadge';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) {
    return { title: 'Not found — TS-Arena' };
  }
  return {
    title: `${post.title} — TS-Arena`,
    description: post.summary,
  };
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthIdx = Number(m) - 1;
  if (Number.isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return iso;
  return `${months[monthIdx]} ${Number(d)}, ${y}`;
}

export default async function NewsPostPage({ params }: RouteParams) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) {
    notFound();
  }

  const PostBody = post.Component;
  const author = post.author ?? 'TS-Arena team';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: 'News', href: '/news' },
            { label: post.title, href: `/news/${post.slug}` },
          ]}
        />

        <article className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 sm:p-8">
          <header className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <CategoryBadge category={post.category} />
              <time dateTime={post.date} className="text-xs text-gray-500">
                {formatDate(post.date)}
              </time>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{author}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {post.title}
            </h1>
            <p className="text-gray-600 leading-relaxed">{post.summary}</p>
          </header>

          <PostBody />
        </article>

        <div className="mt-6">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all news
          </Link>
        </div>
      </div>
    </div>
  );
}
