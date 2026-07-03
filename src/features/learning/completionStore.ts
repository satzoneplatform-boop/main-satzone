/**
 * Local lesson-completion cache.
 *
 * The backend has `PUT /me/enrollments/{id}/lessons/{lessonId}/progress` to
 * write completion, but exposes no GET to list which lessons a user has
 * completed. Until that lands, we mirror the "completed" signal client-side
 * so the curriculum nav can show locks and gate access to subsequent
 * lessons. It is per-device — clearing localStorage resets the gate.
 *
 * The hard gate still lives on the backend (segment-rate limiter,
 * section-quiz `passed` requirement). This cache is purely the UI affordance.
 */
import { useEffect, useState } from 'react';

const STORAGE_PREFIX = 'idrokhub.lesson-completion';

function keyFor(enrollmentId: string): string {
  return `${STORAGE_PREFIX}.${enrollmentId}`;
}

function read(enrollmentId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(keyFor(enrollmentId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? new Set(arr.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

function write(enrollmentId: string, ids: Set<string>): void {
  try {
    window.localStorage.setItem(
      keyFor(enrollmentId),
      JSON.stringify(Array.from(ids)),
    );
    // Notify hooks living in the same tab (storage events only fire
    // cross-tab) so the curriculum nav re-renders immediately.
    window.dispatchEvent(
      new CustomEvent('idrokhub:lesson-completion', {
        detail: { enrollmentId },
      }),
    );
  } catch {
    // Quota / privacy mode — silently fall through.
  }
}

export const completionStore = {
  get(enrollmentId: string): Set<string> {
    return read(enrollmentId);
  },
  markComplete(enrollmentId: string, lessonId: string): void {
    const existing = read(enrollmentId);
    if (existing.has(lessonId)) return;
    existing.add(lessonId);
    write(enrollmentId, existing);
  },
  clear(enrollmentId: string): void {
    try {
      window.localStorage.removeItem(keyFor(enrollmentId));
      window.dispatchEvent(
        new CustomEvent('idrokhub:lesson-completion', {
          detail: { enrollmentId },
        }),
      );
    } catch {
      // ignore
    }
  },
};

/**
 * Subscribe to completion changes for one enrollment. Returns a stable
 * Set<string> snapshot that's updated on local writes (custom event) and
 * cross-tab writes (the `storage` event).
 */
export function useCompletedLessons(
  enrollmentId: string | undefined,
): Set<string> {
  const [snapshot, setSnapshot] = useState<Set<string>>(
    () => (enrollmentId ? read(enrollmentId) : new Set()),
  );

  // Adjust-during-render: re-read the snapshot when the enrollment changes
  // instead of setting state synchronously inside the effect.
  const [prevId, setPrevId] = useState(enrollmentId);
  if (prevId !== enrollmentId) {
    setPrevId(enrollmentId);
    setSnapshot(enrollmentId ? read(enrollmentId) : new Set());
  }

  useEffect(() => {
    if (!enrollmentId) return;
    function onLocal(e: Event) {
      const detail = (e as CustomEvent<{ enrollmentId: string }>).detail;
      if (detail?.enrollmentId === enrollmentId) {
        setSnapshot(read(enrollmentId!));
      }
    }
    function onStorage(e: StorageEvent) {
      if (e.key === keyFor(enrollmentId!)) {
        setSnapshot(read(enrollmentId!));
      }
    }
    window.addEventListener('idrokhub:lesson-completion', onLocal);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('idrokhub:lesson-completion', onLocal);
      window.removeEventListener('storage', onStorage);
    };
  }, [enrollmentId]);

  return snapshot;
}
