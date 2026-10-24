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

  async function sendTest() {
    busy = true;
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
      busy = false;
    }
  }
</script>

{#if supported}<section
    class="notification-optin"
    aria-label="Browser reminders"
  >
    <div>
      <strong>Weekly check-in reminders</strong><small
        >One gentle browser notification on Mondays and the day before a saved
        antenatal visit, at 9am Lagos time. No symptoms or health details are
        sent in the notification.</small
      >{#if message}<small role="status">{message}</small>{/if}
    </div>
    <div class="notification-actions">
      {#if enabled}<button type="button" disabled={busy} onclick={sendTest}
          >Send test</button
        >{/if}
      <button type="button" disabled={busy} onclick={toggle}
        >{busy ? "Updating…" : enabled ? "Turn off" : "Enable"}</button
      >
    </div>
  </section>{/if}
