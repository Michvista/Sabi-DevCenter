<script lang="ts">
  import { sessionToken } from "#lib/auth/session.ts";
  import { onMount } from "svelte";

  const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
  let code = $state("");
  let message = $state("");
  let messageType = $state<"success" | "error">("success");
  let busy = $state(false);

  let connection = $state<{
    connected: boolean;
    midwifeName?: string;
    midwifeEmail?: string;
    status?: string;
  }>({ connected: false });
  let loadingConnection = $state(true);

  // Chat message state
  let chatText = $state("");
  let sendingChat = $state(false);
  let chatSent = $state(false);

  async function checkConnection() {
    loadingConnection = true;
    try {
      const res = await fetch(`${api}/records/care-links/status`, {
        headers: { Authorization: `Bearer ${sessionToken()}` },
      });
      if (res.ok) {
        connection = await res.json();
      }
    } catch {
      // keep default
    } finally {
      loadingConnection = false;
    }
  }

  onMount(() => {
    void checkConnection();
  });

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
          ? "You are connected! Your midwife can now review your check-ins."
          : "Request sent! Your midwife will approve access before seeing your records.";
      code = "";
      await checkConnection();
    } catch (error) {
      messageType = "error";
      message =
        error instanceof Error ? error.message : "Connection request failed.";
    } finally {
      busy = false;
    }
  }

  async function sendChatMessage(e: SubmitEvent) {
    e.preventDefault();
    if (!chatText.trim() || sendingChat) return;
    sendingChat = true;
    try {
      // Log as a check-in note so midwife sees it immediately in their patient panel
      await fetch(`${api}/records/check-ins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken()}`,
        },
        body: JSON.stringify({
          mood: "message_to_midwife",
          symptoms: [],
          note: chatText.trim(),
        }),
      });
      chatSent = true;
      chatText = "";
      setTimeout(() => {
        chatSent = false;
      }, 4000);
    } catch {
      // silent fail
    } finally {
      sendingChat = false;
    }
  }
</script>

<div class="flo-care-connect-card" id="care-team">
  {#if connection.connected}
    <!-- ACTIVE CONNECTION VIEW -->
    <div class="rounded-2xl bg-linear-to-br from-[#f8faf7] to-[#f2f6f0] border border-[#d6e5d2] p-6 mb-6">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#809474]/20 text-[#385a38] text-xs font-bold uppercase tracking-wider">
          <span class="w-2 h-2 rounded-full bg-[#475842] animate-pulse"></span>
          Active Care Connection
        </span>
        <span class="text-xs text-[#6e7264] font-medium">Care Held with Dignity</span>
      </div>

      <div class="flex items-center gap-4 mb-4">
        <div class="w-14 h-14 rounded-2xl bg-[#809474] text-white flex items-center justify-center text-xl font-bold font-serif shadow-xs">
          {connection.midwifeName ? connection.midwifeName.slice(0, 2).toUpperCase() : "MW"}
        </div>
        <div>
          <h3 class="font-serif text-xl font-semibold text-[#242b22]">{connection.midwifeName ?? "Assigned Midwife"}</h3>
          <p class="text-xs text-[#525547] mt-0.5">{connection.midwifeEmail ?? "Primary Maternity Health Worker"}</p>
          <span class="inline-block mt-1 text-[11px] font-semibold text-[#475842]">
            ✓ Reviews your weekly check-ins &amp; safety reports
          </span>
        </div>
      </div>

      <p class="text-xs text-[#65675c] leading-relaxed pt-3 border-t border-[#dce8d9]">
        Your midwife is connected directly through Sabi. When you complete a wellness check-in or log symptoms,
        they appear immediately on your midwife's care board.
      </p>
    </div>

    <!-- DIRECT MESSAGE / QUESTION BOX -->
    <div class="rounded-2xl bg-white border border-[#e7e4dc] p-6">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 rounded-lg bg-[#809474]/15 flex items-center justify-center text-[#475842]">
          <i class="iconoir-chat-bubble-check text-base"></i>
        </div>
        <div>
          <h4 class="font-serif text-base font-semibold text-[#2b2c28]">Message Your Midwife</h4>
          <span class="text-xs text-[#77786f]">Leave a question or note for your next antenatal review</span>
        </div>
      </div>

      <form class="mt-4 space-y-3" onsubmit={sendChatMessage}>
        <textarea
          bind:value={chatText}
          required
          rows="3"
          maxlength="500"
          placeholder="Ask a question about your symptoms, appointment dates, or nutrition…"
          class="w-full p-3.5 text-sm rounded-xl border border-[#dedad0] bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-[#809474]/40 focus:bg-white placeholder-[#9a988f] resize-none"
        ></textarea>

        <div class="flex items-center justify-between">
          <small class="text-xs text-[#8e9083]">Non-urgent messages only. For emergencies call 112.</small>
          <button
            type="submit"
            disabled={sendingChat || !chatText.trim()}
            class="py-2 px-5 text-xs font-semibold rounded-xl bg-[#809474] text-white hover:bg-[#6c8060] disabled:opacity-50 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <i class="iconoir-arrow-right text-xs"></i>
            <span>{sendingChat ? "Sending…" : "Send to Midwife"}</span>
          </button>
        </div>
      </form>

      {#if chatSent}
        <div class="mt-3 p-3 rounded-xl bg-[#edf5eb] border border-[#d6e5d2] text-xs font-medium text-[#385a38] flex items-center gap-2">
          <span>✓</span>
          <span>Message logged! Your midwife will see it on their clinical overview.</span>
        </div>
      {/if}
    </div>

  {:else}
    <!-- NOT YET CONNECTED FORM -->
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
          placeholder="e.g. SABICRE"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
        />
        <button class="flo-care-submit-btn" type="submit" disabled={busy || !code.trim()}>
          {busy ? "Sending…" : "Connect"}
        </button>
      </div>
      <small class="flo-care-hint">
        Codes are 6 characters. If using the demo, enter <strong>SABICRE</strong> to link directly with Demo Midwife.
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
  {/if}
</div>
