import type { Lesson } from "../lessons";

type Props = {
  lessons: Lesson[];
  lesson: Lesson;
  pythonReady: boolean;
  busy: boolean;
  onSelect: (id: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
  onExplain: () => void;
  explaining: boolean;
};

export function TopBar({
  lessons,
  lesson,
  pythonReady,
  busy,
  onSelect,
  onRun,
  onSubmit,
  onReset,
  onExplain,
  explaining,
}: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="logo" aria-hidden>
          e
        </div>
        <div className="brand-text">
          <strong>Elice</strong>
          <span>RoboWorld</span>
        </div>
      </div>
      <label className="lesson-select">
        <span className="sr-only">Select lesson</span>
        <select value={lesson.id} onChange={(e) => onSelect(e.target.value)} disabled={busy}>
          {lessons.map((item) => (
            <option key={item.id} value={item.id}>
              {item.index}. {item.title}
            </option>
          ))}
        </select>
      </label>
      <div className="spacer" />
      <div className={`engine-pill${pythonReady ? " is-ready" : ""}`}>
        <span className="pulse" />
        {pythonReady ? "Python ready" : "Loading Python"}
      </div>
      <button type="button" className="btn explain" onClick={onExplain} disabled={busy || explaining}>
        {explaining ? "Hinting…" : "Explain"}
      </button>
      <button type="button" className="btn ghost" onClick={onReset} disabled={busy}>
        Reset
      </button>
      <button type="button" className="btn primary" onClick={onRun} disabled={busy || !pythonReady}>
        Run
      </button>
      <button type="button" className="btn dark" onClick={onSubmit} disabled={busy || !pythonReady}>
        Submit
      </button>
    </header>
  );
}
