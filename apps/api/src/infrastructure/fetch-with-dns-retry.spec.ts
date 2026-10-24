import { describe, expect, it, vi } from "vitest";
import { fetchWithDnsRetry } from "./fetch-with-dns-retry";

describe("fetchWithDnsRetry", () => {
  it("retries one temporary EAI_AGAIN DNS failure", async () => {
    const dnsError = Object.assign(new Error("temporary DNS failure"), {
      cause: { code: "EAI_AGAIN" },
    });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(dnsError)
      .mockResolvedValueOnce(new Response("ok"));

    const response = await fetchWithDnsRetry(
      "https://example.test",
      {},
      fetcher,
    );

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(await response.text()).toBe("ok");
  });

  it("does not retry other failures", async () => {
    const error = Object.assign(new Error("connection refused"), {
      cause: { code: "ECONNREFUSED" },
    });
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(error);

    await expect(
      fetchWithDnsRetry("https://example.test", {}, fetcher),
    ).rejects.toBe(error);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
