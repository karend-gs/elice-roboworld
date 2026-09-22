import type { LogLine, RunResult, Snapshot, WorldState } from "./types";
import { cloneWorld, METHODS, MUTATING, RoboException, RoboWorld } from "./world";

type Pyodide = {
  registerJsModule: (name: string, mod: Record<string, unknown>) => void;
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
  globals: { set: (name: string, value: unknown) => void };
};

type Session = {
  engine: RoboWorld;
  snapshots: Snapshot[];
  logs: LogLine[];
};

type RwWindow = Window & {
  loadPyodide?: (opts: { indexURL: string }) => Promise<Pyodide>;
  __rwSession?: Session | null;
  __rwBridgeReady?: boolean;
};

const PYODIDE_VERSION = "0.27.2";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodidePromise: Promise<Pyodide> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Pyodide script failed to load"));
    document.head.appendChild(script);
  });
}

export async function loadPython(): Promise<Pyodide> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadScript(`${PYODIDE_BASE}pyodide.js`);
      const load = (window as RwWindow).loadPyodide;
      if (!load) {
        throw new Error("loadPyodide is not available");
      }
      return load({ indexURL: PYODIDE_BASE });
    })();
  }
  return pyodidePromise;
}

const PRELUDE = `
import json, types, sys

class WallInFrontException(Exception):
    pass
class StoneInFrontException(Exception):
    pass
class LeafMissingException(Exception):
    pass
class NoMoreLeafsException(Exception):
    pass
class CellOccupiedException(Exception):
    pass
class SpaceIsEmptyException(Exception):
    pass
class SpaceIsFullException(Exception):
    pass
class LeafInFrontException(Exception):
    pass
class StoneMissingException(Exception):
    pass
class TimeoutException(Exception):
    pass

_EXC = {
    "WallInFrontException": WallInFrontException,
    "StoneInFrontException": StoneInFrontException,
    "LeafMissingException": LeafMissingException,
    "NoMoreLeafsException": NoMoreLeafsException,
    "CellOccupiedException": CellOccupiedException,
    "SpaceIsEmptyException": SpaceIsEmptyException,
    "SpaceIsFullException": SpaceIsFullException,
    "LeafInFrontException": LeafInFrontException,
    "StoneMissingException": StoneMissingException,
    "TimeoutException": TimeoutException,
}

from rw_bridge import call as _rw_call

def _invoke(name):
    payload = json.loads(_rw_call(name))
    if not payload["ok"]:
        exc = _EXC.get(payload["exc"], RuntimeError)
        raise exc(payload["msg"])
    return payload["value"]

class Robo:
    def move(self):
        return _invoke("move")
    def turn_left(self):
        return _invoke("turn_left")
    def is_facing_north(self):
        return _invoke("is_facing_north")
    def is_carrying_stone(self):
        return _invoke("is_carrying_stone")
    def is_carrying_leafs(self):
        return _invoke("is_carrying_leafs")
    def take_leaf(self):
        return _invoke("take_leaf")
    def put_leaf(self):
        return _invoke("put_leaf")
    def put_stone_in_front(self):
        return _invoke("put_stone_in_front")
    def take_stone_in_front(self):
        return _invoke("take_stone_in_front")
    def set_mark(self):
        return _invoke("set_mark")
    def unset_mark(self):
        return _invoke("unset_mark")
    def is_wall_in_front(self):
        return _invoke("is_wall_in_front")
    def is_leaf_in_front(self):
        return _invoke("is_leaf_in_front")
    def is_stone_in_front(self):
        return _invoke("is_stone_in_front")
    def is_mark_in_front(self):
        return _invoke("is_mark_in_front")
    def is_at_goal(self):
        return _invoke("is_at_goal")
    def toss(self):
        return _invoke("toss")
`.trim();

function dispatch(name: string) {
  const current = (window as RwWindow).__rwSession;
  if (!current) {
    return JSON.stringify({ ok: false, exc: "RuntimeError", msg: "No active world" });
  }
  const fn = (current.engine as unknown as Record<string, () => unknown>)[name];
  if (typeof fn !== "function" || !METHODS.includes(name as (typeof METHODS)[number])) {
    return JSON.stringify({ ok: false, exc: "AttributeError", msg: `Unknown method: ${name}` });
  }
  try {
    const value = fn.call(current.engine);
    if (MUTATING.has(name)) {
      current.snapshots.push({ world: cloneWorld(current.engine.state), action: name });
      current.logs.push({ level: "action", text: `robo.${name}()` });
    }
    return JSON.stringify({ ok: true, value: value ?? null });
  } catch (err) {
    const e = err as RoboException;
    current.snapshots.push({ world: cloneWorld(current.engine.state), action: "crash" });
    return JSON.stringify({
      ok: false,
      exc: e.name || "RuntimeError",
      msg: e.message || String(err),
    });
  }
}

export async function runStudentCode(initial: WorldState, code: string): Promise<RunResult> {
  const engine = new RoboWorld(cloneWorld(initial));
  const current: Session = {
    engine,
    snapshots: [{ world: cloneWorld(engine.state), action: "init" }],
    logs: [],
  };
  (window as RwWindow).__rwSession = current;

  const pyodide = await loadPython();
  const win = window as RwWindow;

  pyodide.setStdout({
    batched: (s) => {
      if (s.trim()) current.logs.push({ level: "info", text: s });
    },
  });
  pyodide.setStderr({
    batched: (s) => {
      if (s.trim()) current.logs.push({ level: "error", text: s });
    },
  });

  if (!win.__rwBridgeReady) {
    pyodide.registerJsModule("rw_bridge", { call: dispatch });
    await pyodide.runPythonAsync(PRELUDE);
    win.__rwBridgeReady = true;
  }

  pyodide.globals.set("USER_CODE", code);

  try {
    await pyodide.runPythonAsync(`
robo = Robo()
import types, sys
_mod = types.ModuleType("roboworld")
_mod.robo = robo
_mod.Robo = Robo
sys.modules["roboworld"] = _mod
_g = {
    "robo": robo,
    "Robo": Robo,
    "WallInFrontException": WallInFrontException,
    "StoneInFrontException": StoneInFrontException,
    "LeafMissingException": LeafMissingException,
    "NoMoreLeafsException": NoMoreLeafsException,
    "CellOccupiedException": CellOccupiedException,
    "SpaceIsEmptyException": SpaceIsEmptyException,
    "SpaceIsFullException": SpaceIsFullException,
    "LeafInFrontException": LeafInFrontException,
    "StoneMissingException": StoneMissingException,
    "TimeoutException": TimeoutException,
    "__name__": "__main__",
}
exec(USER_CODE, _g)
`);
    return { snapshots: current.snapshots, logs: current.logs, crashed: false };
  } catch (err) {
    const message = formatPyError(err);
    current.logs.push({ level: "error", text: message });
    return { snapshots: current.snapshots, logs: current.logs, error: message, crashed: true };
  }
}

function formatPyError(err: unknown) {
  const text = err instanceof Error ? err.message : String(err);
  const lines = text.split("\n").map((l) => l.trimEnd());
  const last = [...lines].reverse().find((l) => l.trim().length > 0);
  return last || text;
}
