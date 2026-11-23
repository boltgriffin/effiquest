import { useEffect, useId, useRef } from 'react';
import type { DiagramProps } from '../shared/types';
import { SCREW_FIXED, type ScrewLabParams } from './screwParams';

const CX = 240;
const FLOOR = 296;
const PX_PER_M = 400; // handle radius to scale
const TRAVEL = 44; // drawn rise (not to scale: the true rise is 20 mm)

/**
 * Screw jack, side view. The handle radius is to scale; the rise is drawn larger than true and
 * labelled so. The handle's turning is shown by its foreshortened length and the moving knob.
 */
export function ScrewDiagram({
  params,
  motion,
  playing = false,
  className,
}: DiagramProps<ScrewLabParams>) {
  const uid = useId().replace(/:/g, '');
  const lift = useRef<SVGGElement>(null);
  const bar = useRef<SVGLineElement>(null);
  const knob = useRef<SVGCircleElement>(null);
  const arrow = useRef<SVGGElement>(null);
  const turnsText = useRef<SVGTSpanElement>(null);
  const riseText = useRef<SVGTSpanElement>(null);

  const R = params.handleRadiusM * PX_PER_M;
  const totalTurns = SCREW_FIXED.liftM / (params.pitchMm / 1000);
  const headY = 120;

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const f = motion ? motion.current.fraction : 0;
      const theta = 2 * Math.PI * totalTurns * f;
      const x = CX + R * Math.cos(theta);
      lift.current?.setAttribute('transform', `translate(0 ${-TRAVEL * f})`);
      bar.current?.setAttribute('x2', String(x));
      knob.current?.setAttribute('cx', String(x));
      // The knob is in front (towards you) for sin θ > 0: drawn larger then.
      knob.current?.setAttribute('r', String(Math.sin(theta) >= 0 ? 8 : 6));
      arrow.current?.setAttribute('transform', `translate(${x - (CX + R)} 0)`);
      if (turnsText.current) turnsText.current.textContent = (totalTurns * f).toFixed(1);
      if (riseText.current)
        riseText.current.textContent = (SCREW_FIXED.liftM * f * 1000).toFixed(1);
      if (motion?.current.playing) frame = requestAnimationFrame(draw);
    };
    draw();
    if (playing) frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [motion, playing, R, totalTurns]);

  const threadLines = Array.from({ length: 9 }, (_, i) => 170 + i * 10);

  return (
    <svg
      viewBox="0 0 480 340"
      role="img"
      aria-labelledby={`${uid}-t ${uid}-d`}
      className={className}
    >
      <title id={`${uid}-t`}>Screw jack</title>
      <desc id={`${uid}-d`}>
        {`A screw jack lifting a ${params.loadMassKg} kilogram load. A handle ${(params.handleRadiusM * 100).toFixed(0)} centimetres long turns a screw with a pitch of ${params.pitchMm} millimetres, so ${totalTurns.toFixed(1)} turns raise the load ${SCREW_FIXED.liftM * 1000} millimetres.`}
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
        y1={FLOOR}
        x2="460"
        y2={FLOOR}
        style={{ stroke: 'var(--ink)' }}
        strokeWidth="2"
      />
      {/* Base with the fixed nut */}
      <path
        d={`M${CX - 50} ${FLOOR} L${CX - 26} 236 H${CX + 26} L${CX + 50} ${FLOOR} Z`}
        style={{ fill: 'var(--surface-2)', stroke: 'var(--ink)' }}
        strokeWidth="2"
      />

      {/* Screw, handle and load rise together */}
      <g ref={lift}>
        <rect
          x={CX - 12}
          y={headY + 12}
          width="24"
          height={236 - headY - 12 + TRAVEL}
          style={{ fill: 'var(--surface)', stroke: 'var(--ink)' }}
          strokeWidth="1.5"
        />
        {threadLines.map((y) => (
          <line
            key={y}
            x1={CX - 12}
            y1={y}
            x2={CX + 12}
            y2={y - 6}
            style={{ stroke: 'var(--muted)' }}
            strokeWidth="1.5"
          />
        ))}
        <rect x={CX - 18} y={headY} width="36" height="14" rx="2" style={{ fill: 'var(--ink)' }} />
        <line
          ref={bar}
          x1={CX}
          y1={headY + 7}
          x2={CX + R}
          y2={headY + 7}
          style={{ stroke: 'var(--input)' }}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle ref={knob} cx={CX + R} cy={headY + 7} r="8" style={{ fill: 'var(--input)' }} />
        <g ref={arrow}>
          <line
            x1={CX + R}
            y1={headY - 42}
            x2={CX + R}
            y2={headY - 8}
            style={{ stroke: 'var(--input)' }}
            strokeWidth="2.5"
            markerEnd={`url(#${uid}-in)`}
          />
          <text
            x={CX + R + 6}
            y={headY - 28}
            style={{ fill: 'var(--input)' }}
            className="font-display text-[14px] italic"
          >
            F
            <tspan className="text-[10px]" dy="3">
              in
            </tspan>
          </text>
        </g>
        {/* Handle radius, to scale (moves with the handle) */}
        <line
          x1={CX}
          y1={headY + 24}
          x2={CX + R}
          y2={headY + 24}
          style={{ stroke: 'var(--muted)' }}
          strokeDasharray="3 3"
        />
        <text
          x={CX + 16 + R / 2}
          y={headY + 38}
          textAnchor="middle"
          style={{ fill: 'var(--muted)' }}
          className="text-[11px]"
        >
          R = {params.handleRadiusM.toFixed(2)} m
        </text>
        {/* Platform and load */}
        <rect x={CX - 44} y={headY - 6} width="88" height="6" style={{ fill: 'var(--ink)' }} />
        <rect
          x={CX - 40}
          y={headY - 52}
          width="80"
          height="46"
          rx="3"
          style={{
            fill: 'color-mix(in srgb, var(--output) 18%, var(--surface))',
            stroke: 'var(--output)',
          }}
          strokeWidth="2"
        />
        <text
          x={CX}
          y={headY - 25}
          textAnchor="middle"
          style={{ fill: 'var(--ink)' }}
          className="text-[11px]"
        >
          {params.loadMassKg} kg
        </text>
        <line
          x1={CX - 58}
          y1={headY - 52}
          x2={CX - 58}
          y2={headY - 14}
          style={{ stroke: 'var(--output)' }}
          strokeWidth="2.5"
          markerEnd={`url(#${uid}-out)`}
        />
        <text
          x={CX - 74}
          y={headY - 26}
          style={{ fill: 'var(--output)' }}
          className="font-display text-[13px] italic"
        >
          W
        </text>
      </g>

      <text x={CX + 60} y="262" style={{ fill: 'var(--muted)' }} className="text-[11px]">
        pitch p = {params.pitchMm} mm (rise per turn)
      </text>
      <text
        x="240"
        y="330"
        textAnchor="middle"
        style={{ fill: 'var(--muted)' }}
        className="text-[11px]"
      >
        Rise drawn larger than true. Handle turns{' '}
        <tspan ref={turnsText} className="num">
          0.0
        </tspan>{' '}
        of {totalTurns.toFixed(1)} · load raised{' '}
        <tspan ref={riseText} className="num">
          0.0
        </tspan>{' '}
        mm
      </text>
    </svg>
  );
}
