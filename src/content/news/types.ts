import type { ComponentType } from 'react';

/**
 * Editorial category for a news post.
 *  - feature       — new functionality, capabilities, models, dashboards
 *  - incident      — bug or outage post-mortem, what went wrong, what changed
 *  - investigation — deeper analysis of past rounds, data quality, scoring
 */
export type PostCategory = 'feature' | 'incident' | 'investigation';

export interface PostMetadata {
  /** URL slug, lower-case, kebab-case. Must match the file name (sans extension). */
  slug: string;
  /** Display title. */
  title: string;
  /** ISO date YYYY-MM-DD. Used for sorting and display. */
  date: string;
  /** One-line summary shown in the listing and at the top of the post page. */
  summary: string;
  /** Editorial category — drives the badge colour and the section label. */
  category: PostCategory;
  /** Optional author name. Falls back to "TS-Arena team" if omitted. */
  author?: string;
}

export interface PostEntry extends PostMetadata {
  Component: ComponentType;
}
