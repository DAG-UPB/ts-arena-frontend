import type { ComponentType } from 'react';

/**
 * Editorial category for a model family.
 *  - foundation-model — pretrained TS foundation model (Chronos, TimesFM, …)
 *  - statistical      — rule-based / classical baseline (Naive, Seasonal Naive, …)
 */
export type ModelCategory = 'foundation-model' | 'statistical';

export interface ModelLinks {
  /** Paper / arXiv landing page. */
  paper?: string;
  /** Source code repository. */
  repo?: string;
  /** Org / blog / docs site. */
  website?: string;
}

export interface ModelVersion {
  /**
   * Canonical readable id used as the model's `readable_id` in the backend
   * (lower-case, kebab-case). The detail page fuzzy-matches this against
   * the rankings API to resolve the numeric model id, then links to
   * `/models/<modelId>`.
   */
  readableId: string;
  /** Human display name (e.g. "TimesFM 2.5 200M"). */
  displayName: string;
  /** Parameter count in millions. 0 for non-parametric / rule-based. */
  sizeM: number;
  /** Optional one-line note distinguishing this version (training data, ctx/horizon, etc.). */
  note?: string;
  /** ISO publishing date (YYYY-MM-DD), mirrors backend metadata. */
  date?: string;
}

export interface ModelFamilyMetadata {
  /** URL slug, lower-case, kebab-case. Must match the file name (sans extension). */
  slug: string;
  /** Display name (e.g. "TimesFM"). */
  name: string;
  /** Vendor / authoring group. */
  vendor: string;
  /** Editorial category — drives the badge colour. */
  category: ModelCategory;
  /** One-line summary shown in the listing card and at the top of the detail page. */
  summary: string;
  /** External links (paper / repo / website). */
  links: ModelLinks;
  /** Versions present in TS-Arena (matched to backend `readable_id`s). */
  versions: ModelVersion[];
}

export interface ModelFamilyEntry extends ModelFamilyMetadata {
  /** Longer-form description body rendered on the family detail page. */
  Component: ComponentType;
}
