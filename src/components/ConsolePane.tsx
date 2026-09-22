import type { LogLine } from "../engine/types";
import { useEffect, useRef } from "react";

type Props = {
  lines: LogLine[];
  height: number;
};

export function ConsolePane({ lines, height }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div className="console" style={{ height }}>
      <div className="console-head">Console</div>
      <div className="console-body" ref={bodyRef}>
        {lines.length === 0 ? <div className="console-empty">Logs appear here when you run.</div> : null}
        {lines.map((line, i) => (
          <div key={`${i}-${line.text}`} className={`log log-${line.level}`}>
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}
