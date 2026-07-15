import { cms, adminToken } from './cmsClient';
import type { ResultCategory, ResultInput, ResultOf } from '@/features/results/types';

/**
 * Admin CRUD for the Results CMS. Every method here requires a valid admin
 * session token (obtained via `login`), attached automatically by cmsClient.
 */
export const adminResultsApi = {
  /** Exchange the shared admin password for a session token; persists it. */
  async login(password: string): Promise<void> {
    const { token } = await cms.post<{ token: string }>('/admin/login', { json: { password } });
    adminToken.set(token);
  },

  logout(): void {
    adminToken.clear();
  },

  /** True if the stored token is still accepted by the server. */
  async validateSession(): Promise<boolean> {
    if (!adminToken.get()) return false;
    try {
      await cms.get('/admin/session', { auth: true });
      return true;
    } catch {
      return false;
    }
  },

  /** List all results in a category (published and unpublished). */
  list: <C extends ResultCategory>(category: C) =>
    cms
      .get<{ results: ResultOf<C>[] }>('/admin/results', { params: { category }, auth: true })
      .then((r) => r.results),

  create: <C extends ResultCategory>(category: C, input: ResultInput<C>) =>
    cms
      .post<{ result: ResultOf<C> }>('/admin/results', { params: { category }, json: input, auth: true })
      .then((r) => r.result),

  update: <C extends ResultCategory>(category: C, id: string, input: Partial<ResultInput<C>>) =>
    cms
      .put<{ result: ResultOf<C> }>(`/admin/results/${id}`, { params: { category }, json: input, auth: true })
      .then((r) => r.result),

  setPublished: <C extends ResultCategory>(category: C, id: string, published: boolean) =>
    cms
      .patch<{ result: ResultOf<C> }>(`/admin/results/${id}/publish`, {
        params: { category },
        json: { published },
        auth: true,
      })
      .then((r) => r.result),

  remove: (category: ResultCategory, id: string) =>
    cms.delete<void>(`/admin/results/${id}`, { params: { category }, auth: true }),

  /** Upload a student photo; returns the stored root-relative URL. */
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return cms.post<{ url: string; filename: string }>('/admin/upload', { body: fd, auth: true });
  },
};
