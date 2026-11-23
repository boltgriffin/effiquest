import { useEffect, useId, useRef } from 'react';
import type { DiagramProps } from '../shared/types';
import { LEVER_ROTATION_DEG, type LeverLabParams } from './leverParams';

const S = 170; // px per metre for the beam
const PIVOT_Y = 160;
const GROUND_Y = 236;
const CENTER_X = 240;

/**
 * First-class lever: load on the left arm, effort on the right, fulcrum between. The beam turns
 * about the fulcrum during a run (up to the run's turning angle); arm lengths are to scale.
 */
export function LeverDiagram({
  params,
  motion,
  playing = false,
  className,
}: DiagramProps<LeverLabParams>) {
  const uid = useId().replace(/:/g, '');
  const beam = useRef<SVGLineElement>(null);
  const load = useRef<SVGGElement>(null);
  const effort = useRef<SVGGElement>(null);
  const angleText = useRef<SVGTSpanElement>(null);

  const le = params.effortArmM * S;
  const ll = params.loadArmM * S;
  // Centre the whole beam horizontally.
  const px = CENTER_X + (ll - le) / 2;

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const fraction = motion ? motion.current.fraction : 0;
      const deg = fraction * LEVER_ROTATION_DEG;
      const t = (deg * Math.PI) / 180;
      // Clockwise in SVG: the effort (right) end goes down, the load (left) end goes up.
      const lx = px - ll * Math.cos(t);
      const ly = PIVOT_Y - ll * Math.sin(t);
      const rx = px + le * Math.cos(t);
      const ry = PIVOT_Y + le * Math.sin(t);
      const b = beam.current;
      if (b) {
        b.setAttribute('x1', String(lx));
        b.setAttribute('y1', String(ly));
        b.setAttribute('x2', String(rx));
        b.setAttribute('y2', String(ry));
      }
      load.current?.setAttribute('transform', `translate(${lx} ${ly})`);
      effort.current?.setAttribute('transform', `translate(${rx} ${ry})`);
      if (angleText.current) angleText.current.textContent = deg.toFixed(1);
      if (motion?.current.playing) frame = requestAnimationFrame(draw);
    };
    draw();
    if (playing) frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [motion, playing, px, ll, le]);

  return (
    <svg
      viewBox="0 0 480 290"
      role="img"
      aria-labelledby={`${uid}-t ${uid}-d`}
      className={className}
    >
      <title id={`${uid}-t`}>First-class lever</title>
      <desc id={`${uid}-d`}>
        {`A beam rests on a fulcrum. The load of ${params.loadMassKg} kilograms sits ${params.loadArmM.toFixed(2)} metres to the left of the fulcrum; the effort pushes down ${params.effortArmM.toFixed(2)} metres to the right.`}
      </desc>
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

      <line
        x1="20"
        y1={GROUND_Y}
        x2="460"
        y2={GROUND_Y}
        style={{ stroke: 'var(--rule-strong)' }}
        strokeWidth="1.5"
      />
      {/* Fulcrum */}
      <path
        d={`M${px} ${PIVOT_Y} L${px - 22} ${GROUND_Y} L${px + 22} ${GROUND_Y} Z`}
        style={{ fill: 'var(--surface-2)', stroke: 'var(--ink)' }}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <text
        x={px}
        y={GROUND_Y + 16}
        textAnchor="middle"
        style={{ fill: 'var(--muted)' }}
        className="text-[12px]"
      >
        Fulcrum
      </text>

      {/* Beam */}
      <line
        ref={beam}
        x1={px - ll}
        y1={PIVOT_Y}
        x2={px + le}
        y2={PIVOT_Y}
        style={{ stroke: 'var(--ink)' }}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle
        cx={px}
        cy={PIVOT_Y}
        r="4"
        style={{ fill: 'var(--surface)', stroke: 'var(--ink)' }}
        strokeWidth="2"
      />

      {/* Load at the end of the load arm */}
      <g ref={load} transform={`translate(${px - ll} ${PIVOT_Y})`}>
        <rect
          x="-22"
          y="-38"
          width="44"
          height="32"
          rx="3"
          style={{
            fill: 'color-mix(in srgb, var(--output) 18%, var(--surface))',
            stroke: 'var(--output)',
          }}
          strokeWidth="2"
        />
        <text
          x="0"
          y="-17"
          textAnchor="middle"
          style={{ fill: 'var(--ink)' }}
          className="text-[11px]"
        >
          {params.loadMassKg} kg
        </text>
        <line
          x1="-30"
          y1="-34"
          x2="-30"
          y2="6"
          style={{ stroke: 'var(--output)' }}
          strokeWidth="2.5"
          markerEnd={`url(#${uid}-out)`}
        />
        <text
          x="-44"
          y="-8"
          style={{ fill: 'var(--output)' }}
          className="font-display text-[13px] italic"
        >
          W
        </text>
      </g>

      {/* Effort at the end of the effort arm */}
      <g ref={effort} transform={`translate(${px + le} ${PIVOT_Y})`}>
        <line
          x1="0"
          y1="-46"
          x2="0"
          y2="-8"
          style={{ stroke: 'var(--input)' }}
          strokeWidth="2.5"
          markerEnd={`url(#${uid}-in)`}
        />
        <text
          x="6"
          y="-30"
          style={{ fill: 'var(--input)' }}
          className="font-display text-[14px] italic"
        >
          F
          <tspan className="text-[10px]" dy="3">
            in
          </tspan>
        </text>
      </g>

      {/* Arm lengths (to scale, measured along the level beam) */}
      <g style={{ stroke: 'var(--muted)' }} strokeWidth="1">
        <line x1={px - ll} y1="262" x2={px} y2="262" />
        <line x1={px} y1="262" x2={px + le} y2="262" />
        <line x1={px - ll} y1="256" x2={px - ll} y2="268" />
        <line x1={px} y1="256" x2={px} y2="268" />
        <line x1={px + le} y1="256" x2={px + le} y2="268" />
      </g>
      <text
        x={px - ll / 2}
        y="282"
        textAnchor="middle"
        style={{ fill: 'var(--output)' }}
        className="text-[11px]"
      >
        load arm {params.loadArmM.toFixed(2)} m
      </text>
      <text
        x={px + le / 2}
        y="282"
        textAnchor="middle"
        style={{ fill: 'var(--input)' }}
        className="text-[11px]"
      >
        effort arm {params.effortArmM.toFixed(2)} m
      </text>
      <text x="24" y="28" style={{ fill: 'var(--muted)' }} className="text-[12px]">
        Beam turned:{' '}
        <tspan ref={angleText} className="num">
          0.0
        </tspan>
        ° of {LEVER_ROTATION_DEG}°
      </text>
    </svg>
  );
}
