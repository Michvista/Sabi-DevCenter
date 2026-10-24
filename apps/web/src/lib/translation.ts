export type GuideLanguage = "ha" | "ig" | "yo" | "pcm";

function cacheKey(text: string, language: GuideLanguage) {
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33) ^ text.charCodeAt(index);
  }
  return `sabi-guide-translation-v1:${language}:${hash >>> 0}`;
}

export async function translateGuideText(
  text: string,
  language: GuideLanguage,
) {
  const key = cacheKey(text, language);
  const cached = localStorage.getItem(key);
  if (cached) return cached;

  const response = await fetch(
    `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/translation/guide`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    },
  );
  if (!response.ok) throw new Error("Translation is temporarily unavailable.");
  const result = (await response.json()) as { translation?: string };
  if (!result.translation)
    throw new Error("Translation is temporarily unavailable.");
  localStorage.setItem(key, result.translation);
  return result.translation;
}
