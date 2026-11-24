import { lazy, Suspense, useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { eyebrowClass } from '@/components/ui/styles';
import type { LabId } from '@/content/quests';
import { useInView } from '@/hooks/useInView';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cx } from '@/utils/cx';
import { isWebGLAvailable } from '@/utils/webgl';
import { showcaseItems, type ShowcaseItem } from './catalog';
import type { ModelSize } from './Showcase3D';

const Showcase3D = lazy(() => import('./Showcase3D'));

const COUNT = showcaseItems.length;
const IDS: readonly LabId[] = showcaseItems.map((i) => i.id);
const shortTitle = (title: string) => title.replace(/ \(compound\)$/, '');
const two = (n: number) => String(n).padStart(2, '0');

function metres(m: number): string {
  return m < 1 ? m.toFixed(2) : m.toFixed(1);
}

/**
 * The welcome screen's simulation selector: the nine labs' own 3D models on a round platform,
 * with previous/next arrows, a selector strip, swipe and arrow-key navigation, and an information
 * panel. "Explore simulation" opens the existing lab route.
 */
export function SimulationShowcase({ onExplore }: { onExplore: (to: string) => void }) {
  const [selected, setSelected] = useState(0);
  const [sizes, setSizes] = useState<Partial<Record<LabId, ModelSize>>>({});
  const [webgl] = useState(() => isWebGLAvailable());
  const [contextLost, setContextLost] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const viewport = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const visible = useInView(viewport);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const item = (showcaseItems[selected] ?? showcaseItems[0]) as ShowcaseItem;
  const prev = showcaseItems[(selected - 1 + COUNT) % COUNT];
  const next = showcaseItems[(selected + 1) % COUNT];
  const step = useCallback((delta: number) => setSelected((s) => (s + delta + COUNT) % COUNT), []);
  const onMeasured = useCallback(
    (id: LabId, size: ModelSize) => setSizes((all) => (all[id] ? all : { ...all, [id]: size })),
    [],
  );

  // Keep the selected button in view in the scrolling strip (without scrolling the page).
  useEffect(() => {
    const box = strip.current;
    const button = box?.querySelector<HTMLElement>(`[data-index="${selected}"]`);
    if (!box || !button) return;
    const left = button.offsetLeft - (box.clientWidth - button.offsetWidth) / 2;
    box.scrollTo?.({ left, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [selected, reducedMotion]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => step(1),
      ArrowLeft: () => step(-1),
      Home: () => setSelected(0),
      End: () => setSelected(COUNT - 1),
    };
    const action = keys[e.key];
    if (!action) return;
    e.preventDefault();
    action();
  };

  const onPointerDown = (e: PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  };

  const size = sizes[item.id];
  const show3D = webgl && !contextLost;

  return (
    <div
      aria-roledescription="carousel"
      aria-label="Simulations"
      className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]"
    >
      <div className="min-w-0">
        <div
          ref={viewport}
          tabIndex={0}
          role="group"
          aria-roledescription="slide"
          aria-label={`${selected + 1} of ${COUNT}: ${item.title}. Use the left and right arrow keys to choose.`}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (swipe.current = null)}
          className="showcase-stage relative h-[min(105vw,440px)] sm:h-[clamp(340px,56vh,600px)] touch-pan-y overflow-hidden rounded-xl border border-rule focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {show3D ? (
            <ErrorBoundary area="the 3D showcase">
              <Suspense fallback={<Diagram item={item} note="Loading the 3D models…" />}>
                <Showcase3D
                  ids={IDS}
                  selected={selected}
                  onSelect={setSelected}
                  animate={visible && !reducedMotion}
                  reducedMotion={reducedMotion}
                  onMeasured={onMeasured}
                  onContextLost={() => setContextLost(true)}
                  label={`3D showcase of the nine lab machines. Selected: ${item.title}.`}
                />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <Diagram
              item={item}
              note={
                contextLost
                  ? 'The 3D view stopped (graphics resources ran out). Showing the diagram.'
                  : 'This device cannot show 3D, so the lab diagram is shown.'
              }
            />
          )}

          <span className="pointer-events-none absolute top-4 left-4 rounded-md border border-rule bg-bg/70 px-2.5 py-1 text-xs text-muted backdrop-blur-sm">
            <span className="num text-ink">{two(selected + 1)}</span> / {two(COUNT)}
          </span>
          <ArrowButton
            side="left"
            label={`Previous simulation: ${prev?.title ?? ''}`}
            onClick={() => step(-1)}
          />
          <ArrowButton
            side="right"
            label={`Next simulation: ${next?.title ?? ''}`}
            onClick={() => step(1)}
          />
        </div>

        <div
          ref={strip}
          role="group"
          aria-label="Choose a simulation"
          className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1 lg:overflow-visible"
        >
          {showcaseItems.map((s, i) => (
            <button
              key={s.id}
              type="button"
              data-index={i}
              aria-pressed={i === selected}
              aria-controls="simulation-info"
              onClick={() => setSelected(i)}
              className={cx(
                'flex min-h-11 w-[5.75rem] shrink-0 snap-center flex-col items-center gap-1 rounded-lg border px-1.5 py-2 text-center text-[0.7rem] leading-tight transition-colors lg:w-auto lg:flex-1',
                i === selected
                  ? 'border-brand bg-brand-soft text-ink'
                  : 'border-rule bg-surface/60 text-muted hover:border-rule-strong hover:text-ink',
              )}
            >
              <Icon name={s.icon} size={20} className={i === selected ? 'text-brand' : undefined} />
              <span>{shortTitle(s.title)}</span>
            </button>
          ))}
        </div>
      </div>

      <InfoPanel item={item} index={selected} size={size} onExplore={onExplore} />

      <p className="sr-only" aria-live="polite">
        {`${item.title}, ${selected + 1} of ${COUNT}`}
      </p>
    </div>
  );
}

