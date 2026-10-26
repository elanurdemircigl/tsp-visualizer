// Modüller arasındaki TEK sözleşme. Sadece Koordinatör değiştirir (bkz. AGENTS.md).

export type Point = { id: string; lat: number; lng: number; label?: string };

export type SolverId = 'nn' | '2opt' | 'sa' | 'ga';

export type SolverStep = {
  iteration: number;
  tour: number[]; // nokta indeksleri
  cost: number; // metre
  bestCost: number;
  highlight?: [number, number][]; // bu adımda değişen kenarlar
  note?: string; // öğretici mod için
};

export type SolverParams = Record<string, number>;

export interface Solver<P extends SolverParams = SolverParams> {
  id: SolverId;
  name: string;
  defaultParams: P;
  /** dist: n×n satır-öncelikli mesafe matrisi (metre). */
  solve(dist: Float64Array, n: number, params: P): Generator<SolverStep>;
}

// --- Worker protokolü: UI → Worker ---
export type WorkerCommand =
  | { type: 'start'; solverId: SolverId; points: Point[]; params: SolverParams }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'step' } // duraklatılmışken tek adım ilerlet
  | { type: 'stop' };

// --- Worker protokolü: Worker → UI (step mesajları en fazla saniyede 60) ---
export type WorkerEvent =
  | { type: 'step'; step: SolverStep }
  | { type: 'done'; step: SolverStep; elapsedMs: number }
  | { type: 'error'; message: string };
