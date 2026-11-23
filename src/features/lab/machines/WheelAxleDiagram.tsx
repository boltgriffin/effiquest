import { useEffect, useId, useRef } from 'react';
import type { DiagramProps } from '../shared/types';
import { WHEEL_AXLE_FIXED, type WheelAxleLabParams } from './wheelAxleParams';

const S = 180; // px per metre (geometry and load travel share one scale)
const CX = 210;
const CY = 96;
const GROUND_Y = 330;
const LOAD_H = 40;
const EFFORT_START_Y = 190;

/**
 * Wheel and axle used as a winch, side view. The wheel and axle turn together; the load rope
 * winds onto the axle while the effort rope unwinds from the wheel. Radii and the load's rise
 * are to scale. The effort rope moves R ÷ r times as far as the load, so its end soon leaves the
 * drawing; the distance pulled is shown as a number instead of being squashed.
 */
export function WheelAxleDiagram({
  params,
  motion,
  playing = false,
  className,
}: DiagramProps<WheelAxleLabParams>) {
  const uid = useId().replace(/:/g, '');
  const wheel = useRef<SVGGElement>(null);
  const loadG = useRef<SVGGElement>(null);
  const loadRope = useRef<SVGLineElement>(null);
  const effortRope = useRef<SVGLineElement>(null);
  const effortG = useRef<SVGGElement>(null);
  const dinText = useRef<SVGTSpanElement>(null);

  const R = params.wheelRadiusM * S;
  const r = Math.max(2.5, params.axleRadiusM * S);
  const ratio = params.wheelRadiusM / params.axleRadiusM;
  const restLoadTop = GROUND_Y - LOAD_H;

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const fraction = motion ? motion.current.fraction : 0;
      const rise = fraction * WHEEL_AXLE_FIXED.liftM; // m
      const pulled = rise * ratio; // m
      const turnDeg = (rise / params.axleRadiusM) * (180 / Math.PI);
      // Load rope on the left of the axle: turning clockwise (positive in SVG) winds it up and
      // unwinds the effort rope on the right.
      wheel.current?.setAttribute('transform', `rotate(${turnDeg} ${CX} ${CY})`);
      loadG.current?.setAttribute('transform', `translate(0 ${-rise * S})`);
      loadRope.current?.setAttribute('y2', String(restLoadTop - rise * S));
      effortRope.current?.setAttribute('y2', String(Math.min(400, EFFORT_START_Y + pulled * S)));
      effortG.current?.setAttribute('transform', `translate(0 ${pulled * S})`);
      if (dinText.current) dinText.current.textContent = pulled.toFixed(2);
      if (motion?.current.playing) frame = requestAnimationFrame(draw);
    };
    draw();
    if (playing) frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [motion, playing, ratio, params.axleRadiusM, restLoadTop]);

  return (
    <svg
      viewBox="0 0 480 350"
      role="img"
      aria-labelledby={`${uid}-t ${uid}-d`}
      className={className}
    >
      <title id={`${uid}-t`}>Wheel and axle winch</title>
      <desc id={`${uid}-d`}>
        {`A wheel of radius ${params.wheelRadiusM.toFixed(2)} metres is fixed to an axle of radius ${params.axleRadiusM.toFixed(3)} metres on a stand. The load hangs from a rope wound on the axle; the effort pulls a rope wound on the wheel.`}
      </desc>
      <defs>
        <clipPath id={`${uid}-clip`}>
          <rect x="0" y="0" width="480" height="350" />
        </clipPath>
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
      <g clipPath={`url(#${uid}-clip)`}>
        <line
          x1="20"
          y1={GROUND_Y}
          x2="460"
          y2={GROUND_Y}
          style={{ stroke: 'var(--rule-strong)' }}
          strokeWidth="1.5"
        />
        {/* Stand */}
        <path
          d={`M${CX} ${CY} L${CX - 60} ${GROUND_Y} M${CX} ${CY} L${CX + 60} ${GROUND_Y}`}
          style={{ stroke: 'var(--rule-strong)' }}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Wheel and axle turn together */}
        <g ref={wheel}>
          <circle
            cx={CX}
            cy={CY}
            r={R}
            style={{
              fill: 'color-mix(in srgb, var(--brand) 10%, var(--surface))',
              stroke: 'var(--brand)',
            }}
            strokeWidth="3"
          />
          {[0, 60, 120].map((a) => (
            <line
              key={a}
              x1={CX + R * Math.cos((a * Math.PI) / 180)}
              y1={CY + R * Math.sin((a * Math.PI) / 180)}
              x2={CX - R * Math.cos((a * Math.PI) / 180)}
              y2={CY - R * Math.sin((a * Math.PI) / 180)}
              style={{ stroke: 'var(--brand)' }}
              strokeWidth="2"
            />
          ))}
          <circle cx={CX + R * 0.8} cy={CY} r="4" style={{ fill: 'var(--brand)' }} />
          <circle cx={CX} cy={CY} r={r} style={{ fill: 'var(--ink)' }} />
        </g>

        {/* Load rope from the axle */}
        <line
          ref={loadRope}
          x1={CX - r}
          y1={CY}
          x2={CX - r}
          y2={restLoadTop}
          style={{ stroke: 'var(--ink)' }}
          strokeWidth="2"
        />
        <g ref={loadG}>
          <rect
            x={CX - r - 30}
            y={restLoadTop}
            width="60"
            height={LOAD_H}
            rx="3"
            style={{
              fill: 'color-mix(in srgb, var(--output) 18%, var(--surface))',
              stroke: 'var(--output)',
            }}
            strokeWidth="2"
          />
          <text
            x={CX - r}
            y={restLoadTop + LOAD_H / 2 + 4}
            textAnchor="middle"
            style={{ fill: 'var(--ink)' }}
            className="text-[11px]"
          >
            {params.loadMassKg} kg
          </text>
          <line
            x1={CX - r - 40}
            y1={restLoadTop + 4}
            x2={CX - r - 40}
            y2={GROUND_Y - 4}
            style={{ stroke: 'var(--output)' }}
            strokeWidth="2.5"
            markerEnd={`url(#${uid}-out)`}
          />
          <text
            x={CX - r - 56}
            y={GROUND_Y - 12}
            style={{ fill: 'var(--output)' }}
            className="font-display text-[13px] italic"
          >
            W
          </text>
        </g>

        {/* Effort rope from the wheel rim */}
        <line
          ref={effortRope}
          x1={CX + R}
          y1={CY}
          x2={CX + R}
          y2={EFFORT_START_Y}
          style={{ stroke: 'var(--input)' }}
          strokeWidth="2.5"
        />
        <g ref={effortG}>
          <rect
            x={CX + R - 7}
            y={EFFORT_START_Y}
            width="14"
            height="28"
            rx="3"
            style={{ fill: 'var(--surface)', stroke: 'var(--input)' }}
            strokeWidth="2"
          />
          <line
            x1={CX + R}
            y1={EFFORT_START_Y + 30}
            x2={CX + R}
            y2={EFFORT_START_Y + 54}
            style={{ stroke: 'var(--input)' }}
            strokeWidth="2.5"
            markerEnd={`url(#${uid}-in)`}
          />
          <text
            x={CX + R + 10}
            y={EFFORT_START_Y + 48}
            style={{ fill: 'var(--input)' }}
            className="font-display text-[14px] italic"
          >
            F
            <tspan className="text-[10px]" dy="3">
              in
            </tspan>
          </text>
        </g>
      </g>

      {/* Labels */}
      <text x={CX + R + 8} y={CY - R + 10} style={{ fill: 'var(--brand)' }} className="text-[12px]">
        wheel R = {params.wheelRadiusM.toFixed(2)} m
      </text>
      {/* Axle label sits outside the wheel, with a leader line to the axle */}
      <line
        x1={CX - r}
        y1={CY}
        x2={CX - R - 14}
        y2={CY - R * 0.55}
        style={{ stroke: 'var(--muted)' }}
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <text
        x={CX - R - 18}
        y={CY - R * 0.55 - 4}
        textAnchor="end"
        style={{ fill: 'var(--ink)' }}
        className="text-[12px]"
      >
        axle r = {params.axleRadiusM.toFixed(3)} m
      </text>
      <text x="300" y="250" style={{ fill: 'var(--input)' }} className="text-[12px]">
        rope pulled:{' '}
        <tspan ref={dinText} className="num">
          0.00
        </tspan>{' '}
        m
      </text>
      <text x="300" y="266" style={{ fill: 'var(--muted)' }} className="text-[11px]">
        ({ratio.toFixed(1)} × the load&apos;s rise)
      </text>
    </svg>
  );
}
