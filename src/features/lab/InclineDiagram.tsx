import { useEffect, useId, useRef } from 'react';
import type { MotionRef } from './motion';

interface InclineDiagramProps {
  angleDeg: number;
  friction: number;
  massKg: number;
  className?: string;
  /** Live block position during a run. Without it the block sits part-way up the ramp. */
  motion?: MotionRef;
  /** True while a run animates; the diagram then redraws every frame. */
  playing?: boolean;
}

/** Distance of the block centre along the slope (px) for a 0..1 position. */
const along = (fraction: number) => 30 + fraction * (L - 60);
const STATIC_FRACTION = 0.6;

const L = 300; // slope length in px
const X0 = 70;
const Y0 = 270;

/**
 * Free-body sketch of a block on a ramp. Geometry (angle) is exact; arrow lengths are
 * illustrative, not to scale. With `motion`, the block follows a run frame by frame.
 */
export function InclineDiagram({
  angleDeg,
  friction,
  massKg,
  className,
  motion,
  playing = false,
}: InclineDiagramProps) {
  const moverRef = useRef<SVGGElement>(null);
  const uid = useId().replace(/:/g, '');
  const t = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  const right = X0 + L * cos;
  const top = Y0 - L * sin;
  // Block drawn at the bottom of the slope, then translated along it.
  const px = X0;
  const py = Y0;
  // Block centre (15 px above the slope, along the normal).
  const cx = px - 15 * sin;
  const cy = py - 15 * cos;
  const offset = (fraction: number) =>
    `translate(${along(fraction) * cos} ${-along(fraction) * sin})`;

  // Follow the run every animation frame while it plays; otherwise place the block once.
  useEffect(() => {
    const el = moverRef.current;
    if (!el || !motion) return;
    let frame = 0;
    const draw = () => {
      el.setAttribute('transform', offset(motion.current.fraction));
      if (motion.current.playing) frame = requestAnimationFrame(draw);
    };
    draw();
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
    // offset depends only on the angle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motion, playing, angleDeg]);
  const arcR = 52;
  const labelR = 72;
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;

  const marker = (id: string, color: string) => (
    <marker
      id={`${uid}-${id}`}
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerWidth="7"
      markerHeight="7"
      orient="auto-start-reverse"
    >
      <path d="M0 0 10 5 0 10z" style={{ fill: color }} />
    </marker>
  );

  return (
    <svg
      viewBox="0 0 480 300"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      className={className}
    >
      <title id={titleId}>Block on an inclined plane</title>
      <desc id={descId}>
        {`Ramp at ${angleDeg} degrees, friction coefficient ${friction.toFixed(2)}, block mass ${massKg} kilograms. Arrows show the effort up the slope, the weight straight down and friction down the slope.`}
      </desc>
      <defs>
        {marker('in', 'var(--input)')}
        {marker('out', 'var(--output)')}
        {marker('loss', 'var(--loss)')}
      </defs>

      {/* Ground */}
      <line
        x1="20"
        y1={Y0}
        x2="460"
        y2={Y0}
        style={{ stroke: 'var(--rule-strong)' }}
        strokeWidth="1.5"
      />
      {/* Ramp */}
      <path
        d={`M${X0} ${Y0} L${right} ${Y0} L${right} ${top} Z`}
        style={{ fill: 'var(--surface-2)', stroke: 'var(--ink)' }}
        strokeWidth="1.75"
        strokeLinejoin="round"
        className="transition-[d] duration-200"
      />
      {/* Height dimension */}
      <line
        x1={right + 16}
        y1={Y0}
        x2={right + 16}
        y2={top}
        style={{ stroke: 'var(--muted)' }}
        strokeDasharray="3 4"
      />
      <text
        x={right + 24}
        y={(Y0 + top) / 2}
        style={{ fill: 'var(--muted)' }}
        className="font-display text-[14px] italic"
      >
        h
      </text>
      {/* Angle arc and label */}
      <path
        d={`M${X0 + arcR} ${Y0} A${arcR} ${arcR} 0 0 0 ${X0 + arcR * cos} ${Y0 - arcR * sin}`}
        fill="none"
        style={{ stroke: 'var(--muted)' }}
        strokeWidth="1.25"
      />
      <text
        x={X0 + labelR * Math.cos(t / 2)}
        y={Y0 - labelR * Math.sin(t / 2) + 5}
        style={{ fill: 'var(--ink)' }}
        className="text-[13px]"
      >
        <tspan className="font-display italic">θ</tspan> = {angleDeg}°
      </text>
      {/* Friction label on the slope surface */}
      <text
        transform={`translate(${X0 + 0.5 * L * cos} ${Y0 - 0.5 * L * sin}) rotate(${-angleDeg}) translate(0 16)`}
        style={{ fill: 'var(--muted)' }}
        className="text-[12px]"
        textAnchor="middle"
      >
        <tspan className="font-display italic">μ</tspan> = {friction.toFixed(2)}
      </text>

      <g ref={moverRef} transform={offset(motion ? 0 : STATIC_FRACTION)}>
        {/* Block and slope-aligned forces */}
        <g transform={`translate(${px} ${py}) rotate(${-angleDeg})`}>
          <rect
            x="-24"
            y="-30"
            width="48"
            height="30"
            rx="2"
            style={{ fill: 'var(--surface)', stroke: 'var(--ink)' }}
            strokeWidth="1.75"
          />
          <text
            x="0"
            y="-11"
            textAnchor="middle"
            style={{ fill: 'var(--ink)' }}
            className="text-[11px]"
          >
            {massKg} kg
          </text>
          {/* Effort, up the slope */}
          <line
            x1="24"
            y1="-15"
            x2="96"
            y2="-15"
            style={{ stroke: 'var(--input)' }}
            strokeWidth="2.5"
            markerEnd={`url(#${uid}-in)`}
          />
          <text
            x="100"
            y="-21"
            style={{ fill: 'var(--input)' }}
            className="font-display text-[14px] italic"
          >
            F
            <tspan className="text-[10px]" dy="3">
              in
            </tspan>
          </text>
          {/* Friction, down the slope at the contact surface */}
          {friction > 0 ? (
            <>
              <line
                x1="-24"
                y1="-3"
                x2={-24 - 20 - (60 * Math.min(friction, 0.8)) / 0.8}
                y2="-3"
                style={{ stroke: 'var(--loss)' }}
                strokeWidth="2.5"
                strokeDasharray="6 3"
                markerEnd={`url(#${uid}-loss)`}
              />
              <text
                x="-62"
                y="12"
                style={{ fill: 'var(--loss)' }}
                className="font-display text-[14px] italic"
              >
                f
              </text>
            </>
          ) : null}
        </g>
        {/* Weight, straight down from the block centre */}
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy + 74}
          style={{ stroke: 'var(--output)' }}
          strokeWidth="2.5"
          markerEnd={`url(#${uid}-out)`}
        />
        <text
          x={cx + 7}
          y={cy + 70}
          style={{ fill: 'var(--output)' }}
          className="font-display text-[14px] italic"
        >
          W
        </text>
      </g>
    </svg>
  );
}
