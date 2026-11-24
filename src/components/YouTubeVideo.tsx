import { useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { Callout } from '@/components/ui/Callout';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { YouTubeVideoRef } from '@/types';
import { youtubeEmbedUrl, youtubeWatchUrl } from '@/utils/youtube';

/**
 * Click-to-load YouTube player. Nothing is requested from YouTube until the learner presses
 * play, so the page stays fast and no third-party content loads unasked. Videos need a
 * connection; offline, the learner sees a message and the link to watch later.
 */
export function YouTubeVideo({ video }: { video: YouTubeVideoRef }) {
  const online = useOnlineStatus();
  const [playing, setPlaying] = useState(false);
  const watchUrl = youtubeWatchUrl(video.youtubeId);

  const link = (
    <a
      href={watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand underline underline-offset-2"
    >
      Open on YouTube
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );

  if (!online && !playing) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-md border border-dashed border-rule-strong bg-surface-2 p-6 text-center text-muted">
          <Icon name="offline" size={32} />
          <p className="font-medium text-ink">{video.title}</p>
        </div>
        <Callout tone="warning" role="status" title="This video needs an internet connection">
          The rest of the module works offline. Connect to watch it here, or note the link to watch
          later: {link}
        </Callout>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-video overflow-hidden rounded-md border border-rule bg-surface-2">
        {playing ? (
          <iframe
            src={youtubeEmbedUrl(video.youtubeId)}
            title={video.title}
            className="size-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play video: ${video.title}`}
            className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-brand text-brand-ink">
              <Icon name="play" size={28} />
            </span>
            <span className="font-medium text-ink">{video.title}</span>
            <span className="text-sm text-muted">Plays from YouTube</span>
          </button>
        )}
      </div>
      <p className="text-sm text-muted">Video from YouTube, chosen by your teacher. {link}</p>
    </div>
  );
}
