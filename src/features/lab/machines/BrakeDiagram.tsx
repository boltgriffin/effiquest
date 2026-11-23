import { useEffect, useId, useRef } from 'react';
import { solveBrake } from '@/physics-core';
import type { DiagramProps } from '../shared/types';
import { BRAKE_FIXED, toBrakeModel, type BrakeLabParams } from './brakeParams';

const PIVOT = { x: 70, y: 56 };
const ARM_PX = 150; // pedal arm drawn 0.3 m long
const MAG = 5; // movements are tiny (under 2 cm at the pedal): drawn 5 times larger
const LINE_Y = 150;

/**
 * Hydraulic brake, schematic side view: pedal lever → master cylinder → line → caliper on the
 * disc. Piston diameters are drawn to scale with each other; movements are magnified and
 * labelled so.
 */
export function BrakeDiagram({
  params,
  motion,
  playing = false,
  className,
}: DiagramProps<BrakeLabParams>) {
  const uid = useId().replace(/:/g, '');
  const pedal = useRef<SVGGElement>(null);
  const master = useRef<SVGGElement>(null);
  const caliper = useRef<SVGGElement>(null);
  const travelText = useRef<SVGTSpanElement>(null);
  const pushrod = useRef<SVGLineElement>(null);

  const s = solveBrake(toBrakeModel(params));
  const pushrodPx = ARM_PX / params.pedalRatio;
  const areaRatio = (params.caliperDiameterMm / params.masterDiameterMm) ** 2;
  const padTravel = BRAKE_FIXED.padTravelM;
  const pedalTravelM = padTravel * areaRatio * params.pedalRatio;
  const d1 = params.masterDiameterMm * 1.4; // px
  const d2 = params.caliperDiameterMm * 1.4;

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const f = motion ? motion.current.fraction : 0;
      const pedalAngle = ((f * pedalTravelM) / BRAKE_FIXED.pedalArmM) * MAG; // rad, magnified
      pedal.current?.setAttribute(
        'transform',
        `rotate(${(-pedalAngle * 180) / Math.PI} ${PIVOT.x} ${PIVOT.y})`,
      );
      const x1 = ((f * pedalTravelM) / params.pedalRatio) * 1000 * 1.4 * MAG; // px
      master.current?.setAttribute('transform', `translate(${x1} 0)`);
      pushrod.current?.setAttribute('x1', String(PIVOT.x + Math.sin(pedalAngle) * pushrodPx));
      pushrod.current?.setAttribute('y1', String(PIVOT.y + Math.cos(pedalAngle) * pushrodPx));
      pushrod.current?.setAttribute('x2', String(152 + x1));
      caliper.current?.setAttribute(
        'transform',
        `translate(${-f * padTravel * 1000 * 1.4 * MAG} 0)`,
      );
      if (travelText.current) travelText.current.textContent = (f * pedalTravelM * 1000).toFixed(1);
      if (motion?.current.playing) frame = requestAnimationFrame(draw);
    };
    draw();
    if (playing) frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [motion, playing, pedalTravelM, padTravel, params.pedalRatio, pushrodPx]);

  const pushPt = { x: PIVOT.x + 2, y: PIVOT.y + pushrodPx };
  return (
    <svg
      viewBox="0 0 480 300"
      role="img"
      aria-labelledby={`${uid}-t ${uid}-d`}
      className={className}
    >
      <title id={`${uid}-t`}>Hydraulic brake</title>
      <desc id={`${uid}-d`}>
        {`A brake pedal with a pedal ratio of ${params.pedalRatio} pushes a ${params.masterDiameterMm} millimetre master cylinder piston. Brake fluid carries the pressure to a ${params.caliperDiameterMm} millimetre caliper piston that squeezes the pads against the disc with ${params.clampForceN} newtons.`}
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
      {/* Pedal lever */}
      <circle cx={PIVOT.x} cy={PIVOT.y} r="5" style={{ fill: 'var(--ink)' }} />
      <text
        x={PIVOT.x - 10}
        y={PIVOT.y - 10}
        textAnchor="end"
        style={{ fill: 'var(--muted)' }}
        className="text-[11px]"
      >
        pivot
      </text>
      <g ref={pedal}>
        <line
          x1={PIVOT.x}
          y1={PIVOT.y}
          x2={PIVOT.x}
          y2={PIVOT.y + ARM_PX}
          style={{ stroke: 'var(--ink)' }}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <rect
          x={PIVOT.x - 22}
          y={PIVOT.y + ARM_PX - 4}
          width="26"
          height="12"
          rx="2"
          style={{ fill: 'var(--input)' }}
        />
        <line
          x1={PIVOT.x - 70}
          y1={PIVOT.y + ARM_PX + 2}
          x2={PIVOT.x - 26}
          y2={PIVOT.y + ARM_PX + 2}
          style={{ stroke: 'var(--input)' }}
          strokeWidth="2.5"
          markerEnd={`url(#${uid}-in)`}
        />
        <text
          x={PIVOT.x - 68}
          y={PIVOT.y + ARM_PX - 6}
          style={{ fill: 'var(--input)' }}
          className="font-display text-[14px] italic"
        >
          F
          <tspan className="text-[10px]" dy="3">
            in
          </tspan>
        </text>
      </g>
      {/* Pushrod: joins the moving pedal to the moving master piston (updated each frame) */}
      <line
        ref={pushrod}
        x1={pushPt.x}
        y1={pushPt.y}
        x2={152}
        y2={LINE_Y - 30}
        style={{ stroke: 'var(--muted)' }}
        strokeWidth="3"
      />
      <text
        x={PIVOT.x + 10}
        y={PIVOT.y + pushrodPx / 2 + 4}
        style={{ fill: 'var(--muted)' }}
        className="text-[10px]"
      >
        ÷ {params.pedalRatio}
      </text>

      {/* Master cylinder */}
      <rect
        x="150"
        y={LINE_Y - 30 - d1 / 2}
        width="70"
        height={d1}
        style={{
          fill: 'color-mix(in srgb, var(--brand) 18%, var(--surface))',
          stroke: 'var(--ink)',
        }}
        strokeWidth="2"
      />
      <g ref={master}>
        <rect
          x="152"
          y={LINE_Y - 30 - d1 / 2 + 2}
          width="10"
          height={d1 - 4}
          style={{ fill: 'var(--input)' }}
        />
      </g>
      <text
        x="185"
        y={LINE_Y - 30 - d1 / 2 - 6}
        textAnchor="middle"
        style={{ fill: 'var(--ink)' }}
        className="text-[11px]"
      >
        master, d₁ {params.masterDiameterMm} mm
      </text>
      {/* Brake line */}
      <path
        d={`M220 ${LINE_Y - 30} H300 V${LINE_Y + 40} H330`}
        style={{ fill: 'none', stroke: 'var(--brand)' }}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <text
        x="262"
        y={LINE_Y - 38}
        textAnchor="middle"
        style={{ fill: 'var(--ink)' }}
        className="text-[11px]"
      >
        P = <tspan className="num">{(s.pressurePa / 1e6).toFixed(2)}</tspan> MPa
      </text>

      {/* Caliper, pads and disc */}
      <rect x="388" y="70" width="10" height="170" rx="2" style={{ fill: 'var(--muted)' }} />
      <text
        x="393"
        y="62"
        textAnchor="middle"
        style={{ fill: 'var(--muted)' }}
        className="text-[11px]"
      >
        disc
      </text>
      <rect
        x="330"
        y={LINE_Y + 40 - d2 / 2}
        width="46"
        height={d2}
        style={{
          fill: 'color-mix(in srgb, var(--brand) 18%, var(--surface))',
          stroke: 'var(--ink)',
        }}
        strokeWidth="2"
      />
      <g ref={caliper}>
        <rect
          x="366"
          y={LINE_Y + 40 - d2 / 2 + 2}
          width="10"
          height={d2 - 4}
          style={{ fill: 'var(--brand)' }}
        />
        <rect
          x="378"
          y={LINE_Y + 40 - d2 / 2}
          width="8"
          height={d2}
          style={{ fill: 'var(--output)' }}
        />
      </g>
      <rect
        x="400"
        y={LINE_Y + 40 - d2 / 2}
        width="8"
        height={d2}
        style={{ fill: 'var(--output)' }}
      />
      <line
        x1="440"
        y1={LINE_Y + 40}
        x2="412"
        y2={LINE_Y + 40}
        style={{ stroke: 'var(--output)' }}
        strokeWidth="2.5"
        markerEnd={`url(#${uid}-out)`}
      />
      <text
        x="476"
        y="262"
        textAnchor="end"
        style={{ fill: 'var(--output)' }}
        className="text-[11px]"
      >
        pads, Q = {params.clampForceN} N
      </text>
      <text
        x="380"
        y={LINE_Y + 40 + d2 / 2 + 16}
        textAnchor="end"
        style={{ fill: 'var(--ink)' }}
        className="text-[11px]"
      >
        caliper, d₂ {params.caliperDiameterMm} mm
      </text>

      <text
        x="240"
        y="24"
        textAnchor="middle"
        style={{ fill: 'var(--ink)' }}
        className="text-[12px]"
      >
        lever × Pascal: IMA = {params.pedalRatio} × {areaRatio.toFixed(2)} ={' '}
        <tspan className="num">{(params.pedalRatio * areaRatio).toFixed(1)}</tspan>
      </text>
      <text
        x="240"
        y="292"
        textAnchor="middle"
        style={{ fill: 'var(--muted)' }}
        className="text-[11px]"
      >
        Movements drawn {MAG}× larger. Pedal pressed{' '}
        <tspan ref={travelText} className="num">
          0.0
        </tspan>{' '}
        mm of {(pedalTravelM * 1000).toFixed(1)} mm · pads squeezed {padTravel * 1000} mm
      </text>
    </svg>
  );
}
