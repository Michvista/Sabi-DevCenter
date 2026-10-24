<script lang="ts">
  import { sessionToken } from "#lib/auth/session.ts";
  const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
  let email = $state("");
  let message = $state("");
  let busy = $state(false);
  async function connect(event: SubmitEvent) {
    event.preventDefault();
    busy = true;
    message = "";
    try {
      const response = await fetch(`${api}/records/care-links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken()}`,
        },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message ?? "Could not request a connection.");
      if (result.message) throw new Error(result.message);
      message =
        result.status === "active"
          ? "This care-team connection is already active."
          : "Request sent. Your midwife must approve access before seeing your records.";
      email = "";
    } catch (error) {
      message =
        error instanceof Error ? error.message : "Connection request failed.";
    } finally {
      busy = false;
    }
  }
</script>

<section class="care-link-card" id="care-team">
  <div>
    <span class="food-kicker">YOUR CARE TEAM</span>
    <h3>Connect with your midwife</h3>
    <p>
      Enter the email address on their Sabi care-team account. They must approve
      before viewing your shared check-ins.
    </p>
  </div>
  <form onsubmit={connect}>
    <label for="midwife-email">Midwife email</label><input
      id="midwife-email"
      type="email"
      bind:value={email}
      required
      placeholder="midwife@example.com"
    /><button disabled={busy}>{busy ? "Sending…" : "Request connection"}</button
    >
  </form>
  {#if message}<p role="status">{message}</p>{/if}
</section>
