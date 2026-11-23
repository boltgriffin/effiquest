import { useEffect, useId, useRef } from 'react';
import { sprocketRadius } from '@/physics-core';
import type { DiagramProps } from '../shared/types';
import { BICYCLE_FIXED, type BicycleLabParams } from './bicycleParams';

const PX = 150; // px per metre: the bicycle is drawn to scale
const ROAD_X0 = 20;
const ROAD_Y0 = 296;

/**
 * Bicycle on a hill, side view, to scale. The wheels and the crank turn in the true ratio
 * (crank angle = wheel angle × r₂ ÷ r₁) and the counters show distance, height and pedal turns.
 */
export function BicycleDiagram({
  params,
  motion,
  playing = false,
  className,
}: DiagramProps<BicycleLabParams>) {
  const uid = useId().replace(/:/g, '');
  const rearWheel = useRef<SVGGElement>(null);
  const frontWheel = useRef<SVGGElement>(null);
  const crank = useRef<SVGGElement>(null);
  const distText = useRef<SVGTSpanElement>(null);
  const riseText = useRef<SVGTSpanElement>(null);
  const turnsText = useRef<SVGTSpanElement>(null);

  const alpha = Math.atan(params.slopePercent / 100);
  const deg = (alpha * 180) / Math.PI;
  const Rw = BICYCLE_FIXED.wheelRadiusM * PX;
  const r1 = sprocketRadius(params.chainringTeeth, BICYCLE_FIXED.chainPitchM) * PX;
  const r2 = sprocketRadius(params.sprocketTeeth, BICYCLE_FIXED.chainPitchM) * PX;
  const crankL = BICYCLE_FIXED.crankM * PX;
  const sin = Math.sin(alpha);
  const totalPedalTurns =
    (BICYCLE_FIXED.distanceM / (2 * Math.PI * BICYCLE_FIXED.wheelRadiusM)) * (r2 / r1);

  // Bicycle frame, drawn level; the whole bike is then tilted to the hill.
  const rear = { x: 0, y: 0 };
  const front = { x: 1.0 * PX, y: 0 };
  const bb = { x: 0.42 * PX, y: 0.07 * PX };
  const seat = { x: 0.3 * PX, y: -0.5 * PX };
  const head = { x: 0.88 * PX, y: -0.42 * PX };

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const f = motion ? motion.current.fraction : 0;
      const d = f * BICYCLE_FIXED.distanceM;
      const wheelDeg = ((d / BICYCLE_FIXED.wheelRadiusM) * 180) / Math.PI;
      const crankDeg = wheelDeg * (r2 / r1);
      rearWheel.current?.setAttribute('transform', `rotate(${wheelDeg})`);
      frontWheel.current?.setAttribute('transform', `translate(${front.x} 0) rotate(${wheelDeg})`);
      crank.current?.setAttribute('transform', `translate(${bb.x} ${bb.y}) rotate(${crankDeg})`);
      if (distText.current) distText.current.textContent = d.toFixed(1);
      if (riseText.current) riseText.current.textContent = (d * sin).toFixed(2);
      if (turnsText.current) turnsText.current.textContent = (totalPedalTurns * f).toFixed(1);
      if (motion?.current.playing) frame = requestAnimationFrame(draw);
    };
    draw();
    if (playing) frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [motion, playing, r1, r2, sin, totalPedalTurns, front.x, bb.x, bb.y]);

  // Rear contact point on the road, and the road line.
  const cx = 150;
  const cy = ROAD_Y0 - (cx - ROAD_X0) * Math.tan(alpha);
  const spokes = [0, 45, 90, 135];
  const wheel = (key: string) => (
    <g key={key}>
      <circle r={Rw} style={{ fill: 'none', stroke: 'var(--ink)' }} strokeWidth="4" />
      <circle r={Rw - 5} style={{ fill: 'none', stroke: 'var(--muted)' }} strokeWidth="1.5" />
      {spokes.map((a) => (
        <line
          key={a}
          x1={-Rw + 5}
          y1="0"
          x2={Rw - 5}
          y2="0"
          transform={`rotate(${a})`}
          style={{ stroke: 'var(--muted)' }}
          strokeWidth="1"
        />
      ))}
      <circle r="3" style={{ fill: 'var(--ink)' }} />
    </g>
  );

  return (
    <svg
      viewBox="0 0 480 350"
      role="img"
      aria-labelledby={`${uid}-t ${uid}-d`}
      className={className}
    >
      <title id={`${uid}-t`}>Bicycle climbing a hill</title>
      <desc id={`${uid}-d`}>
        {`A bicycle with a ${params.chainringTeeth}-tooth chainring and a ${params.sprocketTeeth}-tooth rear sprocket rides ${BICYCLE_FIXED.distanceM} metres up a ${params.slopePercent} percent hill, gaining ${(BICYCLE_FIXED.distanceM * sin).toFixed(1)} metres of height.`}
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
      {/* Road */}
      <path
        d={`M${ROAD_X0} ${ROAD_Y0} L470 ${ROAD_Y0 - (470 - ROAD_X0) * Math.tan(alpha)} L470 326 L${ROAD_X0} 326 Z`}
        style={{ fill: 'var(--surface-2)', stroke: 'var(--ink)' }}
        strokeWidth="1.5"
      />

      <g transform={`translate(${cx} ${cy}) rotate(${-deg}) translate(0 ${-Rw})`}>
        {/* Chain: top and bottom runs between the chainring and the sprocket */}
        <line
          x1={0}
          y1={-r2}
          x2={bb.x}
          y2={bb.y - r1}
          style={{ stroke: 'var(--muted)' }}
          strokeWidth="2"
        />
        <line
          x1={0}
          y1={r2}
          x2={bb.x}
          y2={bb.y + r1}
          style={{ stroke: 'var(--muted)' }}
          strokeWidth="2"
          strokeDasharray="3 2"
        />
        <circle
          cx={0}
          cy={0}
          r={r2}
          style={{ fill: 'none', stroke: 'var(--ink)' }}
          strokeWidth="2"
        />
        <g ref={rearWheel}>{wheel('rear')}</g>
        <g ref={frontWheel}>{wheel('front')}</g>
        {/* Frame */}
        <path
          d={`M${rear.x} ${rear.y} L${bb.x} ${bb.y} L${seat.x} ${seat.y} Z M${seat.x} ${seat.y} L${head.x} ${head.y} L${bb.x} ${bb.y} M${head.x} ${head.y} L${front.x} ${front.y}`}
          style={{ fill: 'none', stroke: 'var(--brand)' }}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d={`M${seat.x - 12} ${seat.y - 6} h26`}
          style={{ stroke: 'var(--ink)' }}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d={`M${head.x} ${head.y} l6 -14 h14`}
          style={{ fill: 'none', stroke: 'var(--ink)' }}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Chainring and crank with the pedal */}
        <circle
          cx={bb.x}
          cy={bb.y}
          r={r1}
          style={{ fill: 'none', stroke: 'var(--ink)' }}
          strokeWidth="2.5"
        />
        <g ref={crank}>
          <line
            x1="0"
            y1="0"
            x2={crankL}
            y2="0"
            style={{ stroke: 'var(--input)' }}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <rect
            x={crankL - 7}
            y="-3"
            width="14"
            height="6"
            rx="1"
            style={{ fill: 'var(--input)' }}
          />
          <line
            x1={crankL}
            y1={-34}
            x2={crankL}
            y2={-8}
            style={{ stroke: 'var(--input)' }}
            strokeWidth="2.5"
            markerEnd={`url(#${uid}-in)`}
          />
        </g>
        {/* Weight of rider + bicycle */}
        <line
          x1={0.45 * PX}
          y1={-0.55 * PX}
          x2={0.45 * PX}
          y2={-0.2 * PX}
          transform={`rotate(${deg} ${0.45 * PX} ${-0.55 * PX})`}
          style={{ stroke: 'var(--output)' }}
          strokeWidth="2.5"
          markerEnd={`url(#${uid}-out)`}
        />
      </g>

      <text
        x="240"
        y="26"
        textAnchor="middle"
        style={{ fill: 'var(--ink)' }}
        className="text-[12px]"
      >
        gear {params.chainringTeeth} / {params.sprocketTeeth} · hill {params.slopePercent} % (
        {deg.toFixed(1)}°) · {params.massKg} kg
      </text>
      <text
        x="240"
        y="46"
        textAnchor="middle"
        style={{ fill: 'var(--muted)' }}
        className="text-[11px]"
      >
        crank → chainring → chain → sprocket → wheel → hill
      </text>
      <text
        x="240"
        y="344"
        textAnchor="middle"
        style={{ fill: 'var(--muted)' }}
        className="text-[11px]"
      >
        Ridden{' '}
        <tspan ref={distText} className="num">
          0.0
        </tspan>{' '}
        m · height gained{' '}
        <tspan ref={riseText} className="num">
          0.00
        </tspan>{' '}
        m · pedal turns{' '}
        <tspan ref={turnsText} className="num">
          0.0
        </tspan>
      </text>
    </svg>
  );
}
