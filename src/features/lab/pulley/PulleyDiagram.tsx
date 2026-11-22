import { useEffect, useId, useRef } from 'react';
import type { MotionRef } from '../motion';
import { DRAWING, pulleyLayout } from './layout';
import type { PulleyLabParams } from './params';

const {
  pxPerM: PX_PER_M,
  ceilingY: CEILING_Y,
  fixedY: FIXED_Y,
  restY: REST_Y,
  floorY: FLOOR_Y,
  loadH: LOAD_H,
  effortStartY: EFFORT_START_Y,
} = DRAWING;

interface PulleyDiagramProps {
  params: PulleyLabParams;
  motion?: MotionRef;
  playing?: boolean;
  className?: string;
}

/**
 * Front view of the pulley system with n supporting segments. Geometry (which pulleys are fixed
 * or movable, where the rope is tied) is exact; distances are drawn to one scale so the effort
 * end visibly moves n times as far as the load.
 */
export function PulleyDiagram({ params, motion, playing = false, className }: PulleyDiagramProps) {
  const n = params.segments;
  const uid = useId().replace(/:/g, '');
  const l = pulleyLayout(n);
  const segRefs = useRef<Array<SVGLineElement | null>>([]);
  const movingRef = useRef<SVGGElement>(null);
  const effortLineRef = useRef<SVGLineElement>(null);
  const effortEndRef = useRef<SVGGElement>(null);
  const dinRef = useRef<SVGLineElement>(null);
  const doutRef = useRef<SVGLineElement>(null);

  const r = l.radius;
  const left = l.segmentXs[0] ?? 140;
  const loadCx = n === 1 ? left : (left + (l.segmentXs[n - 1] ?? left)) / 2;
  const movable = l.sheaves.filter((s) => s.kind === 'movable');
  const blockLeft = Math.min(left, ...movable.map((s) => s.x)) - 10;
  const blockRight =
    Math.max(n === 1 ? left : (l.segmentXs[n - 1] ?? left), ...movable.map((s) => s.x)) + 10;
  const ropeBottomY = n === 1 ? REST_Y : REST_Y;
  const segTop = (i: number) => (i === 0 && l.deadEnd === 'ceiling' ? CEILING_Y : FIXED_Y);

  // Per-frame drawing from the shared motion ref (no React re-renders while playing).
  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const fraction = motion ? motion.current.fraction : 0;
      const rise = fraction * PX_PER_M;
      const pull = n * rise;
      segRefs.current.forEach((el) => el?.setAttribute('y2', String(ropeBottomY - rise)));
      movingRef.current?.setAttribute('transform', `translate(0 ${-rise})`);
      effortLineRef.current?.setAttribute('y2', String(EFFORT_START_Y + pull));
      effortEndRef.current?.setAttribute('transform', `translate(0 ${pull})`);
      dinRef.current?.setAttribute('y2', String(EFFORT_START_Y + pull));
      doutRef.current?.setAttribute('y1', String(FLOOR_Y - rise));
      if (motion?.current.playing) frame = requestAnimationFrame(draw);
    };
    draw();
    if (playing) frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [motion, playing, n, ropeBottomY]);

  const descText =
    n === 1
      ? 'A single fixed pulley hangs from the ceiling. The load hangs from one side of the rope and the effort pulls down on the other side.'
      : `${n} rope segments hold up a movable pulley block carrying the load. ${Math.ceil(n / 2)} fixed and ${Math.floor(n / 2)} movable pulleys. The rope is tied to the ${l.deadEnd === 'ceiling' ? 'ceiling' : 'movable block'} and the effort pulls down on the free end.`;

  return (
    <svg
      viewBox="0 0 420 380"
      role="img"
      aria-labelledby={`${uid}-t ${uid}-d`}
      className={className}
    >
      <title
        id={`${uid}-t`}
      >{`Pulley system with ${n} supporting rope segment${n > 1 ? 's' : ''}`}</title>
      <desc id={`${uid}-d`}>{descText}</desc>
      <defs>
        <marker
          id={`${uid}-in`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0 0 10 5 0 10z" style={{ fill: 'var(--input)' }} />
        </marker>
        <marker
          id={`${uid}-out`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0 0 10 5 0 10z" style={{ fill: 'var(--output)' }} />
        </marker>
      </defs>

      {/* Ceiling and floor */}
      <rect
        x="70"
        y={CEILING_Y - 12}
        width="280"
        height="12"
        style={{ fill: 'var(--surface-2)', stroke: 'var(--ink)' }}
        strokeWidth="1.5"
      />
      <line
        x1="40"
        y1={FLOOR_Y}
        x2="380"
        y2={FLOOR_Y}
        style={{ stroke: 'var(--rule-strong)' }}
        strokeWidth="1.5"
      />

      {/* Fixed pulleys with their hangers */}
      {l.sheaves
        .filter((s) => s.kind === 'fixed')
        .map((s) => (
          <g key={`f-${s.x}`}>
            <line
              x1={s.x}
              y1={CEILING_Y}
              x2={s.x}
              y2={FIXED_Y}
              style={{ stroke: 'var(--ink)' }}
              strokeWidth="2"
            />
            <circle
              cx={s.x}
              cy={FIXED_Y}
              r={r}
              style={{ fill: 'var(--surface)', stroke: 'var(--ink)' }}
              strokeWidth="2"
            />
            <circle cx={s.x} cy={FIXED_Y} r="2.5" style={{ fill: 'var(--ink)' }} />
          </g>
        ))}

      {/* Supporting rope segments (bottom ends follow the load) */}
      {l.segmentXs.map((x, i) => (
        <line
          key={`seg-${x}`}
          ref={(el) => {
            segRefs.current[i] = el;
          }}
          x1={x}
          y1={segTop(i)}
          x2={x}
          y2={ropeBottomY}
          style={{ stroke: 'var(--ink)' }}
          strokeWidth="2"
        />
      ))}

      {/* Moving parts: movable pulleys, block, load */}
      <g ref={movingRef}>
        {n >= 2 ? (
          <>
            {movable.map((s) => (
              <g key={`m-${s.x}`}>
                <circle
                  cx={s.x}
                  cy={REST_Y}
                  r={r}
                  style={{ fill: 'var(--surface)', stroke: 'var(--brand)' }}
                  strokeWidth="2"
                />
                <circle cx={s.x} cy={REST_Y} r="2.5" style={{ fill: 'var(--brand)' }} />
              </g>
            ))}
            <rect
              x={blockLeft}
              y={REST_Y + r + 2}
              width={blockRight - blockLeft}
              height="8"
              rx="2"
              style={{ fill: 'var(--brand)' }}
            />
          </>
        ) : (
          <circle
            cx={left}
            cy={REST_Y + 4}
            r="4"
            style={{ fill: 'none', stroke: 'var(--ink)' }}
            strokeWidth="2"
          />
        )}
        <line
          x1={loadCx}
          y1={n >= 2 ? REST_Y + r + 10 : REST_Y + 8}
          x2={loadCx}
          y2={FLOOR_Y - LOAD_H}
          style={{ stroke: 'var(--ink)' }}
          strokeWidth="2"
        />
        <rect
          x={loadCx - 34}
          y={FLOOR_Y - LOAD_H}
          width="68"
          height={LOAD_H}
          rx="3"
          style={{
            fill: 'color-mix(in srgb, var(--output) 18%, var(--surface))',
            stroke: 'var(--output)',
          }}
          strokeWidth="2"
        />
        <text
          x={loadCx}
          y={FLOOR_Y - LOAD_H / 2 + 4}
          textAnchor="middle"
          style={{ fill: 'var(--ink)' }}
          className="text-[12px]"
        >
          {params.loadMassKg} kg
        </text>
        {/* Weight of the load */}
        <line
          x1={loadCx + 44}
          y1={FLOOR_Y - LOAD_H + 6}
          x2={loadCx + 44}
          y2={FLOOR_Y - 4}
          style={{ stroke: 'var(--output)' }}
          strokeWidth="2.5"
          markerEnd={`url(#${uid}-out)`}
        />
        <text
          x={loadCx + 50}
          y={FLOOR_Y - 14}
          style={{ fill: 'var(--output)' }}
          className="font-display text-[13px] italic"
        >
          W
        </text>
      </g>

      {/* Effort rope and spring scale */}
      <line
        ref={effortLineRef}
        x1={l.effortX}
        y1={FIXED_Y}
        x2={l.effortX}
        y2={EFFORT_START_Y}
        style={{ stroke: 'var(--input)' }}
        strokeWidth="2.5"
      />
      <g ref={effortEndRef}>
        <rect
          x={l.effortX - 7}
          y={EFFORT_START_Y}
          width="14"
          height="30"
          rx="3"
          style={{ fill: 'var(--surface)', stroke: 'var(--input)' }}
          strokeWidth="2"
        />
        <line
          x1={l.effortX - 4}
          y1={EFFORT_START_Y + 10}
          x2={l.effortX + 4}
          y2={EFFORT_START_Y + 10}
          style={{ stroke: 'var(--input)' }}
          strokeWidth="1.5"
        />
        <line
          x1={l.effortX}
          y1={EFFORT_START_Y + 32}
          x2={l.effortX}
          y2={EFFORT_START_Y + 52}
          style={{ stroke: 'var(--input)' }}
          strokeWidth="2.5"
          markerEnd={`url(#${uid}-in)`}
        />
        <text
          x={l.effortX + 10}
          y={EFFORT_START_Y + 50}
          style={{ fill: 'var(--input)' }}
          className="font-display text-[14px] italic"
        >
          F
          <tspan className="text-[10px]" dy="3">
            in
          </tspan>
        </text>
      </g>

      {/* Distance brackets: rope pulled (d_in) and load rise (d_out), same scale */}
      <line
        x1={l.effortX + 34}
        y1={EFFORT_START_Y}
        x2={l.effortX + 34}
        y2={EFFORT_START_Y}
        ref={dinRef}
        style={{ stroke: 'var(--input)' }}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <text
        x={l.effortX + 40}
        y={EFFORT_START_Y - 6}
        style={{ fill: 'var(--input)' }}
        className="font-display text-[12px] italic"
      >
        d
        <tspan className="text-[9px]" dy="3">
          in
        </tspan>
      </text>
      <line
        x1={blockLeft - 26}
        y1={FLOOR_Y}
        x2={blockLeft - 26}
        y2={FLOOR_Y}
        ref={doutRef}
        style={{ stroke: 'var(--output)' }}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <text
        x={blockLeft - 44}
        y={FLOOR_Y + 14}
        style={{ fill: 'var(--output)' }}
        className="font-display text-[12px] italic"
      >
        d
        <tspan className="text-[9px]" dy="3">
          out
        </tspan>
      </text>
    </svg>
  );
}
