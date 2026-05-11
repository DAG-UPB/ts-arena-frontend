import type { ReactNode } from 'react';

/**
 * Wrapper that applies consistent typography to post bodies.
 * The actual styling lives in `globals.css` under `.prose-news` so we can
 * keep the rules out of Tailwind utility-class soup.
 */
export function Prose({ children }: { children: ReactNode }) {
  return <div className="prose-news">{children}</div>;
}
