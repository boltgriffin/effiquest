import { useEffect, useId, useRef } from 'react';
import { solveHydraulic } from '@/physics-core';
import type { DiagramProps } from '../shared/types';
import {
  areaRatio,
  HYDRAULIC_LIFT_M,
  toHydraulicModel,
  type HydraulicLabParams,
} from './hydraulicParams';

const D = 1000; // px per metre of piston diameter (diameters to scale)
const LX = 130;
const RX = 330;
const TOP = 60;
const BOTTOM = 280;
const IN_START = 96; // input piston face at rest
const OUT_START = 226; // output piston face at rest
const IN_TRAVEL = 150; // drawn travel (not to scale)
const OUT_TRAVEL = 50;

/**
 * Hydraulic press: two cylinders joined by a pipe full of fluid. Piston diameters are to scale;
 * movements are NOT (the small piston travels A₂/A₁ times further than the load rises, up to tens of
 * times), so both are drawn over fixed distances and the true distances are shown as numbers.
 */
export function HydraulicDiagram({
  params,
  motion,
  playing = false,
  className,
}: DiagramProps<HydraulicLabParams>) {
  const uid = useId().replace(/:/g, '');
  const inG = useRef<SVGGElement>(null);
  const outG = useRef<SVGGElement>(null);
  const inFluid = useRef<SVGRectElement>(null);
  const outFluid = useRef<SVGRectElement>(null);
  const dinText = useRef<SVGTSpanElement>(null);
  const doutText = useRef<SVGTSpanElement>(null);

  const w1 = Math.max(14, params.inputDiameterM * D);
  const w2 = params.outputDiameterM * D;
  const ratio = areaRatio(params);
  const pressureKPa = solveHydraulic(toHydraulicModel(params)).pressurePa / 1000;

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const f = motion ? motion.current.fraction : 0;
      const dIn = f * IN_TRAVEL;
      const dOut = f * OUT_TRAVEL;
      inG.current?.setAttribute('transform', `translate(0 ${dIn})`);
      outG.current?.setAttribute('transform', `translate(0 ${-dOut})`);
      inFluid.current?.setAttribute('y', String(IN_START + dIn));
      inFluid.current?.setAttribute('height', String(BOTTOM - IN_START - dIn));
      outFluid.current?.setAttribute('y', String(OUT_START - dOut));
      outFluid.current?.setAttribute('height', String(BOTTOM - OUT_START + dOut));
      // True distances: the load rise is f × lift; the input travel uses the ideal ratio here
      // (the measurement panel shows the real value, including the extra stroke from leakage).
      if (doutText.current) doutText.current.textContent = (f * HYDRAULIC_LIFT_M).toFixed(3);
      if (dinText.current) dinText.current.textContent = (f * HYDRAULIC_LIFT_M * ratio).toFixed(2);
      if (motion?.current.playing) frame = requestAnimationFrame(draw);
    };
    draw();
    if (playing) frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [motion, playing, ratio]);

  const fluid = 'color-mix(in srgb, var(--brand) 22%, var(--surface))';

  return (
    <svg
      viewBox="0 0 480 354"
      role="img"
      aria-labelledby={`${uid}-t ${uid}-d`}
      className={className}
    >
      <title id={`${uid}-t`}>Hydraulic press</title>
      <desc id={`${uid}-d`}>
        {`A small piston ${(params.inputDiameterM * 100).toFixed(1)} centimetres wide and a large piston ${(params.outputDiameterM * 100).toFixed(1)} centimetres wide are joined by a pipe full of fluid. Pushing the small piston down raises the ${params.loadMassKg} kilogram load on the large piston. The area ratio is ${ratio.toFixed(1)}.`}
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

      {/* Connecting pipe and fluid */}
      <rect
        x={LX - w1 / 2}
        y={BOTTOM}
        width={RX - LX + w1 / 2 + w2 / 2}
        height="22"
        style={{ fill: fluid, stroke: 'var(--ink)' }}
        strokeWidth="2"
      />
      <rect
        ref={inFluid}
        x={LX - w1 / 2}
        y={IN_START}
        width={w1}
        height={BOTTOM - IN_START}
        style={{ fill: fluid }}
      />
      <rect
        ref={outFluid}
        x={RX - w2 / 2}
        y={OUT_START}
        width={w2}
        height={BOTTOM - OUT_START}
        style={{ fill: fluid }}
      />
      {/* Cylinder walls */}
      <path
        d={`M${LX - w1 / 2} ${TOP} V${BOTTOM} M${LX + w1 / 2} ${TOP} V${BOTTOM}`}
        style={{ stroke: 'var(--ink)' }}
        strokeWidth="2"
      />
      <path
        d={`M${RX - w2 / 2} ${TOP + 70} V${BOTTOM} M${RX + w2 / 2} ${TOP + 70} V${BOTTOM}`}
        style={{ stroke: 'var(--ink)' }}
        strokeWidth="2"
      />

      {/* Input piston, rod and effort */}
      <g ref={inG}>
        <rect
          x={LX - w1 / 2 + 1}
          y={IN_START - 10}
          width={w1 - 2}
          height="10"
          style={{ fill: 'var(--input)' }}
        />
        <line
          x1={LX}
          y1={IN_START - 10}
          x2={LX}
          y2={IN_START - 60}
          style={{ stroke: 'var(--input)' }}
          strokeWidth="4"
        />
        <line
          x1={LX + 22}
          y1={IN_START - 70}
          x2={LX + 22}
          y2={IN_START - 30}
          style={{ stroke: 'var(--input)' }}
          strokeWidth="2.5"
          markerEnd={`url(#${uid}-in)`}
        />
        <text
          x={LX + 28}
          y={IN_START - 46}
          style={{ fill: 'var(--input)' }}
          className="font-display text-[14px] italic"
        >
          F
          <tspan className="text-[10px]" dy="3">
            in
          </tspan>
        </text>
        {params.leakMlPerS > 0 ? (
          <g style={{ fill: 'var(--loss)' }}>
            <path d={`M${LX - w1 / 2 - 6} ${IN_START + 6} q-4 7 0 10 q4 -3 0 -10z`} />
            <path d={`M${LX + w1 / 2 + 6} ${IN_START + 12} q-4 7 0 10 q4 -3 0 -10z`} />
          </g>
        ) : null}
      </g>

      {/* Output piston and load */}
      <g ref={outG}>
        <rect
          x={RX - w2 / 2 + 1}
          y={OUT_START - 10}
          width={w2 - 2}
          height="10"
          style={{ fill: 'var(--brand)' }}
        />
        <rect
          x={RX - 32}
          y={OUT_START - 50}
          width="64"
          height="40"
          rx="3"
          style={{
            fill: 'color-mix(in srgb, var(--output) 18%, var(--surface))',
            stroke: 'var(--output)',
          }}
          strokeWidth="2"
        />
        <text
          x={RX}
          y={OUT_START - 26}
          textAnchor="middle"
          style={{ fill: 'var(--ink)' }}
          className="text-[11px]"
        >
          {params.loadMassKg} kg
        </text>
        <line
          x1={RX + 44}
          y1={OUT_START - 50}
          x2={RX + 44}
          y2={OUT_START - 12}
          style={{ stroke: 'var(--output)' }}
          strokeWidth="2.5"
          markerEnd={`url(#${uid}-out)`}
        />
        <text
          x={RX + 50}
          y={OUT_START - 20}
          style={{ fill: 'var(--output)' }}
          className="font-display text-[13px] italic"
        >
          W
        </text>
      </g>

      {/* Labels */}
      <text
        x={LX}
        y={BOTTOM + 40}
        textAnchor="middle"
        style={{ fill: 'var(--input)' }}
        className="text-[11px]"
      >
        small piston, A₁
      </text>
      <text
        x={RX}
        y={BOTTOM + 40}
        textAnchor="middle"
        style={{ fill: 'var(--brand)' }}
        className="text-[11px]"
      >
        large piston, A₂ = {ratio.toFixed(1)} × A₁
      </text>
      <text
        x="232"
        y="30"
        textAnchor="middle"
        style={{ fill: 'var(--ink)' }}
        className="text-[12px]"
      >
        pressure P ≈ <tspan className="num">{pressureKPa.toFixed(0)}</tspan> kPa everywhere in the
        fluid
      </text>
      <text
        x="240"
        y="344"
        textAnchor="middle"
        style={{ fill: 'var(--muted)' }}
        className="text-[11px]"
      >
        Movements not to scale. Small piston pushed{' '}
        <tspan ref={dinText} className="num">
          0.00
        </tspan>{' '}
        m (ideal) · load raised{' '}
        <tspan ref={doutText} className="num">
          0.000
        </tspan>{' '}
        m
      </text>
    </svg>
  );
}
