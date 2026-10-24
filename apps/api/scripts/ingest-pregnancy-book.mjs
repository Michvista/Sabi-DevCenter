import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "../../..");
const envPath = resolve(projectRoot, ".env");
const envText = await readFile(envPath, "utf8");
const env = Object.fromEntries(
  envText.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    return match ? [[match[1], match[2].replace(/^['"]|['"]$/g, "")]] : [];
  }),
);

async function updateEnv(values) {
  const lines = (await readFile(envPath, "utf8")).split(/\r?\n/);
  for (const [key, value] of Object.entries(values)) {
    const index = lines.findIndex((line) => line.startsWith(`${key}=`));
    if (index < 0) lines.push(`${key}=${value}`);
    else lines[index] = `${key}=${value}`;
  }
  await writeFile(envPath, lines.join("\n").replace(/\n+$/, "") + "\n", "utf8");
}

const apiKey = env.GEMINI_API_KEY;
if (!apiKey)
  throw new Error("Set GEMINI_API_KEY in the ignored .env file first.");
if (env.GEMINI_RAG_INGESTED === "true" && !process.argv.includes("--force")) {
  console.log("The pregnancy reference is already indexed in File Search.");
  process.exit(0);
}

const suppliedPdf = process.argv[2];
const bookPath = suppliedPdf
  ? resolve(projectRoot, suppliedPdf)
  : resolve(
      projectRoot,
      "Your Pregnancy Week by Week (Glade B. Curtis, Judith Schuler) (z-library.sk, 1lib.sk, z-lib.sk).pdf",
    );
const pdf = await readFile(bookPath);
const keyQuery = `key=${encodeURIComponent(apiKey)}`;
const apiBase = "https://generativelanguage.googleapis.com/v1beta";
const headers = {
  "Content-Type": "application/json",
  "x-goog-api-key": apiKey,
};

async function checkedJson(response, action) {
  if (!response.ok) {
    throw new Error(
      `${action} failed (HTTP ${response.status}). Check Gemini API access and quota.`,
    );
  }
  return response.json();
}

let storeName = env.GEMINI_RAG_STORE;
if (!storeName) {
  const created = await checkedJson(
    await fetch(`${apiBase}/fileSearchStores`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        displayName: "Sabi pregnancy week-by-week publisher reference",
        embeddingModel: "models/gemini-embedding-2",
      }),
    }),
    "Creating the Gemini File Search store",
  );
  storeName = created.name;
  if (!storeName)
    throw new Error("Gemini did not return a File Search store name.");
  await updateEnv({ GEMINI_RAG_STORE: storeName });
}

let operation = env.GEMINI_RAG_OPERATION
  ? { name: env.GEMINI_RAG_OPERATION, done: false }
  : null;

if (!operation) {
  const documentsResponse = await fetch(
    `${apiBase}/${storeName}/documents?${keyQuery}`,
    { headers },
  );
  if (documentsResponse.ok) {
    const { documents = [] } = await documentsResponse.json();
    const previous = documents.filter(
      (document) =>
        document.displayName ===
        "Your Pregnancy Week by Week — Curtis & Schuler (publisher-provided edition)",
    );
    if (
      previous.some((document) =>
        ["STATE_ACTIVE", "STATE_COMPLETED"].includes(document.state),
      )
    ) {
      await updateEnv({ GEMINI_RAG_INGESTED: "true" });
      console.log("The book is already indexed in this File Search store.");
      process.exit(0);
    }
    for (const document of previous.filter(
      (item) => item.state === "STATE_FAILED",
    )) {
      await fetch(`${apiBase}/${document.name}?${keyQuery}&force=true`, {
        method: "DELETE",
        headers,
      });
    }
  }

  console.log(
    "Gemini File Search store ready. Uploading the publisher-provided PDF for indexing...",
  );
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/${storeName}:uploadToFileSearchStore?${keyQuery}`;
  const start = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(pdf.byteLength),
      "X-Goog-Upload-Header-Content-Type": "application/pdf",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      displayName:
        "Your Pregnancy Week by Week — Curtis & Schuler (publisher-provided edition)",
      customMetadata: [
        { key: "author", stringValue: "Glade B. Curtis and Judith Schuler" },
        { key: "sourceType", stringValue: "Publisher-provided book" },
      ],
    }),
  });
  if (!start.ok)
    throw new Error(
      `Starting the Gemini upload failed (HTTP ${start.status}).`,
    );
  const resumableUrl = start.headers.get("x-goog-upload-url");
  if (!resumableUrl)
    throw new Error("Gemini did not return a resumable upload URL.");

  const upload = await fetch(resumableUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(pdf.byteLength),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
      "Content-Type": "application/pdf",
    },
    body: pdf,
  });
  operation = await checkedJson(upload, "Uploading the pregnancy reference");
  if (!operation.name)
    throw new Error("Gemini did not return an indexing operation name.");
  await updateEnv({ GEMINI_RAG_OPERATION: operation.name });
}

const deadline = Date.now() + 10 * 60_000;
while (!operation.done && Date.now() < deadline) {
  await new Promise((resolve) => setTimeout(resolve, 5_000));
  try {
    operation = await checkedJson(
      await fetch(`${apiBase}/${operation.name}?${keyQuery}`, { headers }),
      "Checking File Search indexing status",
    );
  } catch {
    throw new Error(
      "Gemini accepted the upload, but its indexing status could not be checked because the API is unreachable. Re-run this command later to resume polling without uploading the PDF again.",
    );
  }
  console.log(
    `Indexing status: ${operation.done ? "complete" : "in progress"}`,
  );
}
if (!operation.done) {
  throw new Error(
    "Gemini indexing is still in progress. Re-run this command to resume polling.",
  );
}

await updateEnv({ GEMINI_RAG_INGESTED: "true", GEMINI_RAG_OPERATION: "" });
console.log(
  "Pregnancy book indexed. Store name saved in the ignored .env file; no API key was printed.",
);
