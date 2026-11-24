/** YouTube link helpers for teacher-chosen module videos (D-27). */
export const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** Privacy-enhanced embed: YouTube sets no cookies until the video plays. */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}
