import type { Cell, Direction, RobotState, WorldState } from "./types";

const DIRS: Direction[] = ["NORTH", "WEST", "SOUTH", "EAST"];

const DELTA: Record<Direction, { dr: number; dc: number }> = {
  NORTH: { dr: -1, dc: 0 },
  EAST: { dr: 0, dc: 1 },
  SOUTH: { dr: 1, dc: 0 },
  WEST: { dr: 0, dc: -1 },
};

export class RoboException extends Error {
  constructor(name: string, message: string) {
    super(message);
    this.name = name;
  }
}

export function cloneWorld(world: WorldState): WorldState {
  return {
    rows: world.rows,
    cols: world.cols,
    cells: world.cells.map((row) => row.slice()),
    marks: world.marks.map((row) => row.slice()),
    robot: { ...world.robot },
    goal: { ...world.goal },
  };
}

export function parseWorld(text: string, nleafs = 0): WorldState {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("Empty world");
  }

  const cols = Math.max(...lines.map((line) => line.length));
  const rows = lines.length;
  const cells: Cell[][] = [];
  const marks: boolean[][] = [];
  let robot: RobotState | null = null;
  let goal: { row: number; col: number } | null = null;

  for (let r = 0; r < rows; r += 1) {
    const line = lines[r].padEnd(cols, "-");
    const cellRow: Cell[] = [];
    const markRow: boolean[] = [];
    for (let c = 0; c < cols; c += 1) {
      const ch = line[c];
      markRow.push(false);
      if (ch === "#") {
        cellRow.push("wall");
      } else if (ch === "O") {
        cellRow.push("stone");
      } else if (ch === "L") {
        cellRow.push("leaf");
      } else {
        cellRow.push("empty");
      }

      if (ch === "G") {
        goal = { row: r, col: c };
      }
      if ("NSWER".includes(ch)) {
        const dir: Direction =
          ch === "N"
            ? "NORTH"
            : ch === "S"
              ? "SOUTH"
              : ch === "W"
                ? "WEST"
                : "EAST";
        robot = { row: r, col: c, dir, leafs: nleafs, stone: false };
      }
    }
    cells.push(cellRow);
    marks.push(markRow);
  }

  if (!robot) {
    throw new Error("World is missing a robot (N/S/W/E/R)");
  }
  if (!goal) {
    goal = { row: robot.row, col: robot.col };
  }

  return { rows, cols, cells, marks, robot, goal };
}

function inBounds(world: WorldState, row: number, col: number) {
  return row >= 0 && col >= 0 && row < world.rows && col < world.cols;
}

function frontPos(world: WorldState) {
  const { dr, dc } = DELTA[world.robot.dir];
  return { row: world.robot.row + dr, col: world.robot.col + dc };
}

function frontCell(world: WorldState): Cell | "boundary" {
  const { row, col } = frontPos(world);
  if (!inBounds(world, row, col)) return "boundary";
  return world.cells[row][col];
}

export class RoboWorld {
  state: WorldState;
  actionCount = 0;
  maxActions = 2500;

  constructor(initial: WorldState) {
    this.state = cloneWorld(initial);
  }

  private bump() {
    this.actionCount += 1;
    if (this.actionCount > this.maxActions) {
      throw new RoboException(
        "TimeoutException",
        "The program ran too long. Check for an infinite loop.",
      );
    }
  }

  move() {
    this.bump();
    const ahead = frontCell(this.state);
    if (ahead === "boundary" || ahead === "wall") {
      throw new RoboException("WallInFrontException", "Wall in front");
    }
    if (ahead === "stone") {
      throw new RoboException("StoneInFrontException", "Stone in front");
    }
    const pos = frontPos(this.state);
    this.state.robot.row = pos.row;
    this.state.robot.col = pos.col;
  }

  turn_left() {
    this.bump();
    const i = DIRS.indexOf(this.state.robot.dir);
    this.state.robot.dir = DIRS[(i + 1) % 4];
  }

  is_facing_north() {
    return this.state.robot.dir === "NORTH";
  }

