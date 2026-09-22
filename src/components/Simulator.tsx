import type { CSSProperties } from "react";
import type { Direction, WorldState } from "../engine/types";

const DIR_DEG: Record<Direction, number> = {
  EAST: 0,
  SOUTH: 90,
  WEST: 180,
  NORTH: 270,
};

type Props = {
  world: WorldState;
  crashed?: boolean;
  animMs: number;
};

export function Simulator({ world, crashed, animMs }: Props) {
  const maxDim = Math.max(world.rows, world.cols);
  const cell = Math.max(18, Math.min(44, Math.floor(420 / maxDim)));
  const width = world.cols * cell;
  const height = world.rows * cell;

  return (
    <div className="sim-stage">
      <div className="sim-grid" style={{ width, height, gridTemplateColumns: `repeat(${world.cols}, ${cell}px)` }}>
        {world.cells.map((row, r) =>
          row.map((kind, c) => {
            const isGoal = world.goal.row === r && world.goal.col === c;
            const marked = world.marks[r][c];
            return (
              <div
                key={`${r}-${c}`}
                className={`cell cell-${kind}${isGoal ? " cell-goal" : ""}${marked ? " cell-mark" : ""}`}
                style={{ width: cell, height: cell }}
              >
                {kind === "leaf" ? <Leaf /> : null}
                {kind === "stone" ? <Stone /> : null}
                {isGoal ? <Goal /> : null}
              </div>
            );
          }),
        )}
        <RobotSprite
          row={world.robot.row}
          col={world.robot.col}
          dir={world.robot.dir}
          size={cell}
          crashed={crashed}
          animMs={animMs}
        />
      </div>
    </div>
  );
}

function RobotSprite({
  row,
  col,
  dir,
  size,
  crashed,
  animMs,
}: {
  row: number;
  col: number;
  dir: Direction;
  size: number;
  crashed?: boolean;
  animMs: number;
}) {
  const style: CSSProperties = {
    width: size,
    height: size,
    transform: `translate(${col * size}px, ${row * size}px)`,
    transition: `transform ${animMs}ms cubic-bezier(0.2, 0.7, 0.2, 1)`,
  };
  return (
    <div className={`robot-wrap${crashed ? " is-crash" : ""}`} style={style} aria-label="Robo">
      <svg viewBox="0 0 64 64" className="robot-svg" style={{ transform: `rotate(${DIR_DEG[dir]}deg)` }}>
        <defs>
          <linearGradient id="rb" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b74f7" />
            <stop offset="100%" stopColor="#524fa1" />
          </linearGradient>
        </defs>
        <rect x="12" y="18" width="40" height="30" rx="12" fill="url(#rb)" />
        <rect x="18" y="24" width="28" height="14" rx="7" fill="#1b1638" />
        <circle cx="26" cy="31" r="2.4" fill="#7ee0ff" />
        <circle cx="38" cy="31" r="2.4" fill="#7ee0ff" />
        <rect x="28" y="10" width="8" height="8" rx="4" fill="#7353ea" />
        <circle cx="32" cy="10" r="3.2" fill="#00a6ff" />
        <path d="M48 32 L58 32 L53 28 Z" fill="#ffffff" opacity="0.9" />
        <rect x="20" y="48" width="8" height="6" rx="2" fill="#343e4b" />
        <rect x="36" y="48" width="8" height="6" rx="2" fill="#343e4b" />
      </svg>
    </div>
  );
}

function Leaf() {
  return (
    <svg viewBox="0 0 24 24" className="glyph leaf">
      <path d="M12 3c5 2 8 7 8 12-4 0-9-3-11-8 4 1 6-1 3-4z" fill="#2bb673" />
      <path d="M12 21c-1.5-4-2-8-1-13" stroke="#1b5e20" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

function Stone() {
  return (
    <svg viewBox="0 0 24 24" className="glyph stone">
      <rect x="4" y="6" width="16" height="13" rx="4" fill="#f0a14a" />
      <rect x="7" y="9" width="6" height="4" rx="2" fill="#ffd19a" opacity="0.8" />
    </svg>
  );
}

function Goal() {
  return (
    <svg viewBox="0 0 24 24" className="glyph goal">
      <circle cx="12" cy="12" r="8" fill="none" stroke="#b853ea" strokeWidth="2" strokeDasharray="3 2" />
      <circle cx="12" cy="12" r="3" fill="#b853ea" />
    </svg>
  );
}

