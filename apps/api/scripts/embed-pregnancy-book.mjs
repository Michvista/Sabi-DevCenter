import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../../../", import.meta.url);
const notesPath = new URL(
  "apps/web/src/lib/data/pregnancy-week-book-notes.json",
  root,
);
const outputPath = new URL(
  "apps/api/src/data/pregnancy-week-book-index.json",
  root,
);
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey)
  throw new Error("GEMINI_API_KEY is required for one-time book indexing.");

const data = JSON.parse(await readFile(notesPath, "utf8"));
const chunks = [];
for (const note of data.notes) {
  const text = `Pregnancy week ${note.week}. ${note.summary}`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        taskType: "RETRIEVAL_DOCUMENT",
        title: `Your Pregnancy Week by Week — week ${note.week}`,
        outputDimensionality: 768,
      }),
      signal: AbortSignal.timeout(20_000),
    },
  );
  const result = await response.json();
  if (!response.ok) {
    const message =
      result?.error?.message ?? `Gemini embedding failed (${response.status}).`;
    throw new Error(message);
  }
  const embedding = result.embedding?.values;
  if (!Array.isArray(embedding) || embedding.length !== 768)
    throw new Error(
      `Gemini returned an invalid embedding for week ${note.week}.`,
    );
  chunks.push({
    week: note.week,
    page: note.citationPages[0],
    text,
    embedding,
    source: data.source,
    rights: "Used with permission as confirmed by the project owner",
  });
}
await writeFile(
  outputPath,
  `${JSON.stringify({ model: "gemini-embedding-001", chunks }, null, 2)}\n`,
);
console.log(
  `Indexed ${chunks.length} page-cited pregnancy-week excerpts for persistent retrieval.`,
);
