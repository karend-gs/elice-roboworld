import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";

type ExplainBody = {
  lessonTitle?: string;
  lessonIndex?: number;
  goal?: string;
  instructions?: string[];
  professorGuide?: string;
  apiReference?: string;
  initialMap?: string;
  currentMap?: string;
  worldNotes?: string;
  studentCode?: string;
  consoleLog?: string;
  lastGrade?: string | null;
};

const SYSTEM = `You are a patient programming tutor for an Elice-style RoboWorld lab.
Students write Python that controls a robot (robo) on a grid.

HARD RULES:
- HINTS ONLY. Never output a complete working program.
- Never list the full sequence of commands that solves the task.
- Do not paste instructor solution code even if it appears in the professor guide.
- Give the next conceptual nudge: which API to think about, what the map implies, what their code is missing or doing wrong.
- If they are stuck at the start, remind them of one small first step, not the whole path.
- If they already solved it, congratulate them and suggest a small extension.
- Keep it short: at most 3 short bullets or 2 short paragraphs.
- English only.`;

function attachExplainRoute(
  server: { middlewares: Connect.Server },
  apiKey: string | undefined,
  model: string,
) {
  server.middlewares.use("/api/explain", (req, res, next) => {
    if (req.method !== "POST") {
      next();
      return;
    }
    void handleExplain(req, res, apiKey, model);
  });
}

function readJson(req: Connect.IncomingMessage): Promise<ExplainBody> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8") || "{}";
        resolve(JSON.parse(raw) as ExplainBody);
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function writeJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function buildUserPrompt(body: ExplainBody) {
  return `Lesson ${body.lessonIndex ?? "?"}: ${body.lessonTitle ?? ""}

GOAL
${body.goal ?? ""}

INSTRUCTIONS
${(body.instructions ?? []).map((item, i) => `${i + 1}. ${item}`).join("\n")}

ROBO API
${body.apiReference ?? ""}

PROFESSOR GUIDE (intended approach — do not paste this as a solution)
${body.professorGuide ?? ""}

INITIAL WORLD MAP
Legend: # wall, - empty, L leaf, O stone, G goal, N/E/S/W robot facing that way
${body.initialMap ?? ""}

CURRENT WORLD (after any run so far)
${body.currentMap ?? ""}

WORLD NOTES
${body.worldNotes ?? ""}

STUDENT CODE
\`\`\`python
${body.studentCode ?? ""}
\`\`\`

LAST CONSOLE OUTPUT
${body.consoleLog || "(none)"}

LAST GRADE
${body.lastGrade || "(not submitted)"}

Give a hint for the next step only.`;
}

async function handleExplain(
  req: IncomingMessage,
  res: ServerResponse,
  apiKey: string | undefined,
  model: string,
) {
  if (!apiKey) {
    writeJson(res, 501, {
      error: "Missing OPENAI_API_KEY. Add it to a .env file in elice-roboworld and restart npm run dev.",
    });
    return;
  }

  let body: ExplainBody;
  try {
    body = await readJson(req);
  } catch {
    writeJson(res, 400, { error: "Invalid JSON body." });
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 400,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: buildUserPrompt(body) },
        ],
      }),
    });
    const data = (await response.json()) as {
      error?: { message?: string };
      choices?: { message?: { content?: string } }[];
    };
    if (!response.ok) {
      writeJson(res, 502, { error: data.error?.message || `OpenAI error ${response.status}` });
      return;
    }
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      writeJson(res, 502, { error: "OpenAI returned an empty hint." });
      return;
    }
    writeJson(res, 200, { hint: text });
  } catch (err) {
    writeJson(res, 502, { error: err instanceof Error ? err.message : "Failed to reach OpenAI." });
  }
}

export function explainApiPlugin(apiKey: string | undefined, model = "gpt-4o-mini"): Plugin {
  return {
    name: "explain-api",
    configureServer(server) {
      attachExplainRoute(server, apiKey, model);
    },
    configurePreviewServer(server) {
      attachExplainRoute(server, apiKey, model);
    },
  };
}
