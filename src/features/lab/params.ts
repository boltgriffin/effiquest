/** Inclined-plane set-up chosen by the learner (SI units except the angle, in degrees). */
export interface InclineParams {
  angleDeg: number;
  friction: number;
  massKg: number;
}

export const DEFAULT_PARAMS: InclineParams = { angleDeg: 30, friction: 0.2, massKg: 10 };

/** Length of the ramp surface (m). Fixed, so changing the angle changes the height. */
export const RAMP_LENGTH_M = 2;

/** Pulling speed during a run (m/s); a 2 m ramp takes about 4.4 s. */
export const PULL_SPEED_MPS = 0.5;

/** Instrument resolutions, like the classroom spring scale and ruler. */
export const SCALE_RESOLUTION_N = 0.1;
export const RULER_RESOLUTION_M = 0.01;