  is_carrying_stone() {
    return this.state.robot.stone;
  }

  is_carrying_leafs() {
    return this.state.robot.leafs > 0;
  }

  take_leaf() {
    this.bump();
    const { row, col } = this.state.robot;
    if (this.state.cells[row][col] !== "leaf") {
      throw new RoboException("LeafMissingException", "No leaf here");
    }
    this.state.cells[row][col] = "empty";
    this.state.robot.leafs += 1;
  }

  put_leaf() {
    this.bump();
    if (this.state.robot.leafs <= 0) {
      throw new RoboException("NoMoreLeafsException", "Not carrying leaves");
    }
    const { row, col } = this.state.robot;
    if (this.state.cells[row][col] !== "empty") {
      throw new RoboException("CellOccupiedException", "Cell occupied");
    }
    this.state.cells[row][col] = "leaf";
    this.state.robot.leafs -= 1;
  }

  put_stone_in_front() {
    this.bump();
    if (!this.state.robot.stone) {
      throw new RoboException("SpaceIsEmptyException", "Not carrying a stone");
    }
    const ahead = frontCell(this.state);
    if (ahead === "boundary" || ahead === "wall") {
      throw new RoboException("WallInFrontException", "Cannot put a stone: wall in front");
    }
    if (ahead === "stone") {
      throw new RoboException("StoneInFrontException", "There is already a stone in front");
    }
    if (ahead === "leaf") {
      throw new RoboException("LeafInFrontException", "Cannot put a stone: leaf in front");
    }
    const pos = frontPos(this.state);
    this.state.cells[pos.row][pos.col] = "stone";
    this.state.robot.stone = false;
  }

  take_stone_in_front() {
    this.bump();
    if (this.state.robot.stone) {
      throw new RoboException("SpaceIsFullException", "Already carrying a stone. Robo can hold only one.");
    }
    const ahead = frontCell(this.state);
    if (ahead === "boundary" || ahead === "wall") {
      throw new RoboException("WallInFrontException", "Wall in front — that is not a stone");
    }
    if (ahead === "leaf") {
      throw new RoboException("LeafInFrontException", "There is a leaf in front, not a stone");
    }
    if (ahead !== "stone") {
      throw new RoboException("StoneMissingException", "No stone in front");
    }
    const pos = frontPos(this.state);
    this.state.cells[pos.row][pos.col] = "empty";
    this.state.robot.stone = true;
  }

  set_mark() {
    this.bump();
    this.state.marks[this.state.robot.row][this.state.robot.col] = true;
  }

  unset_mark() {
    this.bump();
    this.state.marks[this.state.robot.row][this.state.robot.col] = false;
  }

  is_wall_in_front() {
    const ahead = frontCell(this.state);
    return ahead === "boundary" || ahead === "wall";
  }

  is_leaf_in_front() {
    return frontCell(this.state) === "leaf";
  }

  is_stone_in_front() {
    return frontCell(this.state) === "stone";
  }

  is_mark_in_front() {
    const pos = frontPos(this.state);
    if (!inBounds(this.state, pos.row, pos.col)) return false;
    return this.state.marks[pos.row][pos.col];
  }

  is_at_goal() {
    return this.state.robot.row === this.state.goal.row && this.state.robot.col === this.state.goal.col;
  }

  toss() {
    return Math.random() < 0.5;
  }

  is_successful() {
    return this.is_at_goal();
  }
}

export const MUTATING = new Set([
  "move",
  "turn_left",
  "take_leaf",
  "put_leaf",
  "put_stone_in_front",
  "take_stone_in_front",
  "set_mark",
  "unset_mark",
]);

export const METHODS = [
  "move",
  "turn_left",
  "is_facing_north",
  "is_carrying_stone",
  "is_carrying_leafs",
  "take_leaf",
  "put_leaf",
  "put_stone_in_front",
  "take_stone_in_front",
  "set_mark",
  "unset_mark",
  "is_wall_in_front",
  "is_leaf_in_front",
  "is_stone_in_front",
  "is_mark_in_front",
  "is_at_goal",
  "toss",
] as const;
