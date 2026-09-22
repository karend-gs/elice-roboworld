import type { Cell, WorldState } from "./types";

const DIR_CHAR: Record<WorldState["robot"]["dir"], string> = {
  NORTH: "N",
  EAST: "E",
  SOUTH: "S",
  WEST: "W",
};

const CELL_CHAR: Record<Cell, string> = {
  wall: "#",
  empty: "-",
  leaf: "L",
  stone: "O",
};

export function worldToAscii(world: WorldState) {
  const lines: string[] = [];
  for (let r = 0; r < world.rows; r += 1) {
    let line = "";
    for (let c = 0; c < world.cols; c += 1) {
      const robotHere = world.robot.row === r && world.robot.col === c;
      const goalHere = world.goal.row === r && world.goal.col === c;
      if (robotHere) {
        line += DIR_CHAR[world.robot.dir];
      } else if (world.cells[r][c] !== "empty") {
        line += CELL_CHAR[world.cells[r][c]];
      } else if (goalHere) {
        line += "G";
      } else if (world.marks[r][c]) {
        line += "M";
      } else {
        line += "-";
      }
    }
    lines.push(line);
  }
  return lines.join("\n");
}

export function describeWorld(world: WorldState) {
  const leaves: string[] = [];
  const stones: string[] = [];
  for (let r = 0; r < world.rows; r += 1) {
    for (let c = 0; c < world.cols; c += 1) {
      if (world.cells[r][c] === "leaf") leaves.push(`(${r},${c})`);
      if (world.cells[r][c] === "stone") stones.push(`(${r},${c})`);
    }
  }
  const onGoal = world.robot.row === world.goal.row && world.robot.col === world.goal.col;
  return [
    `Size: ${world.rows} rows x ${world.cols} columns. Coordinates are (row, col), origin top-left.`,
    `Robot at (${world.robot.row},${world.robot.col}) facing ${world.robot.dir}.`,
    `Carrying ${world.robot.leafs} leaf/leaves. Carrying stone: ${world.robot.stone ? "yes" : "no"}.`,
    `Goal at (${world.goal.row},${world.goal.col}). Robot is ${onGoal ? "ON" : "not on"} the goal.`,
    `Leaves at: ${leaves.length ? leaves.join(", ") : "none"}.`,
    `Stones at: ${stones.length ? stones.join(", ") : "none"}.`,
  ].join("\n");
}

export const ROBO_API = [
  "robo.move() — one cell forward; fails on wall or stone",
  "robo.turn_left() — rotate 90 degrees counter-clockwise",
  "robo.is_wall_in_front() — True if wall or map edge ahead",
  "robo.is_at_goal() — True if standing on the purple goal",
  "robo.take_leaf() / robo.put_leaf() — pick up or drop a leaf on the current cell",
  "robo.take_stone_in_front() / robo.put_stone_in_front() — pick up or drop one stone ahead",
  "robo.is_leaf_in_front() / robo.is_stone_in_front()",
  "There is no built-in turn_right(); students define it with three turn_left calls",
].join("\n");
