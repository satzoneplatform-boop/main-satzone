import type {
  Category,
  CategoryTreeNode,
  InstructorRead,
  InstructorSummary,
  Page,
  ProgramDetail,
  ProgramEnrollmentRead,
  ProgramSummary,
} from '@/types/api';
import { api } from './client';
import {
  normalizeInstructorRead,
  normalizeInstructorSummary,
  normalizePage,
} from './normalize';

export interface InstructorListParams {
  search?: string;
  page?: number;
  size?: number;
}

export const catalogApi = {
  categories() {
    return api.get<Category[]>('/categories');
  },
  categoryTree() {
    return api.get<CategoryTreeNode[]>('/categories/tree');
  },

  programs(params: { page?: number; size?: number } = {}) {
    return api.get<Page<ProgramSummary>>('/programs', { params });
  },
  programDetail(slug: string) {
    return api.get<ProgramDetail>(`/programs/${slug}`);
  },
  enrollInProgram(programId: string) {
    return api.post<ProgramEnrollmentRead>(`/programs/${programId}/enroll`);
  },

  async instructors(
    params: InstructorListParams = {},
  ): Promise<Page<InstructorSummary>> {
    const raw = await api.get<unknown>('/instructors', {
      params: params as Record<string, string | number | undefined>,
    });
    return normalizePage(raw, (x) => normalizeInstructorSummary(x)!);
  },
  async instructorDetail(slug: string): Promise<InstructorRead> {
    const raw = await api.get<unknown>(`/instructors/${slug}`);
    return normalizeInstructorRead(raw);
  },
};
