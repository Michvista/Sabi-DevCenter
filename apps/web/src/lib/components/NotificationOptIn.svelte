<script lang="ts">
  import { sessionToken } from "#lib/auth/session.ts";
  import { onMount } from "svelte";
  const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
  let supported = $state(false);
  let enabled = $state(false);
  let busy = $state(false);
  let message = $state("");
  onMount(async () => {
    supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    if (supported) {
      try {
        const reg =
          await navigator.serviceWorker.register("/service-worker.js");
        enabled = !!(await reg.pushManager.getSubscription());
      } catch {
        supported = false;
      }
    }
  });
  function decodeKey(value: string) {
    const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
    const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }
  async function toggle() {
    busy = true;
    message = "";
    try {
      const reg = await navigator.serviceWorker.ready;
      const current = await reg.pushManager.getSubscription();
      if (current) {
        await fetch(`${api}/notifications/subscribe`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken()}`,
          },
          body: JSON.stringify({ endpoint: current.endpoint }),
        });
        await current.unsubscribe();
        enabled = false;
        message = "Weekly browser reminders are off.";
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted")
          throw new Error(
            "Allow notifications in your browser to turn reminders on.",
          );
        const keyResponse = await fetch(
          `${api}/notifications/vapid-public-key`,
        );
        const { publicKey } = await keyResponse.json();
        if (!publicKey)
          throw new Error(
            "Browser reminders are not configured on the API yet.",
          );
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeKey(publicKey),
        });
        const payload = subscription.toJSON();
        const response = await fetch(`${api}/notifications/subscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken()}`,
          },
          body: JSON.stringify({
            endpoint: payload.endpoint,
            p256dh: payload.keys?.p256dh,
            auth: payload.keys?.auth,
          }),
        });
        if (!response.ok)
          throw new Error(
            "Could not save your reminder preference. Check the database connection.",
          );
        enabled = true;
        message = "Weekly reminders are on. You can turn them off here.";
      }
    } catch (error) {
      message =
        error instanceof Error ? error.message : "Could not update reminders.";
    } finally {
      busy = false;
    }
  }

  let testing = $state(false);

  async function sendTest() {
    testing = true;
    message = "";
    try {
      const response = await fetch(`${api}/notifications/test`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken()}` },
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(result.message ?? "Test reminder failed.");
      message = "Test reminder sent. Check your browser notifications.";
    } catch (error) {
      message =
        error instanceof Error ? error.message : "Test reminder failed.";
    } finally {
      testing = false;
    }
  }
</script>

{#if supported}
  <section
    class="rounded-2xl border border-[#e7e4dc] bg-white p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    aria-label="Browser reminders"
  >
    <div class="space-y-1">
      <div class="flex items-center gap-2">
        <i class="iconoir-bell text-base text-[#809474]"></i>
        <strong class="font-serif text-base text-[#2b2c28]">Weekly check-in reminders</strong>
      </div>
      <p class="text-xs text-[#72746b] leading-relaxed max-w-md">
        One gentle browser notification on Mondays and the day before a saved
        antenatal visit, at 9am Lagos time. No symptoms or health details are
        sent.
      </p>
      {#if message}
        <p class="text-xs font-medium text-[#475842] mt-1" role="status">{message}</p>
      {/if}
    </div>
    <div class="flex items-center gap-2 shrink-0 w-full sm:w-auto">
      {#if enabled}
        <button
          type="button"
          disabled={busy || testing}
          onclick={sendTest}
          class="flex-1 sm:flex-initial py-2 px-3 text-xs font-semibold rounded-xl border border-[#d6d2c4] text-[#475842] hover:bg-[#faf9f6] disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          {#if testing}
            <i class="iconoir-refresh animate-spin text-xs"></i>
            <span>Sending…</span>
          {:else}
            <span>Send test</span>
          {/if}
        </button>
      {/if}
      <button
        type="button"
        disabled={busy || testing}
        onclick={toggle}
        class="flex-1 sm:flex-initial py-2 px-4 text-xs font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        {#if busy}
          <i class="iconoir-refresh animate-spin text-xs"></i>
          <span>Updating…</span>
        {:else}
          <span>{enabled ? "Turn off" : "Enable"}</span>
        {/if}
      </button>
    </div>
  </section>
{/if}
