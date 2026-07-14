import { api } from './client';
import { normalizePage, normalizeWishlistItem } from './normalize';
import type {
  AvatarUploadResponse,
  CertificateRead,
  DownloadRead,
  LessonNoteRead,
  OrderRead,
  Page,
  PaymentMethodRead,
  ProgramEnrollmentRead,
  UserMe,
  WeeklyActivityRead,
  WishlistItemRead,
} from '@/types/api';

export interface UpdateMePayload {
  full_name?: string;
}

export interface SetPasswordPayload {
  new_password: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface SessionRead {
  id: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  expires_at: string;
}

/**
 * Notification preferences — matches backend `NotificationPreferenceSchema`
 * (app/schemas/user.py). GET returns all four booleans; PATCH accepts any
 * subset (partial).
 */
export interface NotificationPreferences {
  email_marketing: boolean;
  email_announcements: boolean;
  email_course_updates: boolean;
  push_enabled: boolean;
}

export type NotificationPreferencesUpdate = Partial<NotificationPreferences>;

export interface CreateNotePayload {
  lesson_id: string;
  body: string;
  title?: string | null;
  timestamp_seconds?: number;
}

export interface UpdateNotePayload {
  body?: string | null;
  title?: string | null;
  timestamp_seconds?: number | null;
}

export interface CreatePaymentMethodPayload {
  card_number: string;
  expires_month: number;
  expires_year: number;
  cardholder_name?: string | null;
  set_default?: boolean;
}

export const meApi = {
  get() {
    return api.get<UserMe>('/me');
  },
  update(payload: UpdateMePayload) {
    return api.patch<UserMe>('/me', { json: payload });
  },
  delete() {
    return api.delete<void>('/me');
  },
  changePassword(payload: ChangePasswordPayload) {
    return api.put<{ message: string }>('/me/password', { json: payload });
  },
  /** Set an initial password on a Google-only account (no current password). */
  setPassword(payload: SetPasswordPayload) {
    return api.post<{ message: string }>('/me/password/set', { json: payload });
  },

  uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<AvatarUploadResponse>('/me/avatar', { body: fd });
  },
  deleteAvatar() {
    return api.delete<void>('/me/avatar');
  },

  getNotifications() {
    return api.get<NotificationPreferences>('/me/preferences/notifications');
  },
  updateNotifications(payload: NotificationPreferencesUpdate) {
    return api.patch<NotificationPreferences>('/me/preferences/notifications', {
      json: payload,
    });
  },

  listSessions() {
    return api.get<SessionRead[]>('/me/sessions');
  },
  revokeSession(id: string) {
    return api.delete<void>(`/me/sessions/${id}`);
  },
  revokeAllSessions() {
    return api.delete<void>('/me/sessions');
  },

  // Weekly activity (dashboard "Weekly activity" widget).
  getWeeklyActivity() {
    return api.get<WeeklyActivityRead>('/me/activity/weekly');
  },
  setWeeklyGoal(minutes: number) {
    return api.put<WeeklyActivityRead>('/me/activity/weekly-goal', {
      json: { weekly_goal_minutes: minutes },
    });
  },

  // Wishlist (mutations live in enrollmentsApi; this is the LIST).
  async listWishlist(
    params: { page?: number; size?: number } = {},
  ): Promise<Page<WishlistItemRead>> {
    const raw = await api.get<unknown>('/me/wishlist', {
      params: params as Record<string, number | undefined>,
    });
    return normalizePage(raw, normalizeWishlistItem);
  },

  // Notes (per-lesson).
  listNotes(params: { lesson_id?: string; course_id?: string } = {}) {
    return api.get<LessonNoteRead[]>('/me/notes', {
      params: params as Record<string, string | undefined>,
    });
  },
  createNote(payload: CreateNotePayload) {
    return api.post<LessonNoteRead>('/me/notes', { json: payload });
  },
  updateNote(id: string, payload: UpdateNotePayload) {
    return api.patch<LessonNoteRead>(`/me/notes/${id}`, { json: payload });
  },
  deleteNote(id: string) {
    return api.delete<void>(`/me/notes/${id}`);
  },

  // Saved downloads (lesson attachments the user has saved).
  listDownloads() {
    return api.get<DownloadRead[]>('/me/downloads');
  },
  saveDownload(attachmentId: string) {
    return api.post<DownloadRead>('/me/downloads', {
      json: { attachment_id: attachmentId },
    });
  },
  deleteDownload(id: string) {
    return api.delete<void>(`/me/downloads/${id}`);
  },

  // Payment methods.
  listPaymentMethods() {
    return api.get<PaymentMethodRead[]>('/me/payment-methods');
  },
  createPaymentMethod(payload: CreatePaymentMethodPayload) {
    return api.post<PaymentMethodRead>('/me/payment-methods', { json: payload });
  },
  deletePaymentMethod(id: string) {
    return api.delete<void>(`/me/payment-methods/${id}`);
  },
  startPaymentMethodVerify(id: string) {
    return api.post<{ message: string }>(`/me/payment-methods/${id}/verify/start`);
  },
  confirmPaymentMethodVerify(id: string, code: string) {
    return api.post<PaymentMethodRead>(
      `/me/payment-methods/${id}/verify/confirm`,
      { json: { code } },
    );
  },

  // Orders / billing history.
  listOrders() {
    return api.get<OrderRead[]>('/me/orders');
  },

  // Certificates.
  listCertificates() {
    return api.get<CertificateRead[]>('/me/certificates');
  },
  getCertificateForCourse(courseId: string) {
    return api.get<CertificateRead>(`/me/certificates/courses/${courseId}`);
  },

  // Programs the user is enrolled in.
  listPrograms(params: { page?: number; size?: number } = {}) {
    return api.get<Page<ProgramEnrollmentRead>>('/me/programs', {
      params: params as Record<string, number | undefined>,
    });
  },
};