function ArrowButton({
  side,
  label,
  onClick,
}: {
  side: 'left' | 'right';
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className={cx(
        'absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-rule-strong bg-bg/70 text-ink backdrop-blur-sm transition-colors hover:border-brand hover:text-brand sm:size-12',
        side === 'left' ? 'left-3' : 'right-3',
      )}
    >
      <Icon name={side === 'left' ? 'chevronLeft' : 'chevronRight'} size={22} />
    </button>
  );
}

function Diagram({ item, note }: { item: ShowcaseItem; note: string }) {
  return (
    <div className="paper-grid absolute inset-0 flex items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-xl">{item.diagram()}</div>
      <p className="absolute right-4 bottom-3 left-4 text-center text-xs text-muted">{note}</p>
    </div>
  );
}

function InfoPanel({
  item,
  index,
  size,
  onExplore,
}: {
  item: ShowcaseItem;
  index: number;
  size: ModelSize | undefined;
  onExplore: (to: string) => void;
}) {
  return (
    <article
      id="simulation-info"
      aria-labelledby="simulation-title"
      className="flex min-w-0 flex-col rounded-xl border border-rule bg-surface/80 p-5 backdrop-blur-sm sm:p-6"
    >
      <div key={item.id} className="showcase-fade flex flex-1 flex-col">
        <p className={eyebrowClass}>
          <span className="num">{two(index + 1)}</span> · {item.category}
        </p>
        <h3
          id="simulation-title"
          className="mt-2 flex items-center gap-3 font-display text-3xl leading-tight"
        >
          <Icon name={item.icon} size={28} className="shrink-0 text-brand" />
          {shortTitle(item.title)}
        </h3>
        <p className="mt-3 text-muted">{item.summary}</p>

        <dl className="mt-5 flex flex-col gap-4 border-t border-rule pt-5 text-sm">
          <div>
            <dt className="flex items-center gap-1.5 font-medium">
              <Icon name="target" size={16} className="text-brand" />
              Learning objective
            </dt>
            <dd className="mt-1 text-muted">{item.objective}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 font-medium">
              <Icon name="help" size={16} className="text-brand" />
              Lab question
            </dt>
            <dd className="mt-1 text-muted">{item.question}</dd>
          </div>
          {size ? (
            <div>
              <dt className="flex items-center gap-1.5 font-medium">
                <Icon name="eye" size={16} className="text-brand" />
                Real size of the model
              </dt>
              <dd className="mt-1 text-muted">
                About <span className="num text-ink">{metres(size.width)} m</span> wide ×{' '}
                <span className="num text-ink">{metres(size.height)} m</span> tall. Each machine is
                scaled to fit its stand; the lab shows it at true size.
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-auto pt-6">
          <Button
            variant="primary"
            iconRight="arrowRight"
            onClick={() => onExplore(item.to)}
            className="w-full sm:w-auto"
          >
            Explore simulation
          </Button>
        </div>
      </div>
    </article>
  );
}
