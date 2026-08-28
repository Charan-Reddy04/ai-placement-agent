import { env } from "../config/env.js";

function stripFences(text = "") {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

export function aiConfigured() {
  return Boolean(env.aiApiUrl && env.aiApiKey && env.aiModel);
}

export async function askAI(prompt, { json = false, temperature = 0.15 } = {}) {
  if (!aiConfigured()) return null;
  const r = await fetch(`${env.aiApiUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.aiApiKey}`
    },
    body: JSON.stringify({
      model: env.aiModel,
      messages: [
        { role: "system", content: "You are an AI placement orchestration assistant. Be precise, fair, deterministic where rules are mandatory, and never invent candidate facts. Return valid JSON when requested." },
        { role: "user", content: prompt }
      ],
      temperature,
      ...(json ? { response_format: { type: "json_object" } } : {})
    })
  });
  if (!r.ok) throw new Error(`Groq AI request failed: ${r.status} ${await r.text()}`);
  const data = await r.json();
  const content = data.choices?.[0]?.message?.content || "";
  if (!json) return content;
  try { return JSON.parse(stripFences(content)); }
  catch { throw new Error("Groq returned invalid JSON"); }
}
