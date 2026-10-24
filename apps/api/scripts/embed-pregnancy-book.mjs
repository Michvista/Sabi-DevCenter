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
if (data.notes.length !== 40) {
  throw new Error("The source guide must contain all 40 pregnancy weeks.");
}
const texts = data.notes.map((note) => `Pregnancy week ${note.week}. ${note.summary}`);
const response = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text }] },
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: 768,
      })),
    }),
    signal: AbortSignal.timeout(60_000),
  },
);
const result = await response.json();
if (!response.ok) {
  const message =
    result?.error?.message ?? `Gemini embedding failed (${response.status}).`;
  throw new Error(message);
}
if (!Array.isArray(result.embeddings) || result.embeddings.length !== 40) {
  throw new Error("Gemini returned an incomplete batch of weekly embeddings.");
}
const chunks = data.notes.map((note, index) => {
  const embedding = result.embeddings[index]?.values;
  if (!Array.isArray(embedding) || embedding.length !== 768) {
    throw new Error(`Gemini returned an invalid embedding for week ${note.week}.`);
  }
  return {
    week: note.week,
    page: note.citationPages[0],
    citationPages: note.citationPages,
    sections: note.sections,
    text: texts[index],
    embedding,
    source: data.source,
    rights: "Used with permission as confirmed by the project owner",
  };
});
await writeFile(
  outputPath,
  `${JSON.stringify({ model: "gemini-embedding-001", chunks }, null, 2)}\n`,
);
console.log(
  `Indexed ${chunks.length} page-cited pregnancy-week excerpts for persistent retrieval.`,
);
