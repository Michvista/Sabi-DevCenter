/** Retry one transient DNS resolver failure without weakening TLS checks. */
export async function fetchWithDnsRetry(
  input: string | URL,
  init: RequestInit,
  fetcher: typeof fetch = fetch,
) {
  try {
    return await fetcher(input, init);
  } catch (error) {
    const cause = (error as { cause?: { code?: string } }).cause;
    if (cause?.code !== "EAI_AGAIN") throw error;
    await new Promise((resolve) => setTimeout(resolve, 250));
    return fetcher(input, init);
  }
}
