import type { ApiError } from '@/api/errors';

/**
 * Map an ApiError from /lessons/:id/playback to a friendly label.
 *
 * Token / IP errors (playback_ip_mismatch, playback_token_expired, ...) and
 * segment-level checks (segment_skip_blocked, segment_rate_exceeded) are
 * handled implicitly by the HLS-error → re-mint loop in VideoPlayer — they
 * shouldn't reach this function. The two codes the UI handles explicitly
 * are `not_enrolled` and `lesson_video_missing`; everything else falls
 * through to the server's `err.message`.
 */
export function playbackErrorLabel(err: ApiError | null): string | null {
  if (!err) return null;
  switch (err.code) {
    case 'not_enrolled':
      return 'Enroll in this course to watch the lesson.';
    case 'lesson_video_missing':
      return 'The instructor has not uploaded this lesson yet.';
    case 'hls_not_ready':
      return 'This video is still processing — check back in a minute.';
    case 'section_quiz_not_passed':
      return 'Pass the previous section quiz to unlock this lesson.';
    case 'course_not_published':
      return 'This course is not published yet.';
    case 'lesson_key_missing':
      return 'This video failed to process. Please contact support.';
    default:
      return err.message ?? 'Playback failed. Please refresh and try again.';
  }
}
