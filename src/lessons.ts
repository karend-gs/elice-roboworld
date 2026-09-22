import type { GradeResult, WorldState } from "./engine/types";
import { parseWorld } from "./engine/world";

export type Lesson = {
  id: string;
  index: number;
  title: string;
  minutes: number;
  goal: string;
  instructions: string[];
  hint: string;
  skeleton: string;
  world: string;
  nleafs?: number;
  grade: (world: WorldState) => GradeResult;
};

function atGoal(world: WorldState, extraOk = true, fail = "Reach the purple goal cell."): GradeResult {
  if (world.robot.row === world.goal.row && world.robot.col === world.goal.col && extraOk) {
    return { passed: true, message: "Correct! Robo reached the goal." };
  }
  return { passed: false, message: fail };
}

function leafCount(world: WorldState) {
  let n = 0;
  for (const row of world.cells) {
    for (const cell of row) if (cell === "leaf") n += 1;
  }
  return n;
}

export const LESSONS: Lesson[] = [
  {
    id: "first-steps",
    index: 1,
    title: "First steps",
    minutes: 5,
    goal: "Move Robo to the purple goal cell.",
    instructions: [
      "Robo (blue) is facing east.",
      "Call `robo.move()` to walk one cell forward.",
      "Keep moving until you reach the goal.",
    ],
    hint: "The goal is 5 cells away. Call `robo.move()` five times.",
    skeleton: `# Move Robo to the purple goal (G).
# Basic command: robo.move()

robo.move()
`,
    world: `########
#E----G#
########`,
    grade: (w) => atGoal(w),
  },
  {
    id: "turning",
    index: 2,
    title: "Turning",
    minutes: 8,
    goal: "Turn the corner and reach the goal.",
    instructions: [
      "`robo.turn_left()` rotates 90 degrees left in place.",
      "RoboWorld has no `turn_right()`. Write it yourself.",
      "Turning right = `turn_left()` three times.",
    ],
    hint: `To turn right, define a function:

def turn_right():
    robo.turn_left()
    robo.turn_left()
    robo.turn_left()
`,
    skeleton: `# Turn the corner and reach the goal.
# robo.move() / robo.turn_left()

def turn_right():
    # TODO: implement this with turn_left
    pass

robo.move()
`,
    world: `######
#E---#
#----#
#---G#
######`,
    grade: (w) => atGoal(w),
  },
  {
    id: "loops",
    index: 3,
    title: "Loops & leaves",
    minutes: 10,
    goal: "Pick up every leaf in the corridor, then reach the goal.",
    instructions: [
      "When you stand on a leaf, call `robo.take_leaf()` to pick it up.",
      "Repeat the same action with `for i in range(n):`.",
      "Submit only passes if every leaf is collected.",
    ],
    hint: `Move, then pick up, and repeat:

for i in range(3):
    robo.move()
    robo.take_leaf()
robo.move()
`,
    skeleton: `# Collect every green leaf, then go to the goal.

for i in range(3):
    robo.move()
    # TODO: pick up the leaf

robo.move()
`,
    world: `#######
#ELLLG#
#######`,
    grade: (w) =>
      atGoal(
        w,
        leafCount(w) === 0,
        leafCount(w) === 0 ? "Reach the goal cell." : "Collect every leaf.",
      ),
  },
  {
    id: "conditionals",
    index: 4,
    title: "Conditionals",
    minutes: 10,
    goal: "Sense walls and walk to the goal. Do not count the cells.",
    instructions: [
      "`robo.is_wall_in_front()` is True if the next cell is a wall (or the map edge).",
      "`robo.is_at_goal()` is True when Robo stands on the goal.",
      "Use `while` and `if` to follow the path.",
    ],
    hint: `def turn_right():
    for _ in range(3):
        robo.turn_left()

while not robo.is_at_goal():
    if robo.is_wall_in_front():
        turn_right()
    else:
        robo.move()
`,
    skeleton: `# Do not count cells. Use sensors to reach the goal.

def turn_right():
    for _ in range(3):
        robo.turn_left()

while not robo.is_at_goal():
    if robo.is_wall_in_front():
        turn_right()
    else:
        robo.move()
`,
    world: `###########
#E--------#
#########-#
#G--------#
###########`,
    grade: (w) => atGoal(w),
  },
  {
    id: "functions",
    index: 5,
    title: "Functions",
    minutes: 12,
    goal: "Write a function that goes around the obstacle and reaches the goal.",
    instructions: [
      "You must walk around the wall block in the middle.",
      "Bundle steps into functions like `turn_right()` and `around_block()`.",
      "Functions are the best way to reuse the same pattern.",
    ],
    hint: `def turn_right():
    for _ in range(3):
        robo.turn_left()

Walk forward until you hit the wall, turn right to go south, then follow the wall east again.`,
    skeleton: `def turn_right():
    for _ in range(3):
        robo.turn_left()

def around_block():
    # TODO: path around the wall block
    pass

robo.move()
around_block()
`,
    world: `#########
#E-###--#
#--###--#
#------G#
#########`,
    grade: (w) => atGoal(w),
  },
  {
    id: "stones",
    index: 6,
    title: "Stones",
    minutes: 12,
    goal: "Pick up the stone in front, clear the path, then reach the goal.",
    instructions: [
      "Orange stones are not walkable. Pick one up with `robo.take_stone_in_front()`.",
      "Robo can carry **only one** stone.",
      "Put it down with `robo.put_stone_in_front()`.",
    ],
    hint: `robo.take_stone_in_front()
robo.move()
robo.move()
robo.turn_left()
robo.turn_left()
robo.put_stone_in_front()
robo.turn_left()
robo.turn_left()
# then move to the goal
`,
    skeleton: `# Pick up the stone to open the path, then go to the goal.

robo.take_stone_in_front()
robo.move()
`,
    world: `#########
#EO----G#
#########`,
    grade: (w) => atGoal(w),
  },
  {
    id: "maze",
    index: 7,
    title: "Maze",
    minutes: 15,
    goal: "Get through the maze and reach the goal.",
    instructions: [
      "Use wall sensors, turning, and loops.",
      "Left-hand rule: keep a wall on your left and you can escape.",
      "Hard-coding the path also passes.",
    ],
    hint: `Left-hand wall following:

def turn_right():
    for _ in range(3):
        robo.turn_left()

while not robo.is_at_goal():
    robo.turn_left()
    if robo.is_wall_in_front():
        robo.turn_left()
        robo.turn_left()
        if robo.is_wall_in_front():
            robo.turn_left()
            robo.turn_left()
            if robo.is_wall_in_front():
                robo.turn_left()
                robo.turn_left()
            else:
                robo.move()
        else:
            robo.move()
    else:
        robo.move()
`,
    skeleton: `def turn_right():
    for _ in range(3):
        robo.turn_left()

while not robo.is_at_goal():
    # TODO: find a way through the maze
    robo.move()
`,
    world: `###########
#E--------#
#-#######-#
#-------#-#
#######-#-#
#G------#.#
###########`,
    grade: (w) => atGoal(w),
  },
];

export function lessonWorld(lesson: Lesson): WorldState {
  return parseWorld(lesson.world, lesson.nleafs ?? 0);
}
