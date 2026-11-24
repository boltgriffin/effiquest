import { useEffect, useState, type RefObject } from 'react';

/**
 * Whether an element is (at least partly) on screen, so animations can pause when it is not.
 * Assumes visible where IntersectionObserver is missing.
 */
export function useInView(ref: RefObject<Element | null>, threshold = 0.15): boolean {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return inView;
}
