<script lang="ts">
  import { sessionToken } from "#lib/auth/session.ts";
  const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
  let code = $state("");
  let message = $state("");
  let messageType = $state<"success" | "error">("success");
  let busy = $state(false);

  async function connect(event: SubmitEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    busy = true;
    message = "";
    try {
      const response = await fetch(`${api}/records/care-links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken()}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      });
      const result = await response.json();
      if (!response.ok || result.message) {
        messageType = "error";
        throw new Error(result.message ?? "Could not connect. Please try again.");
      }
      messageType = "success";
      message =
        result.status === "active"
          ? "You are already connected to this care team member."
          : "Request sent! Your midwife will approve access before seeing your records.";
      code = "";
    } catch (error) {
      messageType = "error";
      message =
        error instanceof Error ? error.message : "Connection request failed.";
    } finally {
      busy = false;
    }
  }
</script>

<div class="flo-care-connect-card" id="care-team">
  <div class="flo-care-connect-header">
    <div class="flo-checkin-eyebrow">YOUR CARE TEAM</div>
    <h2 class="flo-checkin-title">Connect with your midwife</h2>
    <p class="flo-checkin-sub">
      Ask your midwife or health worker for their <strong>Sabi connection code</strong>. 
      Enter it below to request a link to their care team account.
    </p>
  </div>

  <form class="flo-care-form" onsubmit={connect}>
    <label class="flo-care-label" for="care-code">
      Midwife connection code
    </label>
    <div class="flo-care-input-row">
      <input
        id="care-code"
        class="flo-care-code-input"
        type="text"
        bind:value={code}
        required
        maxlength="8"
        placeholder="e.g. ABC123"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
      />
      <button class="flo-care-submit-btn" type="submit" disabled={busy || !code.trim()}>
        {busy ? "Sending…" : "Connect"}
      </button>
    </div>
    <small class="flo-care-hint">
      Codes are 6 characters. Your midwife can find theirs in their Sabi care portal.
    </small>
  </form>

  {#if message}
    <div
      class="flo-care-message"
      class:flo-care-success={messageType === "success"}
      class:flo-care-error={messageType === "error"}
      role="status"
    >
      {messageType === "success" ? "✓" : "!"} {message}
    </div>
  {/if}
</div>
