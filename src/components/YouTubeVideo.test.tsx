import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { modules } from '@/content/modules';
import { YOUTUBE_ID_PATTERN } from '@/utils/youtube';
import { YouTubeVideo } from './YouTubeVideo';

const video = { youtubeId: 'T99yH_gw3p8', title: 'What is Torque?' };

afterEach(() => vi.restoreAllMocks());

describe('YouTubeVideo', () => {
  it('loads nothing from YouTube until the learner presses play', () => {
    const { container } = render(<YouTubeVideo video={video} />);
    expect(container.querySelector('iframe')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /play video: what is torque\?/i }));
    const frame = screen.getByTitle('What is Torque?');
    expect(frame.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/T99yH_gw3p8?autoplay=1&rel=0',
    );
  });

  it('explains that the video needs a connection when offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    render(<YouTubeVideo video={video} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText(/needs an internet connection/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open on youtube/i })).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=T99yH_gw3p8',
    );
  });
});

describe('module videos', () => {
  it('every module has a well-formed YouTube id and a title', () => {
    for (const m of modules) {
      expect(m.video, m.id).toBeDefined();
      expect(m.video?.youtubeId).toMatch(YOUTUBE_ID_PATTERN);
      expect(m.video?.title.trim()).not.toBe('');
    }
  });
});
