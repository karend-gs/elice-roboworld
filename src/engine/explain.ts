import type { GradeResult, LogLine, WorldState } from "./types";
import type { Lesson } from "../lessons";
import { describeWorld, ROBO_API, worldToAscii } from "./describeWorld";

export async function requestHint(input: {
  lesson: Lesson;
  initialWorld: WorldState;
  currentWorld: WorldState;
  studentCode: string;
  logs: LogLine[];
  grade: GradeResult | null;
}) {
  const response = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lessonTitle: input.lesson.title,
      lessonIndex: input.lesson.index,
      goal: input.lesson.goal,
      instructions: input.lesson.instructions,
      professorGuide: input.lesson.hint,
      apiReference: ROBO_API,
      initialMap: `${input.lesson.world.trim()}\n\n${worldToAscii(input.initialWorld)}`,
      currentMap: worldToAscii(input.currentWorld),
      worldNotes: [
        "Initial layout:",
        describeWorld(input.initialWorld),
        "",
        "Current layout:",
        describeWorld(input.currentWorld),
      ].join("\n"),
      studentCode: input.studentCode,
      consoleLog: input.logs.map((line) => line.text).join("\n"),
      lastGrade: input.grade ? `${input.grade.passed ? "Passed" : "Failed"} — ${input.grade.message}` : null,
    }),
  });
  const data = (await response.json()) as { hint?: string; error?: string };
  if (!response.ok || !data.hint) {
    throw new Error(data.error || `Explain failed (${response.status})`);
  }
  return data.hint;
}
