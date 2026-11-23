import { useEffect, useId, useRef } from 'react';
import type { DiagramProps } from '../shared/types';
import { WEDGE_PUSH_M, type WedgeLabParams } from './wedgeParams';

const FLOOR = 290;
const LOAD_X = 300; // the load can only move up and down (guides)
const WEDGE_LEN_M = 0.45;
const PX_PER_M = 520;
const START_INSERT_M = 0.12; // tip already past the load at the start
const LOAD_HALF = 58; // px
/** A flat-bottomed load rests on the slope by its uphill (left) edge. */
const CONTACT_X = LOAD_X - LOAD_HALF;

/** Lifting wedge, side view, to scale: push the wedge right and the guided load rises. */
export function WedgeDiagram({
  params,
  motion,
  playing = false,
  className,
}: DiagramProps<WedgeLabParams>) {
  const uid = useId().replace(/:/g, '');
  const wedge = useRef<SVGPolygonElement>(null);
  const load = useRef<SVGGElement>(null);
  const push = useRef<SVGGElement>(null);
  const pushText = useRef<SVGTSpanElement>(null);
  const riseText = useRef<SVGTSpanElement>(null);

  const tan = Math.tan((params.wedgeAngleDeg * Math.PI) / 180);
  const L = WEDGE_LEN_M * PX_PER_M;

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const f = motion ? motion.current.fraction : 0;
      const insertM = START_INSERT_M + WEDGE_PUSH_M * f;
      const tipX = LOAD_X + insertM * PX_PER_M;
      const backX = tipX - L;
      const loadBottom = FLOOR - (tipX - CONTACT_X) * tan;
      wedge.current?.setAttribute(
        'points',
        `${tipX},${FLOOR} ${backX},${FLOOR} ${backX},${FLOOR - L * tan}`,
      );
      load.current?.setAttribute('transform', `translate(0 ${loadBottom - FLOOR})`);
      push.current?.setAttribute('transform', `translate(${backX} 0)`);
      if (pushText.current) pushText.current.textContent = (WEDGE_PUSH_M * f).toFixed(3);
      if (riseText.current)
        riseText.current.textContent = (WEDGE_PUSH_M * f * tan * 1000).toFixed(1);
      if (motion?.current.playing) frame = requestAnimationFrame(draw);
    };
    draw();
    if (playing) frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [motion, playing, tan, L]);

  return (
    <svg
      viewBox="0 0 480 330"
      role="img"
      aria-labelledby={`${uid}-t ${uid}-d`}
      className={className}
    >
      <title id={`${uid}-t`}>Lifting wedge</title>
      <desc id={`${uid}-d`}>
        {`A wedge with a ${params.wedgeAngleDeg} degree angle is pushed ${WEDGE_PUSH_M} metres under a ${params.loadMassKg} kilogram load held by side guides. The load rises ${(WEDGE_PUSH_M * tan * 1000).toFixed(0)} millimetres.`}
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
        <pattern
          id={`${uid}-floor`}
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="8"
            style={{ stroke: 'var(--rule-strong)' }}
            strokeWidth="1.5"
          />
        </pattern>
      </defs>

      <rect x="0" y={FLOOR} width="480" height="12" style={{ fill: `url(#${uid}-floor)` }} />
      <line
        x1="0"
        y1={FLOOR}
        x2="480"
        y2={FLOOR}
        style={{ stroke: 'var(--ink)' }}
        strokeWidth="2"
      />

      {/* Guides that keep the load from moving sideways */}
      {[LOAD_X - 66, LOAD_X + 60].map((x) => (
        <rect
          key={x}
          x={x}
          y="60"
          width="6"
          height="170"
          style={{ fill: 'var(--surface-2)', stroke: 'var(--rule-strong)' }}
        />
      ))}

      <polygon
        ref={wedge}
        points="0,0 0,0 0,0"
        style={{
          fill: 'color-mix(in srgb, var(--input) 16%, var(--surface))',
          stroke: 'var(--input)',
        }}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <g ref={load}>
        <rect
          x={LOAD_X - 58}
          y={FLOOR - 74}
          width="116"
          height="74"
          rx="3"
          style={{
            fill: 'color-mix(in srgb, var(--output) 18%, var(--surface))',
            stroke: 'var(--output)',
          }}
          strokeWidth="2"
        />
        <text
          x={LOAD_X}
          y={FLOOR - 33}
          textAnchor="middle"
          style={{ fill: 'var(--ink)' }}
          className="text-[11px]"
        >
          {params.loadMassKg} kg
        </text>
        <line
          x1={LOAD_X + 26}
          y1={FLOOR - 64}
          x2={LOAD_X + 26}
          y2={FLOOR - 16}
          style={{ stroke: 'var(--output)' }}
          strokeWidth="2.5"
          markerEnd={`url(#${uid}-out)`}
        />
        <text
          x={LOAD_X + 32}
          y={FLOOR - 36}
          style={{ fill: 'var(--output)' }}
          className="font-display text-[13px] italic"
        >
          W
        </text>
      </g>

      <g ref={push}>
        <line
          x1="-56"
          y1={FLOOR - 14}
          x2="-6"
          y2={FLOOR - 14}
          style={{ stroke: 'var(--input)' }}
          strokeWidth="2.5"
          markerEnd={`url(#${uid}-in)`}
        />
        <text
          x="-52"
          y={FLOOR - 22}
          style={{ fill: 'var(--input)' }}
          className="font-display text-[14px] italic"
        >
          F
          <tspan className="text-[10px]" dy="3">
            in
          </tspan>
        </text>
      </g>

      <text
        x="240"
        y="28"
        textAnchor="middle"
        style={{ fill: 'var(--ink)' }}
        className="text-[12px]"
      >
        wedge angle α = {params.wedgeAngleDeg}° · IMA = 1 ÷ tan α ={' '}
        <tspan className="num">{(1 / tan).toFixed(2)}</tspan>
      </text>
      <text
        x="240"
        y="322"
        textAnchor="middle"
        style={{ fill: 'var(--muted)' }}
        className="text-[11px]"
      >
        Drawn to scale. Wedge pushed{' '}
        <tspan ref={pushText} className="num">
          0.000
        </tspan>{' '}
        m · load raised{' '}
        <tspan ref={riseText} className="num">
          0.0
        </tspan>{' '}
        mm
      </text>
    </svg>
  );
}
