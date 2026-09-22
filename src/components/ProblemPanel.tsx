import type { Lesson } from "../lessons";

type Props = {
  lesson: Lesson;
  hintOpen: boolean;
  onToggleHint: () => void;
};

export function ProblemPanel({ lesson, hintOpen, onToggleHint }: Props) {
  return (
    <div className="problem">
      <div className="problem-kicker">
        <span>Lesson {String(lesson.index).padStart(2, "0")}</span>
        <span className="dot">·</span>
        <span>{lesson.minutes} min</span>
      </div>
      <h1>{lesson.title}</h1>
      <section>
        <h2>Goal</h2>
        <p>{lesson.goal}</p>
      </section>
      <section>
        <h2>Instructions</h2>
        <ol>
          {lesson.instructions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
      <section className="api">
        <h2>Robo API</h2>
        <ul>
          <li>
            <code>robo.move()</code> step forward
          </li>
          <li>
            <code>robo.turn_left()</code> turn 90° left
          </li>
          <li>
            <code>robo.is_wall_in_front()</code> wall ahead?
          </li>
          <li>
            <code>robo.is_at_goal()</code> standing on the goal?
          </li>
          <li>
            <code>robo.take_leaf()</code> / <code>put_leaf()</code>
          </li>
          <li>
            <code>robo.take_stone_in_front()</code>
          </li>
        </ul>
      </section>
      <button type="button" className="hint-btn" onClick={onToggleHint}>
        {hintOpen ? "Hide hint" : "Show hint"}
      </button>
      {hintOpen ? <pre className="hint">{lesson.hint}</pre> : null}
    </div>
  );
}
