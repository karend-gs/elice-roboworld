export type Cell = "empty" | "wall" | "leaf" | "stone";
export type Direction = "NORTH" | "EAST" | "SOUTH" | "WEST";

export type RobotState = {
  row: number;
  col: number;
  dir: Direction;
  leafs: number;
  stone: boolean;
};

export type WorldState = {
  rows: number;
  cols: number;
  cells: Cell[][];
  marks: boolean[][];
  robot: RobotState;
  goal: { row: number; col: number };
};

export type Snapshot = {
  world: WorldState;
  action: string;
};

export type LogLevel = "info" | "error" | "success" | "action";

export type LogLine = {
  level: LogLevel;
  text: string;
};

export type RunResult = {
  snapshots: Snapshot[];
  logs: LogLine[];
  error?: string;
  crashed: boolean;
};

export type GradeResult = {
  passed: boolean;
  message: string;
};
