import { cms } from './cmsClient';
import type { ResultCategory, ResultOf } from '@/features/results/types';

/** Public (published-only) reads used by the landing page. */
export const resultsApi = {
  listPublished: <C extends ResultCategory>(category: C) =>
    cms
      .get<{ results: ResultOf<C>[] }>('/results', { params: { category } })
      .then((r) => r.results),
};
