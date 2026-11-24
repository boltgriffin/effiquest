/** Misconception ids map to SRC-G1..G6 in docs/SOURCE_REQUIREMENTS.md. */
export type MisconceptionId = 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6';

export type MachineId =
  | 'incline'
  | 'lever'
  | 'pulley'
  | 'wheel_axle'
  | 'screw'
  | 'wedge'
  | 'hydraulic'
  | 'bicycle'
  | 'brake';

/** A YouTube video chosen by the teacher for a module (decisions D-10, D-27). */
export interface YouTubeVideoRef {
  /** The 11-character id from the YouTube link (watch?v=<id>). */
  youtubeId: string;
  /** Title as listed on YouTube. */
  title: string;
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  /** Markdown body. */
  body: string;
  order: number;
  misconceptionIds: MisconceptionId[];
  durationMin: number;
}

/** A guided lab activity: predict, observe/measure, explain. */
export interface Experiment {
  id: string;
  machine: MachineId;
  title: string;
  predictPrompt: string;
  explainPrompt: string;
  order: number;
  misconceptionIds: MisconceptionId[];
}
